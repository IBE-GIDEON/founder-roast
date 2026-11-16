import { NextResponse } from "next/server";
import { sendTestEmail } from "@/lib/email";

export const runtime = "nodejs";

/** POST with header x-admin-key: sends one test email to the support inbox. */
export async function POST(req: Request) {
  const admin = process.env.ADMIN_KEY;
  if (!admin || req.headers.get("x-admin-key") !== admin) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const sent = await sendTestEmail();
  return NextResponse.json({ sent }, { status: sent ? 200 : 502 });
}
