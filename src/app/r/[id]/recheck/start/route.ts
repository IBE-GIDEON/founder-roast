import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { createRecheckPayment } from "@/lib/recheck";
import { getReport, recordPurchase } from "@/lib/reports";
import { baseUrl, IS_PROD, RECHECK_PRICE_CENTS } from "@/lib/site";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/** Stripe returns fix-check buyers here. Verify payment, then start the live fix check. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);
  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || stripeEnabled()) return fail();
    const key = (await cookies()).get(accessCookieName(id))?.value;
    if (!isValidKey(id, key)) return fail();
    const pay = await createRecheckPayment({ reportId: id, sessionId: null, paymentIntent: null, amount: RECHECK_PRICE_CENTS, dev: true });
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  }

  const sessionId = url.searchParams.get("session_id");
  if (!sessionId || !stripeEnabled()) return fail();
  try {
    const session = await stripe().checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== "paid" || session.metadata?.reportId !== id || session.metadata?.kind !== "recheck") return fail();
    await recordPurchase({ sessionId, reportId: id, email: session.customer_details?.email || null, amount: session.amount_total, createdAt: new Date().toISOString() });
    const pay = await createRecheckPayment({
      reportId: id,
      sessionId,
      paymentIntent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id || null,
      amount: session.amount_total ?? RECHECK_PRICE_CENTS,
      dev: false,
    });
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  } catch (e) {
    console.error("[recheck/start] verify failed", e);
    return fail();
  }
}
