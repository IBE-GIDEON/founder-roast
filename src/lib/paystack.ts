import "server-only";
import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/**
 * Minimal Paystack client.
 * Flow: initialize → buyer pays on Paystack → returns to callback_url?reference=… → verify.
 * The webhook (charge.success) is a backup for buyers who close the tab before returning.
 */

const API = "https://api.paystack.co";

export class PaymentError extends Error {}

export const paystackEnabled = () => !!process.env.PAYSTACK_SECRET_KEY;

/** Currency your Paystack account settles in. USD must be enabled on the account to use it. */
export const PAYSTACK_CURRENCY = (process.env.PAYSTACK_CURRENCY || "USD").toUpperCase();

async function call<T>(method: "GET" | "POST", path: string, body?: unknown) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: T };
  return { ok: res.ok && json.status === true, message: json.message || `HTTP ${res.status}`, data: json.data as T };
}

export type Kind = "report" | "recheck";

/** Paystack references allow letters, digits, "-", "." and "=" only. */
export function newReference(kind: Kind, reportId: string) {
  return `fr-${kind}-${reportId}-${randomBytes(5).toString("hex")}`;
}

export async function initializeTransaction(o: {
  email: string;
  amount: number; // smallest currency unit (cents / kobo)
  reference: string;
  callbackUrl: string;
  metadata: { reportId: string; kind: Kind; domain: string };
}): Promise<{ authorizationUrl: string; reference: string }> {
  const { ok, message, data } = await call<{ authorization_url?: string; reference?: string }>("POST", "/transaction/initialize", {
    email: o.email,
    amount: o.amount,
    currency: PAYSTACK_CURRENCY,
    reference: o.reference,
    callback_url: o.callbackUrl,
    metadata: {
      ...o.metadata,
      cancel_action: o.callbackUrl.replace(/\/(unlock|recheck\/start)$/, "?canceled=1"),
      custom_fields: [{ display_name: "Report", variable_name: "report", value: `${o.metadata.domain} (${o.metadata.kind})` }],
    },
  });
  if (!ok || !data?.authorization_url) throw new PaymentError(`Paystack: ${message}`);
  return { authorizationUrl: data.authorization_url, reference: data.reference || o.reference };
}

export interface Verified {
  reference: string;
  paid: boolean;
  amount: number;
  currency: string;
  email: string | null;
  reportId: string;
  kind: string;
}

export async function verifyTransaction(reference: string): Promise<Verified> {
  if (!/^[A-Za-z0-9.=-]{6,100}$/.test(reference)) throw new PaymentError("Invalid payment reference.");
  const { ok, message, data } = await call<{
    status?: string;
    amount?: number;
    currency?: string;
    reference?: string;
    customer?: { email?: string };
    metadata?: { reportId?: string; kind?: string } | string;
  }>("GET", `/transaction/verify/${encodeURIComponent(reference)}`);
  if (!ok || !data) throw new PaymentError(`Paystack verify failed: ${message}`);
  const meta = typeof data.metadata === "string" ? safeParse(data.metadata) : data.metadata || {};
  return {
    reference: data.reference || reference,
    paid: data.status === "success",
    amount: Number(data.amount || 0),
    currency: (data.currency || "").toUpperCase(),
    email: data.customer?.email || null,
    reportId: String(meta?.reportId || ""),
    kind: String(meta?.kind || ""),
  };
}

function safeParse(s: string): { reportId?: string; kind?: string } {
  try {
    return JSON.parse(s);
  } catch {
    return {};
  }
}

/** Partial refund (amount in the smallest currency unit). */
export async function refundTransaction(reference: string, amount: number, note: string) {
  const { ok, message, data } = await call<{ id?: number; status?: string }>("POST", "/refund", {
    transaction: reference,
    amount,
    currency: PAYSTACK_CURRENCY,
    customer_note: note.slice(0, 200),
    merchant_note: "Founder Roast fix check: all clear, half refunded automatically.",
  });
  if (!ok) throw new PaymentError(`Paystack refund failed: ${message}`);
  return { id: String(data?.id ?? reference), status: data?.status || "pending" };
}

/** Webhook signature: HMAC-SHA512 of the raw body with your secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null): boolean {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = Buffer.from(createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex"));
  const given = Buffer.from(signature);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
