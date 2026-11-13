import "server-only";

/**
 * LLM client built for Groq's free tier.
 *
 * Free tier facts (measured): every model has its own 1,000 requests/day and 8,000 tokens/minute.
 * So a roast spreads its three calls across three models, and when a model is busy we wait the
 * time Groq asks for and retry, instead of failing the roast. An optional second OpenAI-compatible
 * provider (e.g. Cerebras or Gemini free tiers) can be added as an extra fallback via env vars.
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

export class AnalyzeError extends Error {}

export const groqEnabled = () => !!process.env.GROQ_API_KEY;

export const MODELS = {
  /** Landing-page roast: the sharpest model. */
  main: process.env.GROQ_MODEL || "openai/gpt-oss-120b",
  /** Market + competitor discovery: small, fast. */
  fast: process.env.GROQ_FAST_MODEL || "openai/gpt-oss-20b",
  /** Business roast (idea, features, graveyard): its own free bucket. */
  strategy: process.env.GROQ_STRATEGY_MODEL || "qwen/qwen3.8-27b",
};

const ALL_GROQ = [...new Set([MODELS.main, MODELS.strategy, MODELS.fast])];

interface Provider {
  name: string;
  url: string;
  key: string;
}

const groq = (): Provider => ({ name: "groq", url: GROQ_URL, key: process.env.GROQ_API_KEY || "" });

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

/**
 * Second engine that shares the load with Groq.
 * - GEMINI_API_KEY (+ optional GEMINI_MODEL): Google's free tier via its OpenAI-compatible endpoint.
 * - Or any OpenAI-compatible API: EXTRA_LLM_URL + EXTRA_LLM_KEY + EXTRA_LLM_MODEL (e.g. Cerebras).
 */
function extra(): { provider: Provider; model: string } | null {
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: { name: "gemini", url: GEMINI_URL, key: process.env.GEMINI_API_KEY },
      model: process.env.GEMINI_MODEL || "gemini-flash-lite-latest",
    };
  }
  const url = process.env.EXTRA_LLM_URL;
  const key = process.env.EXTRA_LLM_KEY;
  const model = process.env.EXTRA_LLM_MODEL;
  return url && key && model ? { provider: { name: "extra", url, key }, model } : null;
}

export const secondEngine = () => extra()?.provider.name ?? null;

type CallResult = { ok: true; content: string } | { ok: false; status: number; error: string; retryAfter: number };

async function call(
  p: Provider,
  model: string,
  system: string,
  user: string,
  temperature: number,
  effort: "low" | "medium" | "high",
  maxTokens: number,
  timeoutMs: number,
): Promise<CallResult> {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    temperature,
    max_completion_tokens: maxTokens,
    response_format: { type: "json_object" },
  };
  if (/gpt-oss/.test(model) && p.name !== "gemini") body.reasoning_effort = model.includes("20b") && effort !== "low" ? "low" : effort;
  if (p.name === "groq" && model.startsWith("qwen/")) body.reasoning_format = "hidden";

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(p.url, {
      method: "POST",
      headers: { Authorization: `Bearer ${p.key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false, status: res.status, error: text.slice(0, 300), retryAfter: Number(res.headers.get("retry-after")) || 0 };
    const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    return { ok: true, content: data.choices?.[0]?.message?.content || "" };
  } catch (e) {
    return { ok: false, status: 0, error: (e as Error).message, retryAfter: 0 };
  } finally {
    clearTimeout(timer);
  }
}

function parseJSON<T>(content: string): T {
  const cleaned = content
    .replace(/<think>[\s\S]*?<\/think>/g, "")
    .replace(/^\s*```(?:json)?|```\s*$/g, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * JSON-mode completion that tries: preferred model → fallback model → other free Groq models → optional extra provider.
 * If everything is rate-limited, waits as long as Groq asks (within `budgetMs`) and goes again.
 */
export async function groqJSON<T = Record<string, unknown>>(
  system: string,
  user: string,
  opts: {
    temperature?: number;
    effort?: "low" | "medium" | "high";
    maxTokens?: number;
    timeoutMs?: number;
    model?: string;
    fallbackModel?: string;
    /** Total time we're willing to spend, including waiting for rate limits. */
    budgetMs?: number;
    /** Try the second engine (Gemini) first, so work is shared instead of piling onto Groq. */
    preferSecond?: boolean;
  } = {},
): Promise<T> {
  const { temperature = 0.6, effort = "medium", maxTokens = 6000, timeoutMs = 60_000, budgetMs = 150_000 } = opts;
  const deadline = Date.now() + budgetMs;
  const first = opts.model || MODELS.main;
  const order = [...new Set([first, opts.fallbackModel || MODELS.fast, ...ALL_GROQ])];
  const ex = extra();

  for (let round = 0; round < 4 && Date.now() < deadline; round++) {
    let soonest = Infinity;
    const onGroq = order.map((m) => ({ p: groq(), model: m }));
    const second = ex ? [{ p: ex.provider, model: ex.model }] : [];
    // Preferred: second engine first. Otherwise: our first-choice Groq model, then the second engine
    // (better than dropping to a smaller Groq model), then the remaining Groq models.
    const attempts: { p: Provider; model: string }[] = opts.preferSecond
      ? [...second, ...onGroq]
      : [...onGroq.slice(0, 1), ...second, ...onGroq.slice(1)];

    for (const { p, model } of attempts) {
      if (Date.now() >= deadline) break;
      const temp = round ? Math.max(0.2, temperature - 0.3) : temperature;
      const res = await call(p, model, system, user, temp, effort, maxTokens, Math.min(timeoutMs, Math.max(5_000, deadline - Date.now())));
      if (res.ok) {
        try {
          const parsed = parseJSON<T>(res.content);
          console.info("[llm] ok", p.name, model);
          return parsed;
        } catch {
          console.error("[llm]", p.name, model, "invalid JSON");
          continue;
        }
      }
      console.error("[llm]", p.name, model, res.status, res.error);
      if (res.status === 401 && p.name === "groq") throw new AnalyzeError("Groq rejected the API key.");
      if (res.status === 429 || res.status === 503) soonest = Math.min(soonest, (res.retryAfter || 5) * 1000);
    }

    // Everyone was busy: wait our turn rather than failing the roast.
    if (soonest === Infinity) soonest = 3_000;
    const wait = Math.min(soonest + 500, 35_000, deadline - Date.now() - 5_000);
    if (wait <= 0) break;
    await sleep(wait);
  }
  throw new AnalyzeError("The roaster is busy right now. Try again in a minute.");
}
