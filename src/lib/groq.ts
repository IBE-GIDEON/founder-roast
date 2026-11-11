import "server-only";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const PRIMARY_MODEL = process.env.GROQ_MODEL || "openai/gpt-oss-120b";
const FALLBACK_MODEL = "llama-3.3-70b-versatile";

export class AnalyzeError extends Error {}

export const groqEnabled = () => !!process.env.GROQ_API_KEY;

async function call(model: string, system: string, user: string, temperature: number, effort: "low" | "medium" | "high", maxTokens: number, timeoutMs: number) {
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
  if (model.startsWith("openai/gpt-oss")) body.reasoning_effort = effort;

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(GROQ_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
      cache: "no-store",
    });
    const text = await res.text();
    if (!res.ok) return { ok: false as const, status: res.status, error: text.slice(0, 400) };
    const data = JSON.parse(text) as { choices?: { message?: { content?: string } }[] };
    return { ok: true as const, content: data.choices?.[0]?.message?.content || "" };
  } catch (e) {
    return { ok: false as const, status: 0, error: (e as Error).message };
  } finally {
    clearTimeout(timer);
  }
}

/** JSON-mode completion with retry and a fallback model. Throws AnalyzeError when every attempt fails. */
export async function groqJSON<T = Record<string, unknown>>(
  system: string,
  user: string,
  opts: { temperature?: number; effort?: "low" | "medium" | "high"; maxTokens?: number; timeoutMs?: number; attempts?: number } = {},
): Promise<T> {
  const { temperature = 0.6, effort = "medium", maxTokens = 6000, timeoutMs = 60_000, attempts = 3 } = opts;
  const plan: [string, number][] = [
    [PRIMARY_MODEL, temperature],
    [PRIMARY_MODEL, Math.max(0.2, temperature - 0.3)],
    [FALLBACK_MODEL, temperature],
  ].slice(0, attempts) as [string, number][];

  for (const [model, temp] of plan) {
    const res = await call(model, system, user, temp, effort, maxTokens, timeoutMs);
    if (!res.ok) {
      console.error("[groq]", model, res.status, res.error);
      if (res.status === 401) throw new AnalyzeError("Groq rejected the API key.");
      continue;
    }
    try {
      return JSON.parse(res.content.replace(/^```(?:json)?|```$/g, "").trim()) as T;
    } catch {
      console.error("[groq]", model, "invalid JSON");
    }
  }
  throw new AnalyzeError("The roaster is overloaded right now. Try again in a minute.");
}
