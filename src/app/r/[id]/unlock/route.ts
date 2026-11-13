import { NextResponse } from "next/server";
import { accessCookieName, accessKeyFor } from "@/lib/access";
import { fulfilReport, validPayment } from "@/lib/fulfil";
import { paystackEnabled, verifyTransaction } from "@/lib/paystack";
import { getReport } from "@/lib/reports";
import { baseUrl, IS_PROD } from "@/lib/site";

export const runtime = "nodejs";

/** Paystack sends buyers here after paying (?reference=…). Verify, then hand over the private link. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const url = new URL(req.url);
  const base = baseUrl(req);
  const report = await getReport(id);
  if (!report) return NextResponse.redirect(`${base}/`, 303);

  const fail = () => NextResponse.redirect(`${base}/r/${id}?payment=unverified`, 303);

  if (url.searchParams.get("dev") === "1") {
    if (IS_PROD || paystackEnabled()) return fail();
  } else {
    const reference = url.searchParams.get("reference") || url.searchParams.get("trxref");
    if (!reference || !paystackEnabled()) return fail();
    try {
      const v = await verifyTransaction(reference);
      // A fix-check payment (kind "recheck") must never unlock the full report.
      if (!validPayment(v, "report", id)) return fail();
      await fulfilReport(v, base);
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
