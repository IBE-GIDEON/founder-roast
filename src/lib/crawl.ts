import "server-only";
import { lookup, Resolver } from "node:dns/promises";
import net from "node:net";
import * as cheerio from "cheerio";
import { Agent, fetch as ufetch } from "undici";

export class CrawlError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36 FounderRoast/1.0";
const MAX_BYTES = 2_500_000;
const TIMEOUT_MS = 12_000;

// ── URL normalisation ────────────────────────────────────────────────

export function normalizeUrl(input: string): URL {
  let raw = (input || "").trim();
  if (!raw) throw new CrawlError("Paste your startup's URL.");
  if (!/^https?:\/\//i.test(raw)) raw = "https://" + raw;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new CrawlError("That doesn't look like a URL.");
  }
  if (!["http:", "https:"].includes(url.protocol)) throw new CrawlError("Only http and https URLs work.");
  if (url.username || url.password) throw new CrawlError("URLs with credentials aren't allowed.");
  if (url.port && !["80", "443"].includes(url.port)) throw new CrawlError("Only standard web ports are allowed.");
  const host = url.hostname.toLowerCase();
  if (!host.includes(".") || host.endsWith(".local") || host.endsWith(".internal") || host === "localhost") {
    throw new CrawlError("Use your public website address.");
  }
  if (net.isIP(host.replace(/^\[|\]$/g, ""))) throw new CrawlError("Use a domain name, not an IP address.");
  url.hash = "";
  return url;
}

/** Key used to cache roasts per site: host + path, without www / trailing slash / query. */
export function cacheKeyFor(url: URL): string {
  const host = url.hostname.replace(/^www\./, "");
  const p = url.pathname.replace(/\/+$/, "");
  return (host + p).toLowerCase();
}

// ── SSRF guard ───────────────────────────────────────────────────────

function isPrivateIPv4(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    (a === 192 && b === 0) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  );
}

function isPrivateIP(ip: string): boolean {
  if (net.isIPv4(ip)) return isPrivateIPv4(ip);
  const v6 = ip.toLowerCase();
  if (v6 === "::" || v6 === "::1") return true;
  if (v6.startsWith("::ffff:")) return isPrivateIPv4(v6.slice(7));
  return /^(fc|fd|fe8|fe9|fea|feb|ff)/.test(v6);
}

// Public DNS fallback for when the OS resolver is flaky (common on hotspots and some hosts).
const publicResolver = new Resolver({ timeout: 3000, tries: 2 });
publicResolver.setServers((process.env.DNS_FALLBACK_SERVERS || "1.1.1.1,8.8.8.8").split(",").map((s) => s.trim()));

type Addr = { address: string; family: number };

/** Resolves a hostname and refuses anything that points at a private or internal network. */
async function resolvePublic(hostname: string): Promise<Addr[]> {
  let addrs: Addr[] = [];
  try {
    addrs = await lookup(hostname, { all: true });
  } catch {
    const [v4, v6] = await Promise.all([publicResolver.resolve4(hostname).catch(() => []), publicResolver.resolve6(hostname).catch(() => [])]);
    addrs = [...v4.map((address) => ({ address, family: 4 })), ...v6.map((address) => ({ address, family: 6 }))];
  }
  if (!addrs.length) throw new CrawlError(`We couldn't find ${hostname}. Check the spelling?`);
  if (addrs.some((a) => isPrivateIP(a.address))) throw new CrawlError("That address isn't a public website.");
  return addrs;
}

/**
 * Every connection resolves through resolvePublic at connect time, so the IP we validated is the IP we connect to.
 * This closes the DNS-rebinding gap in a check-then-fetch SSRF guard.
 */
const guardedAgent = new Agent({
  connect: {
    lookup: (hostname: string, options: { all?: boolean }, cb: (...args: unknown[]) => void) => {
      resolvePublic(hostname).then(
        (addrs) => (options?.all ? cb(null, addrs) : cb(null, addrs[0].address, addrs[0].family)),
        (err) => cb(err),
      );
    },
  } as never,
});

// ── Fetching ─────────────────────────────────────────────────────────

interface Fetched {
  finalUrl: URL;
  html: string;
  status: number;
  ms: number;
  bytes: number;
}

