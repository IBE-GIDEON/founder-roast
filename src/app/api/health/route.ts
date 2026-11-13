import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Which build is live, and which services are configured (never the secrets themselves). */
export function GET() {
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
  });
}
