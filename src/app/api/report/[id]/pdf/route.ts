import { cookies } from "next/headers";
import { accessCookieName, isValidKey } from "@/lib/access";
import { renderReportPdf } from "@/lib/pdf";
import { getReport } from "@/lib/reports";
import { watermarkHost } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const report = await getReport(id);
  if (!report) return new Response("Not found", { status: 404 });

  const params = new URL(req.url).searchParams;
  const key = params.get("k") || (await cookies()).get(accessCookieName(id))?.value;
  if (!isValidKey(id, key)) return new Response("This report is locked.", { status: 402 });

  const pdf = await renderReportPdf(report, watermarkHost(req));
  const filename = `founder-roast-${report.domain.replace(/[^a-z0-9.-]/gi, "-")}.pdf`;
  return new Response(new Uint8Array(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${params.get("inline") === "1" ? "inline" : "attachment"}; filename="${filename}"`,
      "Cache-Control": "private, no-store",
    },
  });
}
