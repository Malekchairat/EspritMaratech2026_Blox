import type { Express, Request, Response } from "express";
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from "@simplewebauthn/server";
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import * as db from "../db";
import { authenticateRequest, createSessionToken } from "./auth";
import { getSessionCookieOptions } from "./cookies";

// Transport type from WebAuthn spec
type AuthTransport = "ble" | "cable" | "hybrid" | "internal" | "nfc" | "smart-card" | "usb";

// ── WebAuthn Configuration ──────────────────────────────────────
// rpID = the domain of your site (no port, no protocol)
// rpName = human-readable name for the relying party
// origin = the full origin the browser will report

const RP_NAME = "Universelle";

function getRpId(req: Request): string {
  const host = req.hostname; // e.g. "localhost" or "universelle.example.com"
  return host;
}

function getOrigin(req: Request): string {
  const protocol = req.protocol; // "http" or "https"
  const host = req.get("host"); // "localhost:3000"
  return `${protocol}://${host}`;
}

// In-memory store for challenges (per-session). In production, use Redis or DB.
const challengeStore = new Map<string, string>();

function storeChallenge(key: string, challenge: string) {
  challengeStore.set(key, challenge);
  // Auto-cleanup after 5 minutes
  setTimeout(() => challengeStore.delete(key), 5 * 60 * 1000);
}

function getAndDeleteChallenge(key: string): string | undefined {
  const challenge = challengeStore.get(key);
  challengeStore.delete(key);
  return challenge;
}

