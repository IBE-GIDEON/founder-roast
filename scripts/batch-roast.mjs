#!/usr/bin/env node
/**
 * Daily X content: roast a list of startup URLs and write ready-to-post drafts.
 *
 *   node scripts/batch-roast.mjs urls.txt
 *   node scripts/batch-roast.mjs urls.txt --base https://founderroast.com
 *
 * urls.txt: one URL per line (lines starting with # are ignored).
 * Env: ROAST_BASE_URL (or --base), ADMIN_KEY (skips the per-IP rate limit; must match the server's ADMIN_KEY).
 *
 * Output: roasts-YYYY-MM-DD.md with, for each site: the post text (founder tagged when we found their X handle),
 * the report link (X unfurls it into the watermarked roast card) and the card image if you'd rather attach it.
 * Nothing is posted automatically: review each one, then post by hand.
 */
import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith("--"));
const baseIdx = args.indexOf("--base");
const base = (baseIdx >= 0 ? args[baseIdx + 1] : process.env.ROAST_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const adminKey = process.env.ADMIN_KEY || "";

if (!file) {
  console.error("Usage: node scripts/batch-roast.mjs urls.txt [--base https://your-domain]");
  process.exit(1);
}

const urls = (await readFile(file, "utf8"))
  .split(/\r?\n/)
  .map((l) => l.trim())
  .filter((l) => l && !l.startsWith("#"));

if (!urls.length) {
  console.error("No URLs found in", file);
  process.exit(1);
}

// Posts stay short: score, one roast line, link. Well under X's 280 limit for accounts without Premium.
const ROAST_MAX = 150;

/** First sentence if it fits, else cut at a word with an ellipsis. */
function shortRoast(s) {
  if (s.length <= ROAST_MAX) return s;
  const first = s.match(/^.+?[.!?](?=\s|$)/)?.[0];
  if (first && first.length <= ROAST_MAX) return first;
  return s.slice(0, ROAST_MAX - 1).replace(/\s+\S*$/, "").replace(/[\s,;:–-]+$/, "") + "…";
}

function draft(r) {
  const link = `${base}/r/${r.id}`;
  const who = r.xHandle ? ` @${r.xHandle}` : "";
  return { text: `Roasted ${r.domain}${who}: ${r.overall}/100 🔥\n\n${shortRoast(r.roast)}\n\n${link}`, link, card: `${base}/api/card/${r.id}` };
}

const results = [];
for (const [i, url] of urls.entries()) {
  process.stdout.write(`[${i + 1}/${urls.length}] ${url} … `);
  try {
    const res = await fetch(`${base}/api/roast?format=json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(adminKey ? { "x-admin-key": adminKey } : {}) },
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || res.status);
    results.push({ url, ...data });
    console.log(`${data.overall}/100${data.cached ? " (cached)" : ""}`);
  } catch (e) {
    results.push({ url, error: String(e.message || e) });
    console.log(`failed: ${e.message || e}`);
  }
}

const today = new Date().toISOString().slice(0, 10);
const ok = results.filter((r) => !r.error);
const lines = [
  `# Roast drafts · ${today}`,
  "",
  `${ok.length} ready · ${results.length - ok.length} failed · base ${base}`,
  "",
  "Post 1 to 2 an hour, not all at once. Reply to anyone who engages. Never post a roast you wouldn't say to the founder's face.",
  "",
];
for (const r of results) {
  lines.push(`---`, "");
  if (r.error) {
    lines.push(`## ✗ ${r.url}`, "", `Failed: ${r.error}`, "");
    continue;
  }
  const d = draft(r);
  lines.push(`## ${r.domain} · ${r.overall}/100${r.xHandle ? ` · @${r.xHandle}` : " · no X handle found"}`, "", "```", d.text, "```", "", `Report: ${d.link}`, `Card image: ${d.card}`, "");
}
const out = `roasts-${today}.md`;
await writeFile(out, lines.join("\n"));
// Same drafts as data, for building a posting page or scheduling tools.
await writeFile(
  `roasts-${today}.json`,
  JSON.stringify(
    results.map((r) => (r.error ? r : { ...r, ...draft(r) })),
    null,
    2,
  ),
);
console.log(`\nWrote ${out} and roasts-${today}.json`);
