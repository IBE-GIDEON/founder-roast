import "server-only";
import { store } from "./store";

export function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] || req.headers.get("x-real-ip") || "local").trim();
}

/** Fixed-window limiter. Returns remaining requests, or -1 when over the limit. */
export async function rateLimit(req: Request, bucket: string, limit: number, windowSeconds: number): Promise<number> {
  const admin = process.env.ADMIN_KEY;
  if (admin && req.headers.get("x-admin-key") === admin) return limit;
  const windowId = Math.floor(Date.now() / 1000 / windowSeconds);
  const n = await store().incr(`rl:${bucket}:${clientIp(req)}:${windowId}`, windowSeconds);
  return n > limit ? -1 : limit - n;
}
