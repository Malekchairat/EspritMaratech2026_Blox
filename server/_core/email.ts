import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
  },
});

const FROM = process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@universelle.org";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("[Email] SMTP credentials not configured — skipping send");
    return;
  }

  const recipients = Array.isArray(to) ? to : [to];
  if (recipients.length === 0) return;

  try {
    await transporter.sendMail({
      from: `"Universelle" <${FROM}>`,
      bcc: recipients, // BCC so recipients don't see each other
      subject,
      html,
    });
    console.log(`[Email] Sent "${subject}" to ${recipients.length} recipient(s)`);
  } catch (err) {
    console.error("[Email] Failed to send:", err);
  }
}

// ── Email templates ─────────────────────────────────────────────

export function newMeetingEmail(opts: {
  associationName: string;
  meetingTitle: string;
  scheduledAt: Date;
  duration: number;
  description?: string;
}) {
  const dateStr = opts.scheduledAt.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const timeStr = opts.scheduledAt.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    subject: `📅 New Meeting: ${opts.meetingTitle} — ${opts.associationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">📅 New Meeting Scheduled</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">${opts.associationName}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <h2 style="margin: 0 0 16px; color: #111827;">${opts.meetingTitle}</h2>
          ${opts.description ? `<p style="color: #6b7280; margin: 0 0 16px;">${opts.description}</p>` : ""}
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">📆 Date</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${dateStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">🕐 Time</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${timeStr}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">⏱ Duration</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${opts.duration} minutes</td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">Log in to Universelle to join the meeting when it starts.</p>
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          You're receiving this because you're a member of ${opts.associationName}.
        </p>
      </div>
    `,
  };
}

export function passwordResetEmail(opts: {
  userName: string;
  resetLink: string;
}) {
  return {
    subject: "🔑 Réinitialisation de votre mot de passe — Universelle",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">🔑 Réinitialisation du mot de passe</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">Universelle</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #111827; margin: 0 0 16px;">Bonjour <strong>${opts.userName}</strong>,</p>
          <p style="color: #6b7280; margin: 0 0 24px;">Vous avez demandé la réinitialisation de votre mot de passe. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe :</p>
          <div style="text-align: center; margin: 24px 0;">
            <a href="${opts.resetLink}" style="display: inline-block; background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">Réinitialiser mon mot de passe</a>
          </div>
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 8px;">Ce lien expire dans <strong>1 heure</strong>.</p>
          <p style="color: #6b7280; font-size: 14px; margin: 0;">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">Si le bouton ne fonctionne pas, copiez ce lien : <br/><a href="${opts.resetLink}" style="color: #6366f1; word-break: break-all;">${opts.resetLink}</a></p>
        </div>
      </div>
    `,
  };
}

export function newCaseEmail(opts: {
  associationName: string;
  caseTitle: string;
  category: string;
  description: string;
  targetAmount: number;
  isUrgent: boolean;
}) {
  const urgentBadge = opts.isUrgent
    ? `<span style="background: #fef2f2; color: #dc2626; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 600;">🚨 URGENT</span>`
    : "";

  return {
    subject: `${opts.isUrgent ? "🚨 " : "💝 "}New Case: ${opts.caseTitle} — ${opts.associationName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
        <div style="background: linear-gradient(135deg, #ec4899, #f43f5e); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; font-size: 22px;">💝 New Donation Case</h1>
          <p style="margin: 8px 0 0; opacity: 0.9;">${opts.associationName}</p>
        </div>
        <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <h2 style="margin: 0; color: #111827;">${opts.caseTitle}</h2>
            ${urgentBadge}
          </div>
          <p style="color: #6b7280; margin: 0 0 16px; line-height: 1.6;">${opts.description.slice(0, 300)}${opts.description.length > 300 ? "…" : ""}</p>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">📂 Category</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827; text-transform: capitalize;">${opts.category}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #6b7280;">🎯 Target</td>
              <td style="padding: 8px 0; font-weight: 600; color: #111827;">${opts.targetAmount.toLocaleString()} MAD</td>
            </tr>
          </table>
          <div style="margin-top: 24px; text-align: center;">
            <p style="color: #6b7280; font-size: 14px;">Log in to Universelle to view the full case and make a donation.</p>
          </div>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 12px; margin-top: 16px;">
          You're receiving this because you follow ${opts.associationName}.
        </p>
      </div>
    `,
  };
}
