import { NextResponse } from "next/server";
import { chargeLabel, usdRate } from "@/lib/pricing";
import { CURRENCY, PRICE_LABEL, RECHECK_LABEL } from "@/lib/site";

export const dynamic = "force-dynamic";

/** Which build is live, which services are configured (never the secrets themselves), and today's prices. */
export async function GET() {
  const [reportCharge, recheckCharge, rate] = await Promise.all([chargeLabel("report"), chargeLabel("recheck"), usdRate()]);
  return NextResponse.json({
    ok: true,
    version: (process.env.VERCEL_GIT_COMMIT_SHA || "dev").slice(0, 7),
    configured: {
      ai: !!process.env.GROQ_API_KEY,
      secondAi: process.env.GEMINI_API_KEY ? "gemini" : process.env.EXTRA_LLM_URL && process.env.EXTRA_LLM_KEY ? "extra" : false,
      storage: !!(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
      payments: !!process.env.PAYSTACK_SECRET_KEY,
      email: !!((process.env.SMTP_USER && process.env.SMTP_PASS) || process.env.RESEND_API_KEY),
    },
    prices: {
      currency: CURRENCY,
      usdRate: rate,
      report: { shown: PRICE_LABEL, charged: reportCharge ?? PRICE_LABEL },
      fixCheck: { shown: RECHECK_LABEL, charged: recheckCharge ?? RECHECK_LABEL },
    },
  });
}
