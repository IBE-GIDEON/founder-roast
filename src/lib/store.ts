import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { IS_PROD } from "./site";

/**
 * Tiny key-value store.
 * - Production: Upstash Redis over REST (Vercel Marketplace sets KV_REST_API_URL / KV_REST_API_TOKEN).
 * - Development without Redis: JSON files in .data/kv so the whole flow works offline.
 */
interface KV {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  /** Sets only if the key doesn't exist. Returns true if it was set (used as a one-time lock). */
  setNX(key: string, value: string, ttlSeconds: number): Promise<boolean>;
  incr(key: string, ttlSeconds: number): Promise<number>;
}

const REDIS_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

class UpstashKV implements KV {
  constructor(private url: string, private token: string) {}

  private async cmd<T>(command: (string | number)[]): Promise<T> {
    const res = await fetch(this.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    const data = (await res.json()) as { result?: T; error?: string };
    if (!res.ok || data.error) throw new Error(`Redis ${command[0]} failed: ${data.error || res.status}`);
    return data.result as T;
  }

  get(key: string) {
    return this.cmd<string | null>(["GET", key]);
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await this.cmd(ttlSeconds ? ["SET", key, value, "EX", ttlSeconds] : ["SET", key, value]);
  }

  async setNX(key: string, value: string, ttlSeconds: number) {
    return (await this.cmd<string | null>(["SET", key, value, "NX", "EX", ttlSeconds])) === "OK";
  }

  async incr(key: string, ttlSeconds: number) {
    const n = await this.cmd<number>(["INCR", key]);
    if (n === 1) await this.cmd(["EXPIRE", key, ttlSeconds]);
    return n;
  }
}

class FileKV implements KV {
  private dir = path.join(process.cwd(), ".data", "kv");

  private file(key: string) {
    return path.join(this.dir, encodeURIComponent(key) + ".json");
  }

  async get(key: string) {
    try {
      const raw = JSON.parse(await fs.readFile(this.file(key), "utf8")) as { v: string; exp: number | null };
      if (raw.exp && raw.exp < Date.now()) return null;
      return raw.v;
    } catch {
      return null;
    }
  }

  async set(key: string, value: string, ttlSeconds?: number) {
    await fs.mkdir(this.dir, { recursive: true });
    const exp = ttlSeconds ? Date.now() + ttlSeconds * 1000 : null;
    await fs.writeFile(this.file(key), JSON.stringify({ v: value, exp }));
  }

  async setNX(key: string, value: string, ttlSeconds: number) {
    if ((await this.get(key)) !== null) return false;
    await this.set(key, value, ttlSeconds);
    return true;
  }

  async incr(key: string, ttlSeconds: number) {
    const current = Number((await this.get(key)) || 0) + 1;
    // keep the original expiry window on increments
    let exp: number | null = Date.now() + ttlSeconds * 1000;
    try {
      const raw = JSON.parse(await fs.readFile(this.file(key), "utf8")) as { exp: number | null };
      if (raw.exp && raw.exp > Date.now()) exp = raw.exp;
    } catch {}
    await fs.mkdir(this.dir, { recursive: true });
    await fs.writeFile(this.file(key), JSON.stringify({ v: String(current), exp }));
    return current;
  }
}

let kv: KV | null = null;

export function store(): KV {
  if (kv) return kv;
  if (REDIS_URL && REDIS_TOKEN) {
    kv = new UpstashKV(REDIS_URL.replace(/\/$/, ""), REDIS_TOKEN);
  } else if (IS_PROD && process.env.VERCEL) {
    throw new Error("Storage is not configured. Add Upstash Redis (KV_REST_API_URL / KV_REST_API_TOKEN).");
  } else {
    kv = new FileKV();
  }
  return kv;
}

export async function getJSON<T>(key: string): Promise<T | null> {
  const raw = await store().get(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setJSON(key: string, value: unknown, ttlSeconds?: number) {
  await store().set(key, JSON.stringify(value), ttlSeconds);
}
