import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import Stripe from "stripe";
import cors from "cors";

// Import your routes
import { registerAuthRoutes } from "./authRoutes";
import { registerWebauthnRoutes } from "./webauthnRoutes";
import { registerFaceAuthRoutes } from "./faceAuthRoutes";
import { registerChatRoutes } from "./chatRoutes";
import { registerUploadRoutes } from "./uploadRoutes";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createPayment as createPaymentRecord, getPaymentByTransactionId, getDb } from "../db";
import { eq, sql } from "drizzle-orm";
import { cases } from "../../drizzle/schema";

// Stripe setup
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || "";
if (!STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY missing in .env");
const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });

// Express app & server
const app = express();
const server = createServer(app);

// JSON parsing
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// CORS (only once)
app.use(cors({
  origin: true,
  methods: ["POST", "GET", "OPTIONS"],
  credentials: true,
}));

// Stripe payment endpoint
app.post("/api/payment/stripe-session", async (req, res) => {
  try {
    const { amount, description, caseId } = req.body;

    // amount comes in as millimes (TND * 100) from the client
    // Convert to USD cents: millimes * 0.33 = USD cents
    const amountUSD = Math.round(amount * 0.33);
    // Original TND amount for DB storage
    const amountTND = amount / 100;

    const origin = req.headers.origin || `http://localhost:${req.socket.localPort}`;

    // Stripe Checkout session with metadata to track caseId and TND amount
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: description || "Donation" },
            unit_amount: amountUSD,
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      metadata: {
        caseId: String(caseId),
        amountTND: String(amountTND),
      },
      success_url: `${origin}/case/${caseId}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/case/${caseId}?canceled=true`,
    });

    if (!session.url) {
      return res.status(500).json({ error: "Stripe session creation failed" });
    }

    res.json({ url: session.url });
  } catch (err: any) {
    console.error("Stripe session error:", err);
    res.status(500).json({ error: err.message || "Stripe session error" });
  }
});

// Verify Stripe payment and update case donation amount
app.post("/api/payment/verify-stripe", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    // Retrieve the session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return res.status(400).json({ error: "Payment not completed", status: session.payment_status });
    }

    const caseId = parseInt(session.metadata?.caseId || "0");
    const amountTND = parseFloat(session.metadata?.amountTND || "0");

    if (!caseId || !amountTND) {
      return res.status(400).json({ error: "Invalid payment metadata" });
    }

    // Check if this session was already processed (prevent double-counting)
    const existingPayment = await getPaymentByTransactionId(sessionId);
    if (existingPayment) {
      return res.json({ success: true, alreadyProcessed: true, amount: amountTND });
    }

    const db = await getDb();
    if (!db) {
      return res.status(500).json({ error: "Database not available" });
    }

    // Round to integer since currentAmount is an integer column
    const amountInt = Math.round(amountTND);

    // Create a payment record
    await createPaymentRecord({
      caseId,
      amount: amountInt,
      status: "completed",
      paymentMethod: "stripe",
      transactionId: sessionId,
    });

    // Update the case's currentAmount using raw SQL for reliable integer arithmetic
    await db.execute(sql`UPDATE cases SET current_amount = current_amount + ${amountInt} WHERE id = ${caseId}`);

    console.log(`[Stripe] Payment verified: ${amountInt} TND added to case #${caseId}`);
    res.json({ success: true, amount: amountInt, caseId });
  } catch (err: any) {
    console.error("Stripe verify error:", err);
    res.status(500).json({ error: err.message || "Verification failed" });
  }
});


// Register all other routes
registerAuthRoutes(app);
registerWebauthnRoutes(app);
registerFaceAuthRoutes(app);
registerChatRoutes(app);
registerUploadRoutes(app);

// tRPC API
import { createExpressMiddleware } from "@trpc/server/adapters/express";
app.use("/api/trpc", createExpressMiddleware({ router: appRouter, createContext }));

// Webhook & Flouci routes (if needed, keep them here)

// Development / Production mode
async function startServer() {
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Find available port
  async function isPortAvailable(port: number): Promise<boolean> {
    return new Promise(resolve => {
      const testServer = net.createServer();
      testServer.listen(port, () => testServer.close(() => resolve(true)));
      testServer.on("error", () => resolve(false));
    });
  }

  async function findAvailablePort(startPort: number = 3000): Promise<number> {
    for (let port = startPort; port < startPort + 20; port++) {
      if (await isPortAvailable(port)) return port;
    }
    throw new Error(`No available port found starting from ${startPort}`);
  }

  const preferredPort = 3001; // backend runs on 3001
const port = await findAvailablePort(preferredPort);

server.listen(port, () => {
  console.log(`Backend server running on http://localhost:${port}/`);
});

}

startServer().catch(console.error);
