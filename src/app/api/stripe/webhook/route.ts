import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { accessKeyFor } from "@/lib/access";
import { sendReportEmail } from "@/lib/email";
import { getReport, recordPurchase } from "@/lib/reports";
import { baseUrl } from "@/lib/site";
import { stripe } from "@/lib/stripe";

export const runtime = "nodejs";

/**
 * Backup path for buyers who close the tab before the redirect lands:
 * records the purchase and emails the private link (if Resend is configured).
 */
export async function POST(req: Request) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "Webhook not configured" }, { status: 503 });

  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe().webhooks.constructEvent(raw, sig || "", secret);
  } catch (e) {
    return NextResponse.json({ error: `Bad signature: ${(e as Error).message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
    const session = event.data.object as Stripe.Checkout.Session;
    const reportId = session.metadata?.reportId;
    if (reportId && session.payment_status === "paid") {
      const report = await getReport(reportId);
      const email = session.customer_details?.email || null;
      const first = await recordPurchase({
        sessionId: session.id,
        reportId,
        email,
        amount: session.amount_total,
        createdAt: new Date().toISOString(),
      });
      // Fix-check payments are handled live on /r/[id]/recheck/start; only full-report buyers get the link email.
      if (first && report && email && (session.metadata?.kind ?? "report") === "report") {
        await sendReportEmail(email, report.domain, `${baseUrl(req)}/r/${reportId}?k=${accessKeyFor(reportId)}`);
      }
    }
  }

  return NextResponse.json({ received: true });
}
