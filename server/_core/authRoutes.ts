import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { nanoid } from "nanoid";
import crypto from "crypto";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";
import { hashPassword, verifyPassword, createSessionToken } from "./auth";
import { ENV } from "./env";
import { sendEmail, passwordResetEmail } from "./email";

// ── Validation helpers ──────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validateEmail(email: string): string | null {
  if (!email || typeof email !== "string") return "Email est requis";
  const trimmed = email.trim().toLowerCase();
  if (!EMAIL_RE.test(trimmed)) return "Format d'email invalide";
  if (trimmed.length > 320) return "Email trop long";
  return null;
}

function validatePassword(password: string): string | null {
  if (!password || typeof password !== "string") return "Mot de passe est requis";
  if (password.length < 8) return "Le mot de passe doit contenir au moins 8 caractères";
  if (password.length > 128) return "Le mot de passe est trop long";
  if (!/[A-Z]/.test(password)) return "Le mot de passe doit contenir au moins une majuscule";
  if (!/[a-z]/.test(password)) return "Le mot de passe doit contenir au moins une minuscule";
  if (!/[0-9]/.test(password)) return "Le mot de passe doit contenir au moins un chiffre";
  if (!/[^A-Za-z0-9]/.test(password)) return "Le mot de passe doit contenir au moins un caractère spécial (!@#$%...)";
  return null;
}

function validateName(name: string): string | null {
  if (!name || typeof name !== "string") return "Nom est requis";
  const trimmed = name.trim();
  if (trimmed.length < 2) return "Le nom doit contenir au moins 2 caractères";
  if (trimmed.length > 100) return "Le nom est trop long";
  return null;
}

