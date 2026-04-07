import express from "express";
import { createServer } from "http";
import Stripe from "stripe";
import cors from "cors";
import { registerAuthRoutes } from "./authRoutes";
import { registerWebauthnRoutes } from "./webauthnRoutes";
import { registerFaceAuthRoutes } from "./faceAuthRoutes";
import { registerChatRoutes } from "./chatRoutes";
import { registerUploadRoutes } from "./uploadRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { createPayment as createPaymentRecord, getPaymentByTransactionId, getDb } from "../db";
import { sql } from "drizzle-orm";
import { createExpressMiddleware } from "@trpc/server/adapters/express";

export function createApp() {
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
  if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing");
  const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

  const app = express();
  const server = createServer(app);

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  app.use(cors({
    origin: true,
    methods: ["POST", "GET", "OPTIONS", "PUT", "PATCH", "DELETE"],
    credentials: true,
  }));

  // Stripe payment endpoint
  app.post("/api/payment/stripe-session", async (req, res) => {
    try {
      const { amount, description, caseId } = req.body;
      const amountUSD = Math.round(amount * 0.33);
      const amountTND = amount / 100;
      const origin = req.headers.origin || process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : `http://localhost:3001`;

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [{
          price_data: {
            currency: "usd",
            product_data: { name: description || "Donation" },
            unit_amount: amountUSD,
          },
          quantity: 1,
        }],
        mode: "payment",
        metadata: { caseId: String(caseId), amountTND: String(amountTND) },
        success_url: `${origin}/case/${caseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/case/${caseId}?canceled=true`,
      });

      if (!session.url) return res.status(500).json({ error: "Stripe session creation failed" });
      res.json({ url: session.url });
    } catch (err: any) {
      console.error("Stripe session error:", err);
      res.status(500).json({ error: err.message || "Stripe session error" });
    }
  });

  // Verify Stripe payment
  app.post("/api/payment/verify-stripe", async (req, res) => {
    try {
      const { sessionId } = req.body;
      if (!sessionId) return res.status(400).json({ error: "Missing sessionId" });

      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (session.payment_status !== "paid") {
        return res.status(400).json({ error: "Payment not completed", status: session.payment_status });
      }

      const caseId = parseInt(session.metadata?.caseId || "0");
      const amountTND = parseFloat(session.metadata?.amountTND || "0");
      if (!caseId || !amountTND) return res.status(400).json({ error: "Invalid payment metadata" });

      const existingPayment = await getPaymentByTransactionId(sessionId);
      if (existingPayment) return res.json({ success: true, alreadyProcessed: true, amount: amountTND });

      const db = await getDb();
      if (!db) return res.status(500).json({ error: "Database not available" });

      const amountInt = Math.round(amountTND);
      await createPaymentRecord({ caseId, amount: amountInt, status: "completed", paymentMethod: "stripe", transactionId: sessionId });
      await db.execute(sql`UPDATE cases SET current_amount = current_amount + ${amountInt} WHERE id = ${caseId}`);
      res.json({ success: true, amount: amountInt, caseId });
    } catch (err: any) {
      console.error("Stripe verify error:", err);
      res.status(500).json({ error: err.message || "Verification failed" });
    }
  });

  registerAuthRoutes(app);
  registerWebauthnRoutes(app);
  registerFaceAuthRoutes(app);
  registerChatRoutes(app);
  registerUploadRoutes(app);

  app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

  return { app, server };
}
