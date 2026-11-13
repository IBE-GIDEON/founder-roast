import "server-only";
import { accessKeyFor } from "./access";
import { sendFixCheckEmail, sendReportEmail } from "./email";
import { PAYSTACK_CURRENCY, type Verified } from "./paystack";
import { createRecheckPayment, type RecheckPayment } from "./recheck";
import { getReport, recordPurchase } from "./reports";
import { PRICE_CENTS, RECHECK_PRICE_CENTS } from "./site";

/** Checks a verified Paystack payment really is the product it claims to be, for this report. */
export function validPayment(v: Verified, kind: "report" | "recheck", reportId: string) {
  const min = kind === "report" ? PRICE_CENTS : RECHECK_PRICE_CENTS;
  return v.paid && v.kind === kind && v.reportId === reportId && v.currency === PAYSTACK_CURRENCY && v.amount >= min;
}

/** Full report bought: record it once and email the private link. Safe to call from both callback and webhook. */
export async function fulfilReport(v: Verified, base: string) {
  const first = await recordPurchase({ sessionId: v.reference, reportId: v.reportId, email: v.email, amount: v.amount, createdAt: new Date().toISOString() });
  const report = await getReport(v.reportId);
  if (first && v.email && report) await sendReportEmail(v.email, report.domain, `${base}/r/${v.reportId}?k=${accessKeyFor(v.reportId)}`);
}

/** Fix check bought: create (or reuse) its run token. Emails the start link the first time. */
export async function fulfilRecheck(v: Verified, base: string): Promise<RecheckPayment> {
  const first = await recordPurchase({ sessionId: v.reference, reportId: v.reportId, email: v.email, amount: v.amount, createdAt: new Date().toISOString() });
  const pay = await createRecheckPayment({ reportId: v.reportId, reference: v.reference, amount: v.amount, dev: false });
  const report = await getReport(v.reportId);
  if (first && v.email && report) await sendFixCheckEmail(v.email, report.domain, `${base}/roast?check=${pay.token}`);
  return pay;
}
