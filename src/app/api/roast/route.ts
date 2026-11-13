import { NextResponse } from "next/server";
import { AnalyzeError } from "@/lib/analyze";
import { CrawlError, normalizeUrl } from "@/lib/crawl";
import { rateLimit } from "@/lib/rate-limit";
import { upToDate } from "@/lib/recheck";
import { createReport, findCachedReport, replay, type RoastEvent } from "@/lib/reports";
import type { Report } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 300;

const summary = (report: Report, cached: boolean) => ({
  id: report.id,
  cached,
  domain: report.domain,
  overall: report.overall,
  roast: report.roast,
  xHandle: report.site.xHandle,
  competitors: report.competitors.map((c) => c.name),
});

function errorMessage(e: unknown): { error: string; status: number } {
  if (e instanceof CrawlError) return { error: e.message, status: e.status };
  if (e instanceof AnalyzeError) return { error: e.message, status: 503 };
  console.error("[roast] failed", e);
  return { error: "Something broke on our side. Try again in a moment.", status: 500 };
}

/**
 * POST { url } → NDJSON stream of live checks (default), or a single JSON summary with ?format=json (used by the batch script).
 */
export async function POST(req: Request) {
  let body: { url?: string; fresh?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Send JSON: { url }" }, { status: 400 });
  }

  const isAdmin = !!process.env.ADMIN_KEY && req.headers.get("x-admin-key") === process.env.ADMIN_KEY;
  const fresh = isAdmin && !!body.fresh;
  const wantsJson = new URL(req.url).searchParams.get("format") === "json";

  // Validate first so typos never cost a free roast.
  let url: URL;
  try {
    url = normalizeUrl(body.url || "");
  } catch (e) {
    const { error, status } = errorMessage(e);
    return NextResponse.json({ error }, { status });
  }

  const cached = fresh ? null : await findCachedReport(url).catch(() => null);

  if (!cached) {
    const limit = Number(process.env.RATE_LIMIT_PER_HOUR || 5);
    try {
      if ((await rateLimit(req, "roast", limit, 60 * 60)) < 0) {
        return NextResponse.json(
          { error: `You've used your ${limit} free roasts this hour. Come back soon, or unlock a full report.` },
          { status: 429 },
        );
      }
    } catch (e) {
      console.error("[roast] rate limiter unavailable", (e as Error).message);
    }
  }

  if (wantsJson) {
    try {
      const report = cached ?? (await createReport(url.toString()));
      return NextResponse.json(summary(report, !!cached));
    } catch (e) {
      const { error, status } = errorMessage(e);
      return NextResponse.json({ error }, { status });
    }
  }

  const passed = cached ? await upToDate(cached.id).catch(() => null) : null;
  const passedOn = passed ? new Date(passed.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : undefined;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const emit = (e: RoastEvent) => {
        try {
          controller.enqueue(encoder.encode(JSON.stringify(e) + "\n"));
        } catch {}
      };
      try {
        if (cached) replay(cached, emit, passedOn);
        else await createReport(url.toString(), emit);
      } catch (e) {
        emit({ t: "error", error: errorMessage(e).error });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
