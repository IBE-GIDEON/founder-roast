import { NextResponse } from "next/server";
import { AnalyzeError } from "@/lib/analyze";
import { CrawlError } from "@/lib/crawl";
import { runRecheck } from "@/lib/recheck";
import type { RoastEvent } from "@/lib/reports";

export const runtime = "nodejs";
export const maxDuration = 300;

/** POST { token } → NDJSON stream of the live fix check. The token comes from a verified payment. */
export async function POST(req: Request) {
  const { token } = (await req.json().catch(() => ({}))) as { token?: string };
  if (!token) return NextResponse.json({ error: "Missing fix check token." }, { status: 400 });

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: RoastEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {}
      };
      try {
        await runRecheck(token, emit);
      } catch (e) {
        const error =
          e instanceof CrawlError || e instanceof AnalyzeError ? e.message : (console.error("[recheck] failed", e), "Something broke on our side. Refresh to retry; you won't be charged again.");
        emit({ t: "error", error });
      } finally {
        controller.close();
      }
    },
  });
  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-cache, no-transform", "X-Accel-Buffering": "no" },
  });
}
