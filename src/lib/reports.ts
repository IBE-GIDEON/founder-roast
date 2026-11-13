import "server-only";
import { randomBytes } from "node:crypto";
import { analyze } from "./analyze";
import { guessMarket, readCompetitor, signalsOf, type CompetitorRead } from "./competitors";
import { strategize } from "./strategy";
import { cacheKeyFor, crawlSite, normalizeUrl } from "./crawl";
import { getJSON, setJSON, store } from "./store";
import { logoFor, type Report, type TraceLine } from "./types";

const ID_ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
/**
 * One roast per site. Coming back returns the original roast instead of generating fresh findings;
 * changes are verified with a paid fix check against the original findings, never re-roasted from scratch.
 */
const CACHE_TTL = 60 * 60 * 24 * 180;

export function newId(len = 10): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ID_ALPHABET[bytes[i] % ID_ALPHABET.length];
  return out;
}

export const isValidId = (id: string) => /^[A-Za-z0-9]{6,20}$/.test(id);

export async function getReport(id: string): Promise<Report | null> {
  if (!isValidId(id)) return null;
  const r = await getJSON<Partial<Report> & Omit<Report, "category" | "competitors" | "comparison" | "blindSpots" | "trace">>(`report:${id}`);
  if (!r) return null;
  // reports saved before competitors/blind spots existed
  return { ...r, category: r.category ?? "", competitors: r.competitors ?? [], comparison: r.comparison ?? [], blindSpots: r.blindSpots ?? [], trace: r.trace ?? [] };
}

export async function roastCount(): Promise<number> {
  return Number((await store().get("stats:roasts")) || 0);
}

/** The roast of the same site from the last 24h, if any. */
export async function findCachedReport(url: URL): Promise<Report | null> {
  const cachedId = await store().get(`cache:${cacheKeyFor(url)}`);
  return cachedId ? getReport(cachedId) : null;
}

// ── Live progress events (streamed to the browser as NDJSON) ─────────

export type RoastEvent =
  | { t: "meta"; domain: string; cached: boolean }
  | { t: "step"; text: string; detail?: string; level: TraceLine["level"] }
  | { t: "market"; category: string; audience: string }
  | { t: "competitor"; domain: string; name: string; logo: string; status: "found" | "read" | "failed"; headline?: string }
  | { t: "done"; id: string; overall: number; href?: string }
  | { t: "error"; error: string };

