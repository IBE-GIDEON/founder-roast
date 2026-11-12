import "server-only";

/**
 * Minimal PayPal Checkout (Orders v2) client.
 * Flow: createOrder → buyer approves on PayPal → returns to our URL with ?token=ORDER_ID → captureOrder.
 * Nothing is charged until we capture, so a buyer who closes the tab is never charged without access.
 */

const LIVE = process.env.PAYPAL_ENV === "live";
const BASE = LIVE ? "https://api-m.paypal.com" : "https://api-m.sandbox.paypal.com";

export class PaymentError extends Error {}

export const paypalEnabled = () => !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET);

let cachedToken: { value: string; exp: number } | null = null;

async function accessToken(): Promise<string> {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const basic = Buffer.from(`${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`).toString("base64");
  const res = await fetch(`${BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${basic}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  const data = (await res.json().catch(() => ({}))) as { access_token?: string; expires_in?: number; error_description?: string };
  if (!res.ok || !data.access_token) throw new PaymentError(`PayPal auth failed: ${data.error_description || res.status}`);
  cachedToken = { value: data.access_token, exp: Date.now() + (data.expires_in || 300) * 1000 };
  return cachedToken.value;
}

async function api<T>(method: "GET" | "POST", path: string, body?: unknown, requestId?: string) {
  const headers: Record<string, string> = { Authorization: `Bearer ${await accessToken()}`, "Content-Type": "application/json" };
  if (requestId) headers["PayPal-Request-Id"] = requestId;
  const res = await fetch(`${BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined, cache: "no-store" });
  const data = (await res.json().catch(() => ({}))) as T & { name?: string; message?: string; details?: { issue?: string }[] };
  return { ok: res.ok, status: res.status, data };
}

const usd = (cents: number) => (cents / 100).toFixed(2);
const toCents = (value?: string) => Math.round(Number(value || 0) * 100);

export async function createOrder(o: {
  amountCents: number;
  description: string;
  customId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ id: string; approveUrl: string }> {
  const { ok, data } = await api<{ id?: string; links?: { rel: string; href: string }[] }>("POST", "/v2/checkout/orders", {
    intent: "CAPTURE",
    purchase_units: [
      {
        custom_id: o.customId,
        description: o.description.slice(0, 127),
        amount: { currency_code: "USD", value: usd(o.amountCents) },
      },
    ],
    payment_source: {
      paypal: {
        experience_context: {
          brand_name: "Founder Roast",
          user_action: "PAY_NOW",
          shipping_preference: "NO_SHIPPING",
          landing_page: "LOGIN",
          return_url: o.returnUrl,
          cancel_url: o.cancelUrl,
        },
      },
    },
  });
  const approveUrl = data.links?.find((l) => l.rel === "payer-action" || l.rel === "approve")?.href;
  if (!ok || !data.id || !approveUrl) throw new PaymentError(`PayPal order failed: ${data.message || data.name || "unknown error"}`);
  return { id: data.id, approveUrl };
}

type OrderShape = {
  id?: string;
  status?: string;
  payer?: { email_address?: string };
  payment_source?: { paypal?: { email_address?: string } };
  purchase_units?: {
    custom_id?: string;
    payments?: { captures?: { id: string; status: string; custom_id?: string; amount?: { value?: string; currency_code?: string } }[] };
  }[];
};

export interface Capture {
  orderId: string;
  completed: boolean;
  captureId: string | null;
  amountCents: number;
  currency: string;
  customId: string;
  email: string | null;
}

function readCapture(orderId: string, o: OrderShape): Capture {
  const unit = o.purchase_units?.[0];
  const cap = unit?.payments?.captures?.[0];
  return {
    orderId,
    completed: o.status === "COMPLETED" && cap?.status === "COMPLETED",
    captureId: cap?.id || null,
    amountCents: toCents(cap?.amount?.value),
    currency: cap?.amount?.currency_code || "",
    customId: cap?.custom_id || unit?.custom_id || "",
    email: o.payer?.email_address || o.payment_source?.paypal?.email_address || null,
  };
}

/** Captures an approved order. Safe to call twice: an already-captured order is read back instead. */
export async function captureOrder(orderId: string): Promise<Capture> {
  if (!/^[A-Z0-9]{8,40}$/i.test(orderId)) throw new PaymentError("Invalid PayPal order.");
  const cap = await api<OrderShape>("POST", `/v2/checkout/orders/${orderId}/capture`, {}, `capture-${orderId}`);
  if (cap.ok) return readCapture(orderId, cap.data);
  const already = cap.data.details?.some((d) => d.issue === "ORDER_ALREADY_CAPTURED");
  if (!already) throw new PaymentError(`PayPal capture failed: ${cap.data.details?.[0]?.issue || cap.data.message || cap.status}`);
  const got = await api<OrderShape>("GET", `/v2/checkout/orders/${orderId}`);
  if (!got.ok) throw new PaymentError("Couldn't read the PayPal order.");
  return readCapture(orderId, got.data);
}

/** Partial refund of a capture. requestId makes it idempotent, so a retry never refunds twice. */
export async function refundCapture(captureId: string, amountCents: number, requestId: string, note: string) {
  const { ok, data } = await api<{ id?: string; status?: string }>(
    "POST",
    `/v2/payments/captures/${captureId}/refund`,
    { amount: { currency_code: "USD", value: usd(amountCents) }, note_to_payer: note.slice(0, 255) },
    requestId,
  );
  if (!ok || !data.id) throw new PaymentError(`PayPal refund failed: ${data.message || data.name || "unknown error"}`);
  return { id: data.id, status: data.status || "COMPLETED" };
}
