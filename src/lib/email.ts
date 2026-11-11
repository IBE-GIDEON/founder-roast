import "server-only";
import { SITE_NAME } from "./site";

/** Sends the buyer their private report link via Resend. Silently skipped if Resend isn't configured. */
export async function sendReportEmail(to: string, domain: string, link: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key || !to) return;
  const from = process.env.EMAIL_FROM || `${SITE_NAME} <onboarding@resend.dev>`;
  const html = `
  <div style="font-family:Inter,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#0e1116">
    <h1 style="font-size:22px;margin:0 0 12px">Your full roast of ${domain} is ready 🔥</h1>
    <p style="font-size:15px;line-height:1.6;color:#3b4250">Thanks for buying the full report. Here's your private link — bookmark it, it's how you get back in:</p>
    <p style="margin:24px 0"><a href="${link}" style="background:#0e1116;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:600">Open my full report</a></p>
    <p style="font-size:13px;color:#6b7280;word-break:break-all">${link}</p>
    <p style="font-size:13px;color:#6b7280">Anyone with this link can see the full report, so share it carefully.</p>
  </div>`;
  try {
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to, subject: `Your full roast of ${domain}`, html }),
    });
  } catch (e) {
    console.error("[email] failed", (e as Error).message);
  }
}