async function readCapped(res: { body: { getReader(): ReadableStreamDefaultReader<Uint8Array> } | null }): Promise<{ text: string; bytes: number }> {
  const reader = res.body?.getReader();
  if (!reader) return { text: "", bytes: 0 };
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_BYTES) {
      await reader.cancel();
      break;
    }
    chunks.push(value);
  }
  const buf = new Uint8Array(chunks.reduce((n, c) => n + c.byteLength, 0));
  let off = 0;
  for (const c of chunks) {
    buf.set(c, off);
    off += c.byteLength;
  }
  return { text: new TextDecoder("utf-8", { fatal: false }).decode(buf), bytes: total };
}

export async function safeFetch(start: URL, timeoutMs = TIMEOUT_MS): Promise<Fetched> {
  let url = start;
  const t0 = Date.now();
  for (let hop = 0; hop < 6; hop++) {
    await resolvePublic(url.hostname); // fail fast with a friendly message
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    let res: Awaited<ReturnType<typeof ufetch>>;
    try {
      res = await ufetch(url, {
        redirect: "manual",
        signal: ctrl.signal,
        dispatcher: guardedAgent,
        headers: {
          "User-Agent": UA,
          Accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.5",
          "Accept-Language": "en-US,en;q=0.9",
        },
      });
    } catch (e) {
      clearTimeout(timer);
      if ((e as { cause?: unknown }).cause instanceof CrawlError) throw (e as { cause: CrawlError }).cause;
      const aborted = (e as Error).name === "AbortError";
      throw new CrawlError(aborted ? `${url.hostname} took too long to respond.` : `We couldn't reach ${url.hostname}.`, 422);
    }
    if (res.status >= 300 && res.status < 400 && res.headers.get("location")) {
      clearTimeout(timer);
      const next = new URL(res.headers.get("location")!, url);
      if (!["http:", "https:"].includes(next.protocol)) throw new CrawlError("The site redirected somewhere odd.", 422);
      url = next;
      continue;
    }
    const type = res.headers.get("content-type") || "";
    if (!type.includes("html")) {
      clearTimeout(timer);
      throw new CrawlError("That URL isn't a web page.", 422);
    }
    const { text, bytes } = await readCapped(res as never);
    clearTimeout(timer);
    return { finalUrl: url, html: text, status: res.status, ms: Date.now() - t0, bytes };
  }
  throw new CrawlError("Too many redirects.", 422);
}

// ── Extraction ───────────────────────────────────────────────────────

export interface PageData {
  url: string;
  status: number;
  responseMs: number;
  bytes: number;
  https: boolean;
  lang: string | null;
  title: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: boolean;
  viewport: boolean;
  favicon: string | null;
  xHandle: string | null;
  h1: string[];
  h2: string[];
  h3: string[];
  ctas: string[];
  navLinks: string[];
  bodyText: string;
  wordCount: number;
  images: number;
  imagesMissingAlt: number;
  logoImages: number;
  forms: number;
  emailInputs: number;
  scripts: number;
  stylesheets: number;
  fontFamilies: string[];
  socialLinks: string[];
  hasPrivacy: boolean;
  hasTerms: boolean;
  hasContact: boolean;
  priceMentions: string[];
  testimonialSignals: number;
  trustPhrases: string[];
  numbers: string[];
  internal: { pricing: string | null; about: string | null };
  likelyJsRendered: boolean;
}

const CTA_RE =
  /\b(get started|start|try|sign ?up|join|book|request|schedule|demo|buy|subscribe|download|install|create|launch|claim|get access|waitlist|contact sales|talk to)\b/i;
const TRUST_RE =
  /(trusted by|loved by|used by|customers|testimonial|reviews?|rated|\d+(\.\d)?\s?\/\s?5|★|stars?|case stud|soc ?2|gdpr|hipaa|iso ?27001|money[- ]back|guarantee|secure|encrypted|backed by|y combinator|as seen (in|on)|featured (in|on))/gi;

function clean(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function uniq(arr: string[], max: number) {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const a of arr) {
    const k = a.toLowerCase();
    if (!a || seen.has(k)) continue;
    seen.add(k);
    out.push(a);
    if (out.length >= max) break;
  }
  return out;
}

const X_RESERVED = new Set(["intent", "share", "home", "i", "search", "hashtag", "login", "signup", "explore", "settings"]);

function handleFromUrl(href: string): string | null {
  try {
    const u = new URL(href);
    if (!/(^|\.)(x|twitter)\.com$/.test(u.hostname)) return null;
    const first = u.pathname.split("/").filter(Boolean)[0];
    if (!first || X_RESERVED.has(first.toLowerCase()) || !/^[A-Za-z0-9_]{1,15}$/.test(first)) return null;
    return first;
  } catch {
    return null;
  }
}

