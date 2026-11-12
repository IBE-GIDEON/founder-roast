import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { notFound } from "next/navigation";
import { accessCookieName, isValidKey } from "@/lib/access";
import { listRechecks } from "@/lib/recheck";
import { getReport } from "@/lib/reports";
import { configuredSiteUrl, PRICE_LABEL, X_HANDLE } from "@/lib/site";
import { toFreeReport } from "@/lib/types";
import { Footer } from "@/components/Footer";
import { FixCheckPanel } from "@/components/report/FixCheckPanel";
import { ReportView } from "@/components/report/ReportView";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function origin() {
  const configured = configuredSiteUrl();
  if (configured) return configured;
  const h = await headers();
  return `${h.get("x-forwarded-proto") || "http"}://${h.get("host") || "localhost:3000"}`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const r = await getReport(id);
  if (!r) return { title: "Roast not found" };
  const title = `${r.domain} got roasted: ${r.overall}/100`;
  return {
    title,
    description: r.roast,
    openGraph: { title, description: r.roast, images: [{ url: `/api/card/${r.id}`, width: 1200, height: 630 }] },
    twitter: { card: "summary_large_image", title, description: r.roast, images: [`/api/card/${r.id}`] },
    robots: { index: false },
  };
}

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

export default async function ReportPage({ params, searchParams }: Props) {
  const { id } = await params;
  const sp = await searchParams;
  const report = await getReport(id);
  if (!report) notFound();

  const keyParam = typeof sp.k === "string" ? sp.k : undefined;
  const cookieKey = (await cookies()).get(accessCookieName(id))?.value;
  const key = isValidKey(id, keyParam) ? keyParam! : isValidKey(id, cookieKey) ? cookieKey! : null;
  const unlocked = !!key;
  const history = await listRechecks(id).catch(() => []);
  const last = history[history.length - 1];

  const base = await origin();
  const shareUrl = `${base}/r/${report.id}`;
  const tweet = `${report.domain} just got roasted: ${report.overall}/100\n\n“${report.roast}”\n\n${X_HANDLE ? `via @${X_HANDLE} ` : ""}`;

  const notice =
    sp.welcome === "1" && unlocked ? (
      <div role="status" className="rise rounded-lg border border-[#abefc6] bg-[#f6fef9] px-5 py-3.5 text-[13.5px] text-[#067647]">
        <span className="font-semibold">Payment confirmed.</span> Your full report is below.
      </div>
    ) : sp.payment === "unverified" ? (
      <div role="alert" className="rounded-lg border border-[#fedf89] bg-[#fffcf5] px-5 py-3.5 text-[13.5px] text-[#b54708]">
        We couldn&apos;t verify that payment yet. If you were charged, refresh in a few seconds or check your email.
      </div>
    ) : null;

  return (
    <>
      <ReportView
        free={toFreeReport(report)}
        full={unlocked ? report : null}
        price={PRICE_LABEL}
        shareUrl={shareUrl}
        tweet={tweet}
        cardUrl={`/api/card/${report.id}`}
        pdfUrl={key ? `/api/report/${report.id}/pdf?k=${key}` : undefined}
        privateUrl={key ? `${shareUrl}?k=${key}` : undefined}
        notice={notice}
        upToDateSince={last?.allClear ? fmt(last.createdAt) : undefined}
        fixCheck={
          key ? (
            <FixCheckPanel
              reportId={report.id}
              accessKey={key}
              findings={report.blindSpots.length + Object.values(report.scores).reduce((n, s) => n + s.issues.length, 0)}
              history={history}
            />
          ) : undefined
        }
      />
      <div className="bg-bg">
        <Footer />
      </div>
    </>
  );
}
