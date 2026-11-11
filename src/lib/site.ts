export const SITE_NAME = "Founder Roast";

const money = (cents: number) => `$${(cents / 100).toFixed(cents % 100 === 0 ? 0 : 2)}`;

/** First full report. */
export const PRICE_CENTS = Number(process.env.PRICE_CENTS || 3900);
export const PRICE_LABEL = money(PRICE_CENTS);

/** Fix check: re-verifies the original findings only. Half is refunded when everything is fixed. */
export const RECHECK_PRICE_CENTS = Number(process.env.RECHECK_PRICE_CENTS || 1500);
export const RECHECK_LABEL = money(RECHECK_PRICE_CENTS);
export const RECHECK_REFUND_CENTS = Math.floor(RECHECK_PRICE_CENTS / 2);
export const RECHECK_REFUND_LABEL = money(RECHECK_REFUND_CENTS);

export const X_HANDLE = (process.env.NEXT_PUBLIC_X_HANDLE || "").replace(/^@/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "";

export const IS_PROD = process.env.NODE_ENV === "production";

/** Absolute base URL: configured site URL first, otherwise the request's own origin. */
export function baseUrl(req?: Request): string {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
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