export function extract(html: string, pageUrl: URL, meta: { status: number; ms: number; bytes: number }): PageData {
  const $ = cheerio.load(html);
  const abs = (href?: string) => {
    try {
      return href ? new URL(href, pageUrl).toString() : null;
    } catch {
      return null;
    }
  };

  // Gather structural signals before stripping noise.
  const scripts = $("script[src]").length + $("script:not([src])").length;
  const stylesheets = $('link[rel="stylesheet"]').length + $("style").length;
  const fontFamilies = uniq(
    $('link[href*="fonts.googleapis.com"]')
      .map((_, el) => {
        const href = $(el).attr("href") || "";
        return [...href.matchAll(/family=([^:&]+)/g)].map((m) => decodeURIComponent(m[1].replace(/\+/g, " ")));
      })
      .get()
      .flat(),
    8,
  );

  const twitterMeta = $('meta[name="twitter:site"], meta[name="twitter:creator"]').attr("content") || "";
  let xHandle: string | null = /^@?[A-Za-z0-9_]{1,15}$/.test(twitterMeta.trim()) ? twitterMeta.trim().replace(/^@/, "") : null;

  const allLinks = $("a[href]")
    .map((_, el) => ({ href: abs($(el).attr("href")) || "", text: clean($(el).text()) }))
    .get();

  const socialLinks = uniq(
    allLinks
      .map((l) => l.href)
      .filter((h) => /(x\.com|twitter\.com|linkedin\.com|github\.com|youtube\.com|instagram\.com|tiktok\.com|discord\.(gg|com)|producthunt\.com)/.test(h)),
    10,
  );
  if (!xHandle) {
    for (const l of socialLinks) {
      const h = handleFromUrl(l);
      if (h) {
        xHandle = h;
        break;
      }
    }
  }

  const host = pageUrl.hostname.replace(/^www\./, "");
  const internalLinks = allLinks.filter((l) => {
    try {
      return new URL(l.href).hostname.replace(/^www\./, "") === host;
    } catch {
      return false;
    }
  });
  const findInternal = (re: RegExp) =>
    internalLinks.find((l) => re.test(new URL(l.href).pathname) || re.test(l.text.toLowerCase()))?.href || null;

  const images = $("img");
  const imagesMissingAlt = images.filter((_, el) => !($(el).attr("alt") || "").trim()).length;
  const logoImages = images.filter((_, el) => /logo/i.test(($(el).attr("alt") || "") + ($(el).attr("src") || ""))).length;

  const iconHref =
    $('link[rel="icon"]').attr("href") ||
    $('link[rel="shortcut icon"]').attr("href") ||
    $('link[rel="apple-touch-icon"]').attr("href");

  $("script, style, noscript, svg, template, iframe").remove();

  // Keep words apart: "Email for<br/>developers" must read "Email for developers", not "Email fordevelopers".
  // Spans are left alone so letter-by-letter animated headlines don't become "H e l l o".
  $("br, hr").replaceWith(" ");
  $("p, div, li, dt, dd, td, th, h1, h2, h3, h4, h5, h6, a, button, label, section, article, header, footer, nav, blockquote, figcaption").after(" ");

  const textOf = (sel: string, max: number, maxLen = 160) =>
    uniq(
      $(sel)
        .map((_, el) => clean($(el).text()).slice(0, maxLen))
        .get()
        .filter((t) => t.length > 1),
      max,
    );

  const ctas = uniq(
    $("a, button")
      .map((_, el) => clean($(el).text()))
      .get()
      .filter((t) => t.length > 1 && t.length < 40 && CTA_RE.test(t)),
    12,
  );
  const navLinks = textOf("nav a, header a", 14, 40);

  const bodyText = clean($("body").text());
  const footerText = clean($("footer").text()).toLowerCase();
  const allTextLower = bodyText.toLowerCase();

  const trustPhrases = uniq((bodyText.match(TRUST_RE) || []).map((s) => s.toLowerCase()), 12);
  const priceMentions = uniq(bodyText.match(/(?:[$€£]\s?\d[\d,.]*(?:\s?\/\s?(?:mo|month|yr|year|user|seat))?)/gi) || [], 10);
  const numbers = uniq(bodyText.match(/\b\d[\d,.]*\s?(?:k|m|\+|%|x)\+?(?:\s(?:users|customers|teams|companies|founders|downloads|reviews|hours|revenue))?/gi) || [], 10);

  return {
    url: pageUrl.toString(),
    status: meta.status,
    responseMs: meta.ms,
    bytes: meta.bytes,
    https: pageUrl.protocol === "https:",
    lang: $("html").attr("lang") || null,
    title: clean($("title").first().text()).slice(0, 200),
    metaDescription: clean($('meta[name="description"]').attr("content") || "").slice(0, 300),
    ogTitle: clean($('meta[property="og:title"]').attr("content") || "").slice(0, 200),
    ogDescription: clean($('meta[property="og:description"]').attr("content") || "").slice(0, 300),
    ogImage: !!$('meta[property="og:image"]').attr("content"),
    viewport: !!$('meta[name="viewport"]').attr("content"),
    favicon: abs(iconHref) || new URL("/favicon.ico", pageUrl).toString(),
    xHandle,
    h1: textOf("h1", 4),
    h2: textOf("h2", 14),
    h3: textOf("h3", 16, 120),
    ctas,
    navLinks,
    bodyText: bodyText.slice(0, 9000),
    wordCount: bodyText.split(" ").filter(Boolean).length,
    images: images.length,
    imagesMissingAlt,
    logoImages,
    forms: $("form").length,
    emailInputs: $('input[type="email"]').length,
    scripts,
    stylesheets,
    fontFamilies,
    socialLinks,
    // Many sites use a single /legal or /policies page instead of separate privacy and terms links.
    hasPrivacy: /privacy|legal/.test(footerText) || allLinks.some((l) => /privacy|\/legal|\/policies|gdpr/i.test(l.href)),
    hasTerms: /terms|legal/.test(footerText) || allLinks.some((l) => /terms|\/tos\b|\/legal|\/policies/i.test(l.href)),
    hasContact: allLinks.some((l) => /^mailto:|contact|support/i.test(l.href)) || /contact|support@/.test(allTextLower),
    priceMentions,
    testimonialSignals: $("blockquote, [class*='testimonial' i], [class*='review' i], [class*='quote' i]").length,
    trustPhrases,
    numbers,
    internal: {
      pricing: findInternal(/pricing|plans/),
      about: findInternal(/about|team|company/),
    },
    likelyJsRendered: bodyText.length < 300,
  };
}

