import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { upToDate } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { baseUrl, IS_PROD, PRICE_CENTS, RECHECK_PRICE_CENTS, RECHECK_REFUND_LABEL, SITE_NAME } from "@/lib/site";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * POST { id, kind?: "report" | "recheck", k? }
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

  if (!stripeEnabled()) {
    if (IS_PROD) return NextResponse.json({ error: "Payments aren't configured yet." }, { status: 503 });
    // Development only: skip payment so both paid flows can be tested end to end.
    return NextResponse.json({ url: kind === "recheck" ? `${base}/r/${report.id}/recheck/start?dev=1` : `${base}/r/${report.id}/unlock?dev=1` });
  }

  try {
    const recheck = kind === "recheck";
    const session = await stripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: recheck ? RECHECK_PRICE_CENTS : PRICE_CENTS,
            product_data: recheck
              ? {
                  name: `${SITE_NAME}: fix check for ${report.domain}`,
                  description: `Re-checks every finding from your original roast. If everything is fixed, ${RECHECK_REFUND_LABEL} is refunded automatically.`,
                }
              : {
                  name: `${SITE_NAME}: full report for ${report.domain}`,
                  description: "Blind spots, competitor teardown, four scores, growth plan, landing page rewrite and PDF.",
                },
          },
        },
      ],
      allow_promotion_codes: !recheck,
      metadata: { reportId: report.id, domain: report.domain, kind },
      payment_intent_data: { metadata: { reportId: report.id, domain: report.domain, kind } },
      success_url: recheck
        ? `${base}/r/${report.id}/recheck/start?session_id={CHECKOUT_SESSION_ID}`
        : `${base}/r/${report.id}/unlock?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/r/${report.id}?canceled=1`,
    });
    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("[checkout] failed", e);
    return NextResponse.json({ error: "Couldn't start checkout. Try again." }, { status: 500 });
  }
}
