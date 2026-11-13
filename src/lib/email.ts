import "server-only";
import { SITE_NAME } from "./site";

/**
 * Sends a transactional email. Free option first:
 * - Gmail (SMTP_USER = your Gmail, SMTP_PASS = a Google "app password"): free, ~500 emails/day.
 * - Resend (RESEND_API_KEY): needs your own domain to email customers.
 * Silently skipped if neither is configured.
 */
async function send(to: string, subject: string, title: string, intro: string, button: string, link: string) {
  if (!to) return;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const key = process.env.RESEND_API_KEY;
  if (!(smtpUser && smtpPass) && !key) return;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0e1116">
    <h1 style="font-size:22px;margin:0 0 12px">${title}</h1>
    <p style="font-size:15px;line-height:1.6;color:#3b4250">${intro}</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#0e1116;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;font-weight:600">${button}</a></p>
    <p style="font-size:13px;color:#6b7280;word-break:break-all">${link}</p>
    <p style="font-size:13px;color:#6b7280">Anyone with this link can open it, so share it carefully.</p>
  </div>`;
  try {
    if (smtpUser && smtpPass) {
      const nodemailer = await import("nodemailer");
      const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT || 465),
        secure: true,
        auth: { user: smtpUser, pass: smtpPass.replace(/\s+/g, "") },
      });
      await transport.sendMail({ from: `${SITE_NAME} <${smtpUser}>`, to, subject, html });
      return;
    }
    const from = process.env.EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject, html }),
    });
  } catch (e) {
    console.error("[email] failed", (e as Error).message);
  }
}

/** Sends the buyer their private report link via Resend. Silently skipped if Resend isn't configured. */
export function sendReportEmail(to: string, domain: string, link: string) {
  return send(
    to,
    `Your full roast of ${domain}`,
    `Your full roast of ${domain} is ready`,
    "Thanks for buying the full report. Here's your private link. Bookmark it, it's how you get back in:",
    "Open my full report",
    link,
  );
}

export function sendFixCheckEmail(to: string, domain: string, link: string) {
  return send(
    to,
    `Your fix check for ${domain}`,
    `Your fix check for ${domain} is paid`,
    "If the check didn't start after payment, use this link to run it. It only re-checks the findings from your original roast:",
    "Run my fix check",
    link,
  );
}
