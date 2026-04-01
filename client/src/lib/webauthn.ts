import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
} from "@simplewebauthn/browser";

export { browserSupportsWebAuthn };

const WEBAUTHN_TIMEOUT_MS = 120_000; // 2 minutes max for user to complete biometric

/**
 * Race a promise against a timeout. Rejects with a clear error if the timeout fires.
 */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Timeout: ${label} — pas de réponse après ${ms / 1000}s`));
    }, ms);

    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); },
    );
  });
}

/**
 * Register a new WebAuthn credential (Face ID / fingerprint / Windows Hello).
 * Call this when the user is already authenticated.
 * Returns `true` if registration succeeded, `false` if user cancelled or error.
 */
export async function registerWebauthnCredential(
  deviceName: string = "Mon appareil",
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Get registration options from server
    const optionsRes = await fetch("/api/auth/webauthn/register-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!optionsRes.ok) {
      const data = await optionsRes.json().catch(() => ({}));
      return { success: false, error: data.error || "Impossible de démarrer l'enregistrement." };
    }
    const options = await optionsRes.json();

    // 2. Start the biometric registration (browser prompts user) — with timeout
    const credential = await withTimeout(
      startRegistration({ optionsJSON: options }),
      WEBAUTHN_TIMEOUT_MS,
      "Enregistrement biométrique",
    );

    // 3. Send the result to the server for verification
    const verifyRes = await fetch("/api/auth/webauthn/register-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential, deviceName }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok) {
      return { success: false, error: verifyData.error || "Enregistrement échoué." };
    }

    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("cancelled") ||
      message.includes("abort") ||
      message.includes("NotAllowedError") ||
      message.includes("The operation either timed out")
    ) {
      return { success: false, error: "Enregistrement annulé." };
    }
    console.error("[WebAuthn] Registration error:", err);
    return { success: false, error: "Erreur lors de l'enregistrement biométrique." };
  }
}

/**
 * Authenticate with a WebAuthn credential (Face ID / fingerprint / Windows Hello).
 * Returns the user data on success, or an error string on failure.
 */
export async function authenticateWithWebauthn(): Promise<
  | { success: true; user: { id: number; name: string; email: string; role: string } }
  | { success: false; error: string }
> {
  try {
    // 1. Get authentication options from server
    const optionsRes = await fetch("/api/auth/webauthn/login-options", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!optionsRes.ok) {
      const data = await optionsRes.json().catch(() => ({}));
      return {
        success: false,
        error: data.error || "Aucun appareil biométrique enregistré.",
      };
    }
    const options = await optionsRes.json();

    // 2. Start the biometric authentication (browser prompts user) — with timeout
    const credential = await withTimeout(
      startAuthentication({ optionsJSON: options }),
      WEBAUTHN_TIMEOUT_MS,
      "Authentification biométrique",
    );

    // 3. Verify with the server
    const verifyRes = await fetch("/api/auth/webauthn/login-verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential }),
    });
    const verifyData = await verifyRes.json().catch(() => ({}));

    if (!verifyRes.ok) {
      return { success: false, error: verifyData.error || "Vérification biométrique échouée." };
    }

    return { success: true, user: verifyData.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (
      message.includes("cancelled") ||
      message.includes("abort") ||
      message.includes("NotAllowedError") ||
      message.includes("The operation either timed out")
    ) {
      return { success: false, error: "Authentification annulée." };
    }
    console.error("[WebAuthn] Authentication error:", err);
    return { success: false, error: "Erreur lors de l'authentification biométrique." };
  }
}
