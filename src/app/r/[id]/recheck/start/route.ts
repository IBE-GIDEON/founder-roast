import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { accessCookieName, isValidKey } from "@/lib/access";
import { fulfilRecheck, validPayment } from "@/lib/fulfil";
import { paystackEnabled, verifyTransaction } from "@/lib/paystack";
import { createRecheckPayment } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { baseUrl, IS_PROD, RECHECK_PRICE_CENTS } from "@/lib/site";

export const runtime = "nodejs";

/** Paystack returns fix-check buyers here (?reference=…). Verify, then start the live fix check. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);
  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || paystackEnabled()) return fail();
    const key = (await cookies()).get(accessCookieName(id))?.value;
    if (!isValidKey(id, key)) return fail();
    const pay = await createRecheckPayment({ reportId: id, reference: null, amount: RECHECK_PRICE_CENTS, dev: true });
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  }

  const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
  if (!reference || !paystackEnabled()) return fail();
  try {
    const v = await verifyTransaction(reference);
    if (!validPayment(v, "recheck", id)) return fail();
    const pay = await fulfilRecheck(v, base);
    return NextResponse.redirect(`${base}/roast?check=${pay.token}`, 303);
  } catch (e) {
    console.error("[recheck/start] verify failed", e);
    return fail();
  }
}
