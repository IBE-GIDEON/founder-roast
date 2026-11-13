import { NextResponse } from "next/server";
import { fulfilRecheck, fulfilReport, validPayment } from "@/lib/fulfil";
import { validWebhookSignature, verifyTransaction } from "@/lib/paystack";
import { baseUrl } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Paystack webhook (set it to https://YOUR_DOMAIN/api/paystack/webhook in Paystack → Settings → API Keys & Webhooks).
 * Backup for buyers who pay and close the tab: records the purchase and emails their link.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "Bad signature" }, { status: 401 });
  }

  let event: { event?: string; data?: { reference?: string } };
  try {
    event = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  }

  if (event.event === "charge.success" && event.data?.reference) {
    try {
      // Never trust the webhook body alone: confirm with Paystack's API.
      const v = await verifyTransaction(event.data.reference);
      const base = baseUrl(req);
      if (validPayment(v, "report", v.reportId)) await fulfilReport(v, base);
      else if (validPayment(v, "recheck", v.reportId)) await fulfilRecheck(v, base);
    } catch (e) {
      console.error("[paystack webhook] failed", e);
      return NextResponse.json({ error: "Retry later" }, { status: 500 });
    }
  }
  return NextResponse.json({ received: true });
}