export function registerAuthRoutes(app: Express) {
  /** POST /api/auth/register */
  app.post("/api/auth/register", async (req: Request, res: Response) => {
    try {
      const { name, email, password, role, avatar } = req.body;

      // Validate name
      const nameError = validateName(name);
      if (nameError) {
        res.status(400).json({ error: nameError, field: "name" });
        return;
      }

      // Validate email format
      const emailError = validateEmail(email);
      if (emailError) {
        res.status(400).json({ error: emailError, field: "email" });
        return;
      }

      // Validate password strength
      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ error: passwordError, field: "password" });
        return;
      }

      // Validate role
      const validRoles = ["donor", "association"];
      const userRole = validRoles.includes(role) ? role : "donor";

      // Check if email already exists
      const normalizedEmail = email.trim().toLowerCase();
      const existingUser = await db.getUserByEmail(normalizedEmail);
      if (existingUser) {
        res.status(409).json({ error: "Cet email est déjà utilisé", field: "email" });
        return;
      }

      const passwordHash = await hashPassword(password);
      const openId = nanoid(21);

      await db.upsertUser({
        openId,
        name: name.trim(),
        email: normalizedEmail,
        loginMethod: "email",
        passwordHash,
        role: userRole,
        avatar: avatar || null,
        lastSignedIn: new Date(),
      });

      const user = await db.getUserByEmail(normalizedEmail);
      if (!user) {
        res.status(500).json({ error: "Erreur lors de la création du compte" });
        return;
      }

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
      console.error("[Auth] Register failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  /** POST /api/auth/login */
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      // Validate email format
      const emailError = validateEmail(email);
      if (emailError) {
        res.status(400).json({ error: emailError, field: "email" });
        return;
      }

      if (!password || typeof password !== "string") {
        res.status(400).json({ error: "Mot de passe est requis", field: "password" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.getUserByEmail(normalizedEmail);
      if (!user || !user.passwordHash) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
      }

      const valid = await verifyPassword(password, user.passwordHash);
      if (!valid) {
        res.status(401).json({ error: "Email ou mot de passe incorrect" });
        return;
      }

      // Update last signed in & streak (non-fatal)
      await db.upsertUser({
        openId: user.openId,
        lastSignedIn: new Date(),
      }).catch((err) => console.warn("[Auth] upsertUser failed:", err));
      await db.updateLoginStreak(user.id).catch((err) => console.warn("[Auth] updateLoginStreak failed:", err));

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
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  /** POST /api/auth/forgot-password – Send password reset email */
  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email || typeof email !== "string") {
        res.status(400).json({ error: "Email est requis" });
        return;
      }

      const normalizedEmail = email.trim().toLowerCase();
      const user = await db.getUserByEmail(normalizedEmail);

      // Always return success to prevent email enumeration
      if (!user || !user.passwordHash) {
        res.json({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
        return;
      }

      // Generate a secure token
      const token = crypto.randomBytes(48).toString("hex");
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await db.createPasswordResetToken(user.id, token, expiresAt);

      // Build the reset link
      const baseUrl = `http://localhost:${process.env.PORT || 3000}`;
      const resetLink = `${baseUrl}/reset-password?token=${token}`;

      // Send the email
      const { subject, html } = passwordResetEmail({
        userName: user.name || "Utilisateur",
        resetLink,
      });
      await sendEmail({ to: normalizedEmail, subject, html });

      res.json({ success: true, message: "Si cet email existe, un lien de réinitialisation a été envoyé." });
    } catch (error) {
      console.error("[Auth] Forgot password failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  /** POST /api/auth/reset-password – Reset password with token */
  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || typeof token !== "string") {
        res.status(400).json({ error: "Token invalide" });
        return;
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        res.status(400).json({ error: passwordError, field: "password" });
        return;
      }

      // Validate the token
      const resetToken = await db.getPasswordResetToken(token);
      if (!resetToken) {
        res.status(400).json({ error: "Ce lien est invalide ou a expiré. Veuillez refaire une demande." });
        return;
      }

      // Hash and update the password
      const newPasswordHash = await hashPassword(password);
      await db.updateUserPassword(resetToken.userId, newPasswordHash);
      await db.markResetTokenUsed(resetToken.id);

      res.json({ success: true, message: "Mot de passe réinitialisé avec succès." });
    } catch (error) {
      console.error("[Auth] Reset password failed:", error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  });

  /** GET /api/auth/google/redirect – Redirect user to Google OAuth consent screen */
  app.get("/api/auth/google/redirect", (req: Request, res: Response) => {
    const clientId = ENV.googleClientId;
    if (!clientId) {
      // No Google credentials configured – redirect back with error
      const errorMsg = encodeURIComponent("Google OAuth n'est pas configuré. Veuillez ajouter GOOGLE_CLIENT_ID dans le fichier .env");
      res.redirect(`/login?error=${errorMsg}`);
      return;
    }

    const mode = (req.query.mode as string) || "login";
    const role = (req.query.role as string) || "donor";

    // Build the state parameter to pass mode and role through the OAuth flow
    const state = Buffer.from(JSON.stringify({ mode, role })).toString("base64url");

    // Determine the callback URL – use a fixed origin in development
    const redirectUri = `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`;
    console.log("[Auth] Google redirect_uri:", redirectUri);

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: "code",
      scope: "openid email profile",
      state,
      access_type: "offline",
      prompt: "select_account",
    });

    res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  });

  /** GET /api/auth/google/callback – Handle Google OAuth callback */
  app.get("/api/auth/google/callback", async (req: Request, res: Response) => {
    try {
      const { code, state, error: googleError } = req.query;

      if (googleError) {
        const msg = encodeURIComponent("Authentification Google annulée");
        res.redirect(`/login?error=${msg}`);
        return;
      }

      if (!code || typeof code !== "string") {
        const msg = encodeURIComponent("Code d'autorisation manquant");
        res.redirect(`/login?error=${msg}`);
        return;
      }

      // Parse state
      let role = "donor";
      if (state && typeof state === "string") {
        try {
          const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
          role = parsed.role || "donor";
        } catch {}
      }

      // Exchange code for tokens
      const redirectUri = `http://localhost:${process.env.PORT || 3000}/api/auth/google/callback`;

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: ENV.googleClientId,
          client_secret: ENV.googleClientSecret,
          redirect_uri: redirectUri,
          grant_type: "authorization_code",
        }).toString(),
      });

      if (!tokenRes.ok) {
        console.error("[Auth] Google token exchange failed:", await tokenRes.text());
        const msg = encodeURIComponent("Échec de l'échange de token Google");
        res.redirect(`/login?error=${msg}`);
        return;
      }

      const tokenData = await tokenRes.json() as {
        access_token: string;
        id_token?: string;
        token_type: string;
      };

      // Get user info from Google
      const userInfoRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });

      if (!userInfoRes.ok) {
        const msg = encodeURIComponent("Impossible de récupérer les informations Google");
        res.redirect(`/login?error=${msg}`);
        return;
      }

      const googleUser = await userInfoRes.json() as {
        id: string;
        email: string;
        name: string;
        picture?: string;
      };

      const googleEmail = googleUser.email?.trim().toLowerCase();
      if (!googleEmail) {
        const msg = encodeURIComponent("Aucun email fourni par Google");
        res.redirect(`/login?error=${msg}`);
        return;
      }

      // Check if user already exists
      let user = await db.getUserByEmail(googleEmail);

      if (!user) {
        // Create new user from Google
        const validRoles = ["donor", "association"];
        const userRole = (validRoles.includes(role) ? role : "donor") as "donor" | "association";
        const openId = `google_${googleUser.id || nanoid(21)}`;

        await db.upsertUser({
          openId,
          name: googleUser.name || "",
          email: googleEmail,
          loginMethod: "google",
          role: userRole,
          lastSignedIn: new Date(),
        });

        user = await db.getUserByEmail(googleEmail);
        if (!user) {
          const msg = encodeURIComponent("Erreur lors de la création du compte");
          res.redirect(`/login?error=${msg}`);
          return;
        }
      } else {
        // Update last signed in
        await db.upsertUser({
          openId: user.openId,
          lastSignedIn: new Date(),
        });
      }

      // Update streak for all login types (non-fatal)
      await db.updateLoginStreak(user.id).catch((err) => console.warn("[Auth] Google updateLoginStreak failed:", err));

      // Create session token and set cookie
      const sessionToken = await createSessionToken({
        userId: user.id,
        openId: user.openId,
        name: user.name || "",
      });

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

      // Redirect to the appropriate dashboard
      const dashboardPath =
        user.role === "admin"
          ? "/dashboard/admin"
          : user.role === "association"
          ? "/dashboard/association"
          : "/";

      res.redirect(dashboardPath);
    } catch (error) {
      console.error("[Auth] Google OAuth callback failed:", error);
      const msg = encodeURIComponent("Erreur interne du serveur");
      res.redirect(`/login?error=${msg}`);
    }
  });
}
