export const SITE_NAME = "Founder Roast";

/** Charge currency (must match what your Paystack account accepts). Amounts in it are in its smallest unit. */
export const CURRENCY = (process.env.PAYSTACK_CURRENCY || "USD").toUpperCase();
/** True when Paystack charges in dollars, so the price shown is exactly the price charged. */
export const CHARGES_IN_USD = CURRENCY === "USD";

const format = (currency: string, cents: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: "narrowSymbol",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

/** An amount in the charge currency, e.g. "₦66,300". */
export const money = (cents: number) => format(CURRENCY, cents);
/** An amount in US dollars, e.g. "$49". */
export const usd = (cents: number) => format("USD", cents);

/** A charged amount with its dollar value next to it when we charge in another currency: "₦10,150 (about $7.50)". */
export const withUsd = (cents: number, usdCents: number) => (CHARGES_IN_USD ? money(cents) : `${money(cents)} (about ${usd(usdCents)})`);

// Prices are set and shown in US dollars. When Paystack charges another currency, the charge is the same price
// converted at the day's rate (see pricing.ts).

/** First full report. */
export const PRICE_USD_CENTS = Number(process.env.PRICE_USD_CENTS || 4900);
export const PRICE_LABEL = usd(PRICE_USD_CENTS);

/** Fix check: re-verifies the original findings only. Half is refunded when everything is fixed. */
export const RECHECK_USD_CENTS = Number(process.env.RECHECK_PRICE_USD_CENTS || 1500);
export const RECHECK_LABEL = usd(RECHECK_USD_CENTS);
export const RECHECK_REFUND_USD_CENTS = Math.floor(RECHECK_USD_CENTS / 2);
export const RECHECK_REFUND_LABEL = usd(RECHECK_REFUND_USD_CENTS);

export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE || "").replace(/^@/, "");
/** Where support mail actually goes. */
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "prevearchiveapp@gmail.com";
/** What visitors see on the site instead of the raw address. */
export const CONTACT_LABEL = process.env.NEXT_PUBLIC_CONTACT_LABEL || "founderroast.support";

export const IS_PROD = process.env.NODE_ENV === "production";

/** Configured site URL, else Vercel's production URL, else null. */
export function configuredSiteUrl(): string | null {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (configured) return configured;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  return vercel ? `https://${vercel}` : null;
}

/** Absolute base URL: configured site URL first, otherwise the request's own origin. */
export function baseUrl(req?: Request): string {
  const configured = configuredSiteUrl();
  if (configured) return configured;
  if (req) return new URL(req.url).origin;
  return "http://localhost:3000";
}

/** Host shown in watermarks, e.g. "founderroast.com". */
export function watermarkHost(req?: Request): string {
  try {
    return new URL(baseUrl(req)).host.replace(/^www\./, "");
  } catch {
    return "founderroast.com";
  }
}

export function scoreTone(score: number): "great" | "ok" | "bad" {
  if (score >= 75) return "great";
  if (score >= 50) return "ok";
  return "bad";
}

export function scoreColor(score: number): string {
  const tone = scoreTone(score);
  return tone === "great" ? "#16a34a" : tone === "ok" ? "#f59e0b" : "#ef4444";
}
