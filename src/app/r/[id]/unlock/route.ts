import { NextResponse } from "next/server";
import { accessCookieName, accessKeyFor } from "@/lib/access";
import { sendReportEmail } from "@/lib/email";
import { getReport, recordPurchase } from "@/lib/reports";
import { baseUrl, IS_PROD } from "@/lib/site";
import { stripe, stripeEnabled } from "@/lib/stripe";

export const runtime = "nodejs";

/** Stripe sends buyers here after checkout. Verify the session, then hand over the private link. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);

  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || stripeEnabled()) return fail();
  } else {
    const sessionId = url.searchParams.get("session_id");
    if (!sessionId || !stripeEnabled()) return fail();
    try {
      const session = await stripe().checkout.sessions.retrieve(sessionId);
      // A $15 fix-check payment must never unlock the $39 report.
      if (session.payment_status !== "paid" || session.metadata?.reportId !== id || (session.metadata?.kind ?? "report") !== "report") return fail();
      const email = session.customer_details?.email || null;
      const first = await recordPurchase({
        sessionId,
        reportId: id,
        email,
        amount: session.amount_total,
        createdAt: new Date().toISOString(),
      });
      if (first && email) await sendReportEmail(email, report.domain, `${base}/r/${id}?k=${accessKeyFor(id)}`);
    } catch (e) {
      console.error("[unlock] verify failed", e);
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
