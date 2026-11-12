import { NextResponse } from "next/server";
import { accessCookieName, accessKeyFor } from "@/lib/access";
import { sendReportEmail } from "@/lib/email";
import { captureOrder, paypalEnabled } from "@/lib/paypal";
import { getReport, recordPurchase } from "@/lib/reports";
import { baseUrl, IS_PROD, PRICE_CENTS } from "@/lib/site";

export const runtime = "nodejs";

/** PayPal sends buyers here after approving (?token=ORDER_ID). Capture, verify, then hand over the private link. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);

  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || paypalEnabled()) return fail();
  } else {
    const orderId = url.searchParams.get("token");
    if (!orderId || !paypalEnabled()) return fail();
    try {
      const cap = await captureOrder(orderId);
      // A $15 fix-check payment (custom_id "recheck:…") must never unlock the $39 report.
      if (!cap.completed || cap.customId !== `report:${id}` || cap.currency !== "USD" || cap.amountCents < PRICE_CENTS) return fail();
      const first = await recordPurchase({ sessionId: orderId, reportId: id, email: cap.email, amount: cap.amountCents, createdAt: new Date().toISOString() });
      if (first && cap.email) await sendReportEmail(cap.email, report.domain, `${base}/r/${id}?k=${accessKeyFor(id)}`);
    } catch (e) {
      console.error("[unlock] capture failed", e);
      return fail();
    }
  }

  const key = accessKeyFor(id);
  const res = NextResponse.redirect(`${base}/r/${id}?k=${key}&welcome=1`, 303);
  res.cookies.set(accessCookieName(id), key, {
    httpOnly: true,
    sameSite: "lax",
    secure: IS_PROD,
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
  });
  return res;
}