// ── JS-rendered fallback ─────────────────────────────────────────────

async function readerFallback(url: URL): Promise<string | null> {
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 20_000);
    const headers: Record<string, string> = { Accept: "text/plain", "X-Return-Format": "markdown" };
    if (process.env.JINA_API_KEY) headers.Authorization = `Bearer ${process.env.JINA_API_KEY}`;
    const res = await fetch(`https://r.jina.ai/${url.toString()}`, { headers, signal: ctrl.signal, cache: "no-store" });
    clearTimeout(timer);
    if (!res.ok) return null;
    const text = await res.text();
    return text.slice(0, 9000);
  } catch {
    return null;
  }
}

// ── Public entry ─────────────────────────────────────────────────────

export interface CrawlResult {
  home: PageData;
  extraPages: { kind: "pricing" | "about"; url: string; h1: string[]; h2: string[]; text: string; priceMentions: string[] }[];
  renderedText: string | null;
}

export async function crawlSite(url: URL): Promise<CrawlResult> {
  const first = await safeFetch(url);
  if (first.status >= 400) {
    throw new CrawlError(`${first.finalUrl.hostname} returned an error (${first.status}). Is the site up?`, 422);
  }
  const home = extract(first.html, first.finalUrl, { status: first.status, ms: first.ms, bytes: first.bytes });

  const extras = (["pricing", "about"] as const)
    .map((kind) => ({ kind, href: home.internal[kind] }))
    .filter((x): x is { kind: "pricing" | "about"; href: string } => !!x.href && x.href !== home.url);

  const [extraPages, renderedText] = await Promise.all([
    Promise.all(
      extras.map(async ({ kind, href }) => {
        try {
          const f = await safeFetch(new URL(href), 8000);
          if (f.status >= 400) return null;
          const p = extract(f.html, f.finalUrl, { status: f.status, ms: f.ms, bytes: f.bytes });
          return { kind, url: p.url, h1: p.h1, h2: p.h2.slice(0, 8), text: p.bodyText.slice(0, 2500), priceMentions: p.priceMentions };
        } catch {
          return null;
        }
      }),
    ).then((r) => r.filter((x): x is NonNullable<typeof x> => !!x)),
    home.likelyJsRendered ? readerFallback(first.finalUrl) : Promise.resolve(null),
  ]);

  if (home.likelyJsRendered && !renderedText) {
    throw new CrawlError("Your site renders entirely in JavaScript and we couldn't read it. Try again in a minute.", 422);
  }

  return { home, extraPages, renderedText };
}
