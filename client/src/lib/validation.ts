// ── Shared client-side validation helpers ──────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const URL_RE = /^https?:\/\/.+/i;

export type FieldErrors = Record<string, string>;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "required";
  if (!EMAIL_RE.test(email.trim())) return "invalidFormat";
  if (email.trim().length > 320) return "tooLong";
  return null;
}

export function validatePassword(password: string): string | null {
  if (!password) return "required";
  if (password.length < 8) return "tooShort";
  if (password.length > 128) return "tooLong";
  if (!/[A-Z]/.test(password)) return "noUppercase";
  if (!/[a-z]/.test(password)) return "noLowercase";
  if (!/[0-9]/.test(password)) return "noDigit";
  if (!/[^A-Za-z0-9]/.test(password)) return "noSpecial";
  return null;
}

export function validateName(name: string): string | null {
  if (!name.trim()) return "required";
  if (name.trim().length < 2) return "tooShort";
  if (name.trim().length > 100) return "tooLong";
  return null;
}

export function validateUrl(url: string): string | null {
  if (!url.trim()) return "required";
  if (!URL_RE.test(url.trim())) return "invalidUrl";
  return null;
}

export function validateAmount(value: string): string | null {
  if (!value.trim()) return "required";
  const num = parseInt(value, 10);
  if (isNaN(num)) return "notANumber";
  if (num < 1) return "tooSmall";
  if (num > 100_000_000) return "tooLarge";
  return null;
}

export function validateDescription(text: string): string | null {
  if (!text.trim()) return "required";
  if (text.trim().length < 20) return "tooShort";
  if (text.trim().length > 10000) return "tooLong";
  return null;
}

export function validateTitle(title: string): string | null {
  if (!title.trim()) return "required";
  if (title.trim().length < 3) return "tooShort";
  if (title.trim().length > 255) return "tooLong";
  return null;
}

/** Returns a password strength score 0-4 */
export function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  if (!password) return { score: 0, label: "empty", color: "bg-muted" };
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  const labels = ["veryWeak", "weak", "fair", "good", "strong"] as const;
  const colors = ["bg-destructive", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  return { score, label: labels[score], color: colors[score] };
}