type Emit = (e: RoastEvent) => void;

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.round(n / 1024)} KB`);
const q = (s: string, n = 90) => `“${s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s}”`;

/** Replays a stored roast's trace so returning visitors see the same checks, not new findings. */
export function replay(report: Report, emit: Emit, upToDateSince?: string) {
  const when = new Date(report.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  emit({ t: "meta", domain: report.domain, cached: true });
  emit({ t: "step", text: `${report.domain} was already roasted on ${when}`, level: "info", detail: "Loading that roast. Fixed things since? Run a fix check from the report." });
  for (const line of report.trace) emit({ t: "step", ...line });
  for (const c of report.competitors) emit({ t: "competitor", domain: c.domain, name: c.name, logo: c.logo, status: "read", headline: c.headline });
  if (upToDateSince) {
    emit({ t: "step", text: "This site is up to date", level: "ok", detail: `It passed its fix check on ${upToDateSince}. No need for another roast.` });
  }
  emit({ t: "done", id: report.id, overall: report.overall });
}

/** Crawl, find competitors, analyse and save. Every real check is emitted as it happens. */
export async function createReport(input: string, emit: Emit = () => {}): Promise<Report> {
  const trace: TraceLine[] = [];
  const step = (text: string, level: TraceLine["level"] = "ok", detail?: string) => {
    const line: TraceLine = detail ? { text, detail, level } : { text, level };
    trace.push(line);
    emit({ t: "step", ...line });
  };

  const url = normalizeUrl(input);
  emit({ t: "meta", domain: url.hostname.replace(/^www\./, ""), cached: false });

  // 1. Your site
  const crawl = await crawlSite(url);
  const h = crawl.home;
  const host = new URL(h.url).hostname.replace(/^www\./, "");
  step(`Connected to ${host}`, "ok", `${h.status} · ${h.responseMs} ms · ${kb(h.bytes)} of HTML${h.https ? " · HTTPS" : " · no HTTPS"}`);
  step("Reading your title and meta description", h.metaDescription ? "ok" : "warn", h.metaDescription ? q(h.metaDescription) : `No meta description. Title: ${q(h.title || "none")}`);
  step("Reading your hero headline", h.h1.length ? "ok" : "warn", h.h1.length ? q(h.h1[0]) : "No H1 on the page");
  step("Scanning section headings", h.h2.length >= 3 ? "ok" : "warn", `${h.h2.length} sections${h.h2[0] ? `, starting with ${q(h.h2[0], 50)}` : ""}`);
  step(
    "Checking calls to action",
    h.ctas.length ? "ok" : "warn",
    h.ctas.length ? `Found ${h.ctas.length}: ${h.ctas.slice(0, 3).map((c) => `“${c}”`).join(", ")}` : "No clear call to action found",
  );
  step(
    "Looking for social proof",
    h.testimonialSignals || h.logoImages >= 3 ? "ok" : "warn",
    `${h.testimonialSignals} testimonial blocks · ${h.logoImages} logo images${h.numbers.length ? ` · stats: ${h.numbers.slice(0, 2).join(", ")}` : ""}`,
  );
  step(
    "Confirming trust signals",
    h.hasPrivacy && h.hasContact ? "ok" : "warn",
    [h.hasPrivacy ? "privacy ✓" : "no privacy page", h.hasTerms ? "terms ✓" : "no terms", h.hasContact ? "contact ✓" : "no contact", h.trustPhrases[0] ? `“${h.trustPhrases[0]}”` : ""].filter(Boolean).join(" · "),
  );
  const pricing = crawl.extraPages.find((p) => p.kind === "pricing");
  const prices = [...h.priceMentions, ...(pricing?.priceMentions || [])];
  step(
    pricing ? `Reading your pricing page` : "Checking pricing",
    prices.length ? "ok" : "warn",
    prices.length ? `${pricing ? new URL(pricing.url).pathname + " · " : ""}${[...new Set(prices)].slice(0, 3).join(", ")}` : "No prices found on the homepage or a pricing page",
  );
  const about = crawl.extraPages.find((p) => p.kind === "about");
  if (about) step("Reading your about page", "ok", `${new URL(about.url).pathname}${about.h1[0] ? ` · ${q(about.h1[0], 60)}` : ""}`);
  step(
    "Checking mobile, speed and share preview",
    h.viewport && h.ogImage && h.bytes < 1_500_000 ? "ok" : "warn",
    `${h.viewport ? "mobile viewport ✓" : "no mobile viewport"} · ${h.ogImage ? "share image ✓" : "no share image"} · ${h.images} images, ${h.imagesMissingAlt} missing alt`,
  );
  if (crawl.renderedText) step("Rendering JavaScript content", "info", "Raw HTML was thin, so we read the rendered page");

  // 2. Your market
  const market = await guessMarket(h, host);
  emit({ t: "market", category: market.category, audience: market.audience });
  step("Mapping your market", "info", `${market.category}${market.audience ? ` · for ${market.audience.toLowerCase()}` : ""}`);

  const seeds = market.seeds.slice(0, 4);
  for (const s of seeds) emit({ t: "competitor", domain: s.domain, name: s.name, logo: logoFor(s.domain), status: "found" });
  if (seeds.length) step(`Found ${seeds.length} competitors`, "ok", seeds.map((s) => s.name).join(", "));

  const reads = await Promise.all(
    seeds.map(async (s) => {
      const r = await readCompetitor(s);
      emit({ t: "competitor", domain: s.domain, name: s.name, logo: logoFor(s.domain), status: r ? "read" : "failed", headline: r?.headline });
      return r;
    }),
  );
  const comps = reads.filter((r): r is CompetitorRead => !!r);
  for (const c of comps) {
    const s = c.signals;
    step(
      `Reading ${c.name}'s homepage`,
      "ok",
      `${q(c.headline, 60)} · ${s.pricing.length ? `prices from ${s.pricing[0]}` : s.hasPricingPage ? "pricing page" : "no prices shown"} · ${s.freeOffer ? "free plan" : "no free plan"}`,
    );
  }
  if (comps.length) step("Comparing your page with theirs, side by side", "info", `You vs ${comps.map((c) => c.name).join(", ")}`);

  // 3. The verdict: page roast and business roast run in parallel
  step("Roasting the idea", "info", "Problem, timing, money, moat, distribution");
  step("Mapping your features against theirs", "info");
  step("Digging through the startup graveyard", "info", "Who tried this before and didn't make it");
  step("Scoring design, trust, positioning and revenue", "info");
  step("Hunting for blind spots", "info", "The things you stopped seeing");
  const [analysis, strategy] = await Promise.all([analyze(crawl, comps, market), strategize(crawl, comps, market)]);
  step(
    "Graveyard checked",
    strategy.graveyard.length ? "ok" : "info",
    (strategy.graveyard.length ? `${strategy.graveyard.length} confirmed shutdowns to learn from` : "No confirmed shutdowns in this exact space") +
      (strategy.graveyardDropped ? ` · ${strategy.graveyardDropped} skipped because they're still running` : ""),
  );
  step("Writing your landing page rewrite", "ok");

  const report: Report = {
    id: newId(),
    url: h.url,
    domain: host,
    createdAt: new Date().toISOString(),
    ...analysis,
    comparison: analysis.comparison.map((c) => ({ ...c, whyWinning: strategy.winners.find((w) => w.domain === c.domain)?.whyWinning })),
    category: market.category,
    competitors: comps.map(({ name, domain, logo, headline, description, signals }) => ({ name, domain, logo, headline, description, signals })),
    trace,
    selfSignals: signalsOf(h, pricing?.priceMentions),
    idea: strategy.idea,
    features: strategy.features,
    graveyard: strategy.graveyard,
    site: {
      title: h.title,
      description: h.metaDescription || h.ogDescription,
      favicon: h.favicon,
      xHandle: h.xHandle,
      pagesCrawled: [h.url, ...crawl.extraPages.map((p) => p.url), ...comps.map((c) => `https://${c.domain}/`)],
    },
  };

  await setJSON(`report:${report.id}`, report);
  await store().set(`cache:${cacheKeyFor(url)}`, report.id, CACHE_TTL);
  await store().set(`cache:${cacheKeyFor(new URL(h.url))}`, report.id, CACHE_TTL);
  await store().incr("stats:roasts", 60 * 60 * 24 * 3650);
  emit({ t: "done", id: report.id, overall: report.overall });
  return report;
}

export interface Purchase {
  sessionId: string;
  reportId: string;
  email: string | null;
  amount: number | null;
  createdAt: string;
}

/** Records a purchase once. Returns true the first time a session is seen. */
export async function recordPurchase(p: Purchase): Promise<boolean> {
  const key = `purchase:${p.sessionId}`;
  if (await store().get(key)) return false;
  await setJSON(key, p);
  await store().incr("stats:purchases", 60 * 60 * 24 * 3650);
  return true;
}
