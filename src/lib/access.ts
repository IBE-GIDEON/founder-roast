import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { IS_PROD } from "./site";

function secret(): string {
  const s = process.env.ACCESS_SECRET;
  if (s && s.length >= 16) return s;
  if (IS_PROD) throw new Error("ACCESS_SECRET must be set (32+ random characters).");
  return "dev-only-access-secret-do-not-use-in-production";
}

/** Private unlock key for a report. Only revealed after a verified payment. */
export function accessKeyFor(reportId: string): string {
  return createHmac("sha256", secret()).update(`report:${reportId}`).digest("base64url").slice(0, 32);
}

export function isValidKey(reportId: string, key: string | null | undefined): boolean {
  if (!key) return false;
  const expected = Buffer.from(accessKeyFor(reportId));
  const given = Buffer.from(key);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export const accessCookieName = (reportId: string) => `fr_${reportId}`;
