import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { captureOrder, paypalEnabled } from "@/lib/paypal";
import { createRecheckPayment } from "@/lib/recheck";
import { getReport, recordPurchase } from "@/lib/reports";
import { baseUrl, IS_PROD, RECHECK_PRICE_CENTS } from "@/lib/site";

export const runtime = "nodejs";

/** PayPal returns fix-check buyers here (?token=ORDER_ID). Capture and verify, then start the live fix check. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);
  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || paypalEnabled()) return fail();
    const key = (await cookies()).get(accessCookieName(id))?.value;
    if (!isValidKey(id, key)) return fail();
    const pay = await createRecheckPayment({ reportId: id, orderId: null, captureId: null, amount: RECHECK_PRICE_CENTS, dev: true });
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  }

  const orderId = url.searchParams.get("token");
  if (!orderId || !paypalEnabled()) return fail();
  try {
    const cap = await captureOrder(orderId);
    if (!cap.completed || cap.customId !== `recheck:${id}` || cap.currency !== "USD" || cap.amountCents < RECHECK_PRICE_CENTS) return fail();
    await recordPurchase({ sessionId: orderId, reportId: id, email: cap.email, amount: cap.amountCents, createdAt: new Date().toISOString() });
    const pay = await createRecheckPayment({ reportId: id, orderId, captureId: cap.captureId, amount: cap.amountCents, dev: false });
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  } catch (e) {
    console.error("[recheck/start] capture failed", e);
    return fail();
  }
}