export function registerWebauthnRoutes(app: Express) {

  // ──────────────────────────────────────────────────────────────
  // REGISTRATION (requires authenticated user)
  // ──────────────────────────────────────────────────────────────

  /** POST /api/auth/webauthn/register-options */
  app.post("/api/auth/webauthn/register-options", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);

      // Get existing credentials to exclude
      const existingCredentials = await db.getWebauthnCredentialsByUserId(user.id);

      const options = await generateRegistrationOptions({
        rpName: RP_NAME,
        rpID: getRpId(req),
        userName: user.email || user.name || `user-${user.id}`,
        userDisplayName: user.name || "Utilisateur",
        attestationType: "none",
        excludeCredentials: existingCredentials.map((cred) => ({
          id: cred.credentialId,
          transports: cred.transports
            ? (JSON.parse(cred.transports) as AuthTransport[])
            : undefined,
        })),
        authenticatorSelection: {
          residentKey: "preferred",
          userVerification: "preferred",
          // No authenticatorAttachment constraint — allows any authenticator
        },
      });

      // Store the challenge for verification
      storeChallenge(`reg_${user.id}`, options.challenge);

      console.log("[WebAuthn] Register options generated for user:", user.id);
      res.json(options);
    } catch (error) {
      console.error("[WebAuthn] Register options failed:", error);
      res.status(401).json({ error: "Non authentifié" });
    }
  });

  /** POST /api/auth/webauthn/register-verify */
  app.post("/api/auth/webauthn/register-verify", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const { credential, deviceName } = req.body;

      console.log("[WebAuthn] Verify registration for user:", user.id);
      console.log("[WebAuthn] Credential ID:", credential?.id?.substring(0, 20) + "...");

      const expectedChallenge = getAndDeleteChallenge(`reg_${user.id}`);
      if (!expectedChallenge) {
        console.warn("[WebAuthn] Challenge not found for user:", user.id);
        res.status(400).json({ error: "Challenge expiré. Veuillez réessayer." });
        return;
      }

      const verification = await verifyRegistrationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: getRpId(req),
      });

      if (!verification.verified || !verification.registrationInfo) {
        res.status(400).json({ error: "Vérification échouée." });
        return;
      }

      const { credential: regCredential } = verification.registrationInfo;

      // Store as base64url strings
      const credentialIdB64 = Buffer.from(regCredential.id).toString("base64url");
      const publicKeyB64 = Buffer.from(regCredential.publicKey).toString("base64url");

      // Transports can be at credential.response.transports or credential.transports
      const transports = credential.response?.transports || credential.transports || [];

      console.log("[WebAuthn] Storing credential:", credentialIdB64.substring(0, 20) + "...");

      await db.createWebauthnCredential({
        userId: user.id,
        credentialId: credentialIdB64,
        publicKey: publicKeyB64,
        counter: regCredential.counter,
        transports: transports.length > 0 ? JSON.stringify(transports) : undefined,
        deviceName: deviceName || "Mon appareil",
      });

      console.log("[WebAuthn] Credential stored successfully for user:", user.id);
      res.json({ success: true, message: "Appareil enregistré avec succès !" });
    } catch (error) {
      console.error("[WebAuthn] Register verify failed:", error);
      res.status(500).json({ error: "Erreur lors de l'enregistrement" });
    }
  });

  // ──────────────────────────────────────────────────────────────
  // AUTHENTICATION (public – this is the login flow)
  // ──────────────────────────────────────────────────────────────

  /** POST /api/auth/webauthn/login-options */
  app.post("/api/auth/webauthn/login-options", async (req: Request, res: Response) => {
    try {
      // Get all credentials for discoverable login
      const allCredentials = await db.getAllWebauthnCredentials();

      if (allCredentials.length === 0) {
        res.status(404).json({ error: "Aucun appareil biométrique enregistré." });
        return;
      }

      const options = await generateAuthenticationOptions({
        rpID: getRpId(req),
        userVerification: "preferred",
        // Let the browser pick from discoverable credentials (resident keys)
        allowCredentials: allCredentials.map((cred) => ({
          id: cred.credentialId,
          transports: cred.transports
            ? (JSON.parse(cred.transports) as AuthTransport[])
            : undefined,
        })),
      });

      // Store challenge with a temporary key (we'll match by credential ID later)
      storeChallenge(`auth_global`, options.challenge);

      res.json(options);
    } catch (error) {
      console.error("[WebAuthn] Login options failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  /** POST /api/auth/webauthn/login-verify */
  app.post("/api/auth/webauthn/login-verify", async (req: Request, res: Response) => {
    try {
      const { credential } = req.body;

      const expectedChallenge = getAndDeleteChallenge(`auth_global`);
      if (!expectedChallenge) {
        res.status(400).json({ error: "Challenge expiré. Veuillez réessayer." });
        return;
      }

      // Find the credential in the database
      const credentialIdB64 = credential.id; // already base64url from browser
      const storedCredential = await db.getWebauthnCredentialByCredentialId(credentialIdB64);

      if (!storedCredential) {
        res.status(401).json({ error: "Appareil non reconnu." });
        return;
      }

      const verification = await verifyAuthenticationResponse({
        response: credential,
        expectedChallenge,
        expectedOrigin: getOrigin(req),
        expectedRPID: getRpId(req),
        credential: {
          id: storedCredential.credentialId,
          publicKey: Buffer.from(storedCredential.publicKey, "base64url"),
          counter: storedCredential.counter,
          transports: storedCredential.transports
            ? (JSON.parse(storedCredential.transports) as AuthTransport[])
            : undefined,
        },
      });

      if (!verification.verified) {
        res.status(401).json({ error: "Vérification biométrique échouée." });
        return;
      }

      // Update the counter
      await db.updateWebauthnCredentialCounter(
        storedCredential.credentialId,
        verification.authenticationInfo.newCounter
      );

      // Get the user and create a session
      const user = await db.getFullUserById(storedCredential.userId);
      if (!user) {
        res.status(401).json({ error: "Utilisateur introuvable." });
        return;
      }

      // Update last signed in
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      });

      const sessionToken = await createSessionToken({
        userId: user.id,
        openId: user.openId,
        name: user.name || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      res.json({
        success: true,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    } catch (error) {
      console.error("[WebAuthn] Login verify failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  // ──────────────────────────────────────────────────────────────
  // CREDENTIAL MANAGEMENT (requires auth)
  // ──────────────────────────────────────────────────────────────

  /** GET /api/auth/webauthn/credentials */
  app.get("/api/auth/webauthn/credentials", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const credentials = await db.getWebauthnCredentialsByUserId(user.id);

      res.json(
        credentials.map((c) => ({
          id: c.id,
          deviceName: c.deviceName,
          createdAt: c.createdAt,
        }))
      );
    } catch (error) {
      res.status(401).json({ error: "Non authentifié" });
    }
  });

  /** DELETE /api/auth/webauthn/credentials/:id */
  app.delete("/api/auth/webauthn/credentials/:id", async (req: Request, res: Response) => {
    try {
      const user = await authenticateRequest(req);
      const credentialId = parseInt(req.params.id, 10);

      if (isNaN(credentialId)) {
        res.status(400).json({ error: "ID invalide" });
        return;
      }

      await db.deleteWebauthnCredential(credentialId, user.id);
      res.json({ success: true });
    } catch (error) {
      res.status(401).json({ error: "Non authentifié" });
    }
  });
}
