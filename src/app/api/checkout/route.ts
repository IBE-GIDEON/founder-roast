import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { createOrder, paypalEnabled } from "@/lib/paypal";
import { upToDate } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { baseUrl, IS_PROD, PRICE_CENTS, RECHECK_PRICE_CENTS, RECHECK_REFUND_LABEL, SITE_NAME } from "@/lib/site";

export const runtime = "nodejs";

/**
 * POST { id, kind?: "report" | "recheck", k? } → { url } to send the buyer to PayPal.
 * - report:  $39 full report.
 * - recheck: $15 fix check. Only for people who already have the full report, and never once the site is up to date.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { id?: string; kind?: string; k?: string };
  const report = body.id ? await getReport(body.id) : null;
  if (!report) return NextResponse.json({ error: "Report not found." }, { status: 404 });
  const kind = body.kind === "recheck" ? "recheck" : "report";
  const base = baseUrl(req);

  if (kind === "recheck") {
    const key = body.k || (await cookies()).get(accessCookieName(report.id))?.value;
    if (!isValidKey(report.id, key)) return NextResponse.json({ error: "Unlock the full report first." }, { status: 403 });
    if (await upToDate(report.id)) {
      return NextResponse.json({ error: "Your landing page is already up to date. No fix check needed." }, { status: 409 });
    }
  }

  const returnPath = kind === "recheck" ? `/r/${report.id}/recheck/start` : `/r/${report.id}/unlock`;

  if (!paypalEnabled()) {
    if (IS_PROD) return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
    // Development only: skip payment so both paid flows can be tested end to end.
    return NextResponse.json({ url: `${base}${returnPath}?dev=1` });
  }

  try {
    const recheck = kind === "recheck";
    const order = await createOrder({
      amountCents: recheck ? RECHECK_PRICE_CENTS : PRICE_CENTS,
      description: recheck
        ? `${SITE_NAME} fix check for ${report.domain}. ${RECHECK_REFUND_LABEL} back if everything is fixed.`
        : `${SITE_NAME} full report for ${report.domain}`,
      customId: `${kind}:${report.id}`,
      returnUrl: `${base}${returnPath}`,
      cancelUrl: `${base}/r/${report.id}?canceled=1`,
    });
    return NextResponse.json({ url: order.approveUrl });
  } catch (e) {
    console.error("[checkout] failed", e);
    return NextResponse.json({ error: "Couldn't start PayPal checkout. Try again." }, { status: 500 });
  }
}
