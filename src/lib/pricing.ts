import "server-only";
import { CHARGES_IN_USD, CURRENCY, money, PRICE_USD_CENTS, RECHECK_USD_CENTS } from "./site";

/**
 * What Paystack actually charges. Prices are set in US dollars; when the account charges another currency
 * (e.g. NGN), we convert at the day's rate so the buyer pays what the page says, give or take their bank's fee.
 */

export type Product = "report" | "recheck";

/** Used when no rate source answers. Set USD_RATE (units of the charge currency per dollar) to override. */
const FALLBACK_RATE = Number(process.env.USD_RATE) || (CURRENCY === "NGN" ? 1350 : 1);
const HOUR = 3_600_000;

const SOURCES: { url: string; pick: (j: Record<string, Record<string, unknown>>) => unknown }[] = [
  { url: "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/usd.json", pick: (j) => j?.usd?.[CURRENCY.toLowerCase()] },
  { url: "https://open.er-api.com/v6/latest/USD", pick: (j) => j?.rates?.[CURRENCY] },
];

let memo: { rate: number; until: number } | null = null;

/** Rejects nonsense (a broken feed, an inverted rate) by staying within 3x of the fallback. */
const sane = (r: number) => Number.isFinite(r) && r > 0 && (FALLBACK_RATE === 1 || (r > FALLBACK_RATE / 3 && r < FALLBACK_RATE * 3));

/** Units of the charge currency per US dollar. Cached for 6 hours; a failed lookup falls back for 10 minutes. */
export async function usdRate(): Promise<number> {
  if (CHARGES_IN_USD) return 1;
  if (memo && Date.now() < memo.until) return memo.rate;
  for (const s of SOURCES) {
    try {
      const res = await fetch(s.url, { cache: "no-store", signal: AbortSignal.timeout(2500) });
      if (!res.ok) continue;
      const rate = Number(s.pick(await res.json()));
      if (sane(rate)) {
        memo = { rate, until: Date.now() + 6 * HOUR };
        return rate;
      }
    } catch {}
  }
  console.warn("[pricing] no exchange rate, using fallback", FALLBACK_RATE);
  memo = { rate: FALLBACK_RATE, until: Date.now() + HOUR / 6 };
  return FALLBACK_RATE;
}

const usdCents = (p: Product) => (p === "recheck" ? RECHECK_USD_CENTS : PRICE_USD_CENTS);

/** Amount to charge, in the charge currency's smallest unit. Rounded up to a whole 100 (₦66,300, not ₦66,252.91). */
export async function chargeCents(p: Product): Promise<number> {
  if (CHARGES_IN_USD) return usdCents(p);
  const local = (usdCents(p) / 100) * (await usdRate());
  return Math.ceil(local / 100) * 100 * 100;
}

/** Lowest payment we accept for a product. Leaves room for the rate moving between checkout and verification. */
export async function minimumCents(p: Product): Promise<number> {
  const charge = await chargeCents(p);
  return CHARGES_IN_USD ? charge : Math.floor(charge * 0.9);
}

/** "₦66,300" when we charge in another currency, else null (the dollar price is the charge). */
export async function chargeLabel(p: Product): Promise<string | null> {
  return CHARGES_IN_USD ? null : money(await chargeCents(p));
}
