import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { initializeTransaction, newReference, paystackEnabled } from "@/lib/paystack";
import { upToDate } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { baseUrl, IS_PROD, PRICE_CENTS, RECHECK_PRICE_CENTS } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,190}\.[^\s@]{2,24}$/;

/**
 * POST { id, email, kind?: "report" | "recheck", k? } → { url } to send the buyer to Paystack.
 * - report:  full report.
 * - recheck: fix check. Only for people who already have the full report, and never once the site is up to date.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; kind?: string; k?: string; email?: string };
  const report = body.id ? await getReport(body.id) : null;
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const kind = body.kind === "recheck" ? "recheck" : "report";
  const email = (body.email || "").trim().toLowerCase();
  const base = baseUrl(req);

  if (kind === "recheck") {
    const key = body.k || (await cookies()).get(accessCookieName(report.id))?.value;
    if (!isValidKey(report.id, key)) return NextResponse.json({ error: "Unlock the full report first." }, { status: 403 });
    if (await upToDate(report.id)) {
      return NextResponse.json({ error: "Your landing page is already up to date. No fix check needed." }, { status: 409 });
    }
  }

  const returnPath = kind === "recheck" ? `/r/${report.id}/recheck/start` : `/r/${report.id}/unlock`;

  if (!paystackEnabled()) {
    if (IS_PROD) return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
    // Development only: skip payment so both paid flows can be tested end to end.
    return NextResponse.json({ url: `${base}${returnPath}?dev=1` });
  }

  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email for your receipt." }, { status: 400 });

  try {
    const tx = await initializeTransaction({
      email,
      amount: kind === "recheck" ? RECHECK_PRICE_CENTS : PRICE_CENTS,
      reference: newReference(kind, report.id),
      callbackUrl: `${base}${returnPath}`,
      metadata: { reportId: report.id, kind, domain: report.domain },
    });
    return NextResponse.json({ url: tx.authorizationUrl });
  } catch (e) {
    console.error("[checkout] failed", e);
    const msg = (e as Error).message || "";
    return NextResponse.json(
      { error: /currency/i.test(msg) ? "This currency isn't enabled on the payment account yet." : "Couldn't start checkout. Try again." },
      { status: 500 },
    );
  }
}
