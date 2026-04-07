import type { Express, Request, Response } from "express";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { authenticateRequest, createSessionToken } from "./auth";
import { getSessionCookieOptions } from "./cookies";

/**
 * Euclidean distance between two face descriptors (128-dim Float32 arrays).
 * Lower = more similar. Threshold ~0.5 → same person.
 */
function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

const MATCH_THRESHOLD = 0.5; // Accept as same person if distance < 0.5

export function registerFaceAuthRoutes(app: Express) {

  // ──────────────────────────────────────────────────────────────
  // REGISTRATION: Store face descriptor (requires authenticated user)
  // ──────────────────────────────────────────────────────────────

  /** POST /api/auth/face/register */
  app.post("/api/auth/face/register", async (req: Request, res) => {
    try {
      const user = await authenticateRequest(req);
      const { descriptor, label } = req.body;

      if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
        res.status(400).json({ error: "Descripteur facial invalide (128 valeurs attendues)." });
        return;
      }

      // Validate values are numbers
      if (!descriptor.every((v: unknown) => typeof v === "number" && isFinite(v as number))) {
        res.status(400).json({ error: "Descripteur facial contient des valeurs invalides." });
        return;
      }

      // Check if this face is already registered by another user
      const allDescriptors = await db.getAllFaceDescriptors();
      for (const stored of allDescriptors) {
        // Skip check against own face
        if (stored.userId === user.id) continue;

        const storedDescriptor = JSON.parse(stored.descriptor) as number[];
        const distance = euclideanDistance(descriptor, storedDescriptor);

        if (distance < MATCH_THRESHOLD) {
          console.log(`[FaceAuth] Face already registered! User ${stored.userId}, distance: ${distance.toFixed(4)}`);
          res.status(409).json({ 
            error: "Ce visage est déjà enregistré pour un autre compte. Veuillez utiliser un visage différent." 
          });
          return;
        }
      }

      await db.saveFaceDescriptor(user.id, descriptor, label);

      console.log("[FaceAuth] Face descriptor saved for user:", user.id);
      res.json({ success: true, message: "Reconnaissance faciale configurée !" });
    } catch (error) {
      console.error("[FaceAuth] Register failed:", error);
      res.status(401).json({ error: "Non authentifié" });
    }
  });

  // ──────────────────────────────────────────────────────────────
  // LOGIN: Match face descriptor against all stored descriptors
  // ──────────────────────────────────────────────────────────────

  /** POST /api/auth/face/login */
  app.post("/api/auth/face/login", async (req: Request, res) => {
    try {
      const { descriptor } = req.body;

      if (!descriptor || !Array.isArray(descriptor) || descriptor.length !== 128) {
        res.status(400).json({ error: "Descripteur facial invalide." });
        return;
      }

      // Get all stored face descriptors
      const allDescriptors = await db.getAllFaceDescriptors();

      if (allDescriptors.length === 0) {
        res.status(404).json({ error: "Aucun visage enregistré. Configurez la reconnaissance faciale depuis votre profil." });
        return;
      }

      // Find the best match
      let bestMatch: { userId: number; distance: number } | null = null;

      for (const stored of allDescriptors) {
        const storedDescriptor = JSON.parse(stored.descriptor) as number[];
        const distance = euclideanDistance(descriptor, storedDescriptor);

        console.log(`[FaceAuth] Distance for user ${stored.userId}: ${distance.toFixed(4)}`);

        if (distance < MATCH_THRESHOLD && (!bestMatch || distance < bestMatch.distance)) {
          bestMatch = { userId: stored.userId, distance };
        }
      }

      if (!bestMatch) {
        res.status(401).json({ error: "Visage non reconnu. Réessayez ou connectez-vous avec votre mot de passe." });
        return;
      }

      console.log(`[FaceAuth] Match found! User ${bestMatch.userId}, distance: ${bestMatch.distance.toFixed(4)}`);

      // Get user and create session
      const user = await db.getFullUserById(bestMatch.userId);
      if (!user) {
        res.status(401).json({ error: "Utilisateur introuvable." });
        return;
      }

      // Update last signed in & streak (non-fatal)
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      }).catch((err: unknown) => console.warn("[FaceAuth] upsertUser failed:", err));
      await db.updateLoginStreak(user.id).catch((err: unknown) => console.warn("[FaceAuth] updateLoginStreak failed:", err));

      const sessionToken = await createSessionToken({
        userId: user.id,
        openId: user.openId,
        name: user.name || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        confidence: (1 - bestMatch.distance).toFixed(2),
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[FaceAuth] Login failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // ──────────────────────────────────────────────────────────────
  // STATUS: Check if user has face recognition set up
  // ──────────────────────────────────────────────────────────────

  /** GET /api/auth/face/status */
  app.get("/api/auth/face/status", async (req: Request, res) => {
    try {
      const user = await authenticateRequest(req);
      const faceData = await db.getFaceDescriptorByUserId(user.id);

      res.json({
        registered: !!faceData,
        label: faceData?.label || null,
        createdAt: faceData?.createdAt || null,
      });
    } catch {
      res.status(401).json({ error: "Non authentifié" });
    }
  });

  // ──────────────────────────────────────────────────────────────
  // DELETE: Remove face recognition data
  // ──────────────────────────────────────────────────────────────

  /** DELETE /api/auth/face/delete */
  app.delete("/api/auth/face/delete", async (req: Request, res) => {
    try {
      const user = await authenticateRequest(req);
      await db.deleteFaceDescriptor(user.id);

      console.log("[FaceAuth] Face descriptor deleted for user:", user.id);
      res.json({ success: true, message: "Reconnaissance faciale supprimée." });
    } catch {
      res.status(401).json({ error: "Non authentifié" });
    }
  });
}
