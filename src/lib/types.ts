export type ScoreKey = "design" | "trust" | "positioning" | "revenue";

export const SCORE_META: Record<ScoreKey, { label: string; blurb: string; weight: number }> = {
  design: {
    label: "Design",
    blurb: "Hierarchy, readability, visual polish and how fast the page feels.",
    weight: 0.2,
  },
  trust: {
    label: "Trust",
    blurb: "Proof, credibility signals, transparency and the reasons to believe you.",
    weight: 0.25,
  },
  positioning: {
    label: "Positioning",
    blurb: "Who it is for, what it does and why it beats the alternative, in five seconds.",
    weight: 0.3,
  },
  revenue: {
    label: "Revenue potential",
    blurb: "Pricing clarity, CTA strength, conversion path and willingness to pay.",
    weight: 0.25,
  },
};

export const SCORE_KEYS = Object.keys(SCORE_META) as ScoreKey[];

export interface SubScore {
  score: number;
  summary: string;
  issues: string[];
  fixes: string[];
}

export interface GrowthIdea {
  title: string;
  detail: string;
  impact: "high" | "medium" | "low";
  effort: "low" | "medium" | "high";
}

export interface Rewrite {
  headline: string;
  subheadline: string;
  primaryCta: string;
  secondaryCta: string;
  valueProps: { title: string; body: string }[];
  proofLine: string;
  closingLine: string;
}

/** One line of the live "what we checked" log. Stored with the report as proof of work. */
export interface TraceLine {
  text: string;
  detail?: string;
  level: "ok" | "warn" | "info";
}

/** A competitor we identified and actually read. */
export interface Competitor {
  name: string;
  domain: string;
  logo: string;
  headline: string;
  description: string;
}

/** Paid: how you stack up against one competitor. */
export interface CompetitorInsight {
  domain: string;
  theyDoBetter: string;
  youDoBetter: string;
  steal: string;
}

/** Paid: the "how did I miss that?" findings. Free view shows only the first title. */
export interface BlindSpot {
  title: string;
  evidence: string;
  fix: string;
}

/** Facts pulled from the crawl. Safe to show publicly. */
export interface SiteSummary {
  title: string;
  description: string;
  favicon: string | null;
  xHandle: string | null;
  pagesCrawled: string[];
}

export interface Report {
  id: string;
  url: string;
  domain: string;
  createdAt: string;
  /** "ai" = real Groq analysis, "demo" = heuristic fallback used when no Groq key is configured in development. */
  mode: "ai" | "demo";
  company: string;
  oneLiner: string;
  verdict: string;
  roast: string;
  overall: number;
  scores: Record<ScoreKey, SubScore>;
  growth: GrowthIdea[];
  rewrite: Rewrite;
  site: SiteSummary;
  category: string;
  competitors: Competitor[];
  comparison: CompetitorInsight[];
  blindSpots: BlindSpot[];
  trace: TraceLine[];
}

/** What an unpaid visitor is allowed to receive. Nothing from the paid sections leaves the server. */
export type FreeReport = Pick<
  Report,
  | "id"
  | "url"
  | "domain"
  | "createdAt"
  | "mode"
  | "company"
  | "oneLiner"
  | "verdict"
  | "roast"
  | "overall"
  | "site"
  | "category"
  | "competitors"
  | "trace"
> & { blindSpotTeaser: string | null; blindSpotCount: number };

export function toFreeReport(r: Report): FreeReport {
  return {
    id: r.id,
    url: r.url,
    domain: r.domain,
    createdAt: r.createdAt,
    mode: r.mode,
    company: r.company,
    oneLiner: r.oneLiner,
    verdict: r.verdict,
    roast: r.roast,
    overall: r.overall,
    site: r.site,
    category: r.category ?? "",
    competitors: r.competitors ?? [],
    trace: r.trace ?? [],
    blindSpotTeaser: r.blindSpots?.[0]?.title ?? null,
    blindSpotCount: r.blindSpots?.length ?? 0,
  };
}

export const logoFor = (domain: string) => `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
