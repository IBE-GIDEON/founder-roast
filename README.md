# Founder Roast

Paste a startup URL. AI reads the site and its competitors live, then returns a score, a shareable roast, and (paid) the full teardown.

- **Free:** overall score, verdict, roast line, first blind spot, competitor logos, the full "what we checked" log, a watermarked share card.
- **Full report ($39):** 3 blind spots with evidence, a competitor teardown, four scores with every issue and fix, a growth plan, a rewritten hero, and a PDF.
- **Fix check ($15):** re-checks only the original findings. It never invents new problems. If everything is fixed, the site is marked up to date, no more checks can be sold for it, and $7.50 is refunded automatically through Paystack.
- **One roast per site:** repeat visitors get the original roast (180 days), not a fresh set of findings.

## What you need to launch

| Thing | Where | Cost | Env vars |
| --- | --- | --- | --- |
| Groq API key | console.groq.com/keys | pay as you go, fractions of a cent per roast | `GROQ_API_KEY` |
| Paystack account | dashboard.paystack.com → Settings → API Keys & Webhooks | Paystack's per-sale fee | `PAYSTACK_SECRET_KEY`, `PAYSTACK_CURRENCY` |
| Upstash Redis | Vercel → Storage → Marketplace → Upstash | free tier is plenty | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| Vercel project | vercel.com (import this GitHub repo) | free / $20 Pro | — |
| Domain | any registrar or Vercel Domains | ~$10–15/yr | `NEXT_PUBLIC_SITE_URL` |
| Random secret | `openssl rand -hex 32` | — | `ACCESS_SECRET`, `ADMIN_KEY` |
| Resend (optional) | resend.com | free tier | `RESEND_API_KEY`, `EMAIL_FROM` |
| X account for the brand | x.com | — | `NEXT_PUBLIC_X_HANDLE` |
| Support email | any inbox | — | `NEXT_PUBLIC_CONTACT_EMAIL` |

To charge in dollars, USD must be enabled on your Paystack account; otherwise set `PAYSTACK_CURRENCY=NGN` (or your local currency) and set `PRICE_CENTS` / `RECHECK_PRICE_CENTS` in that currency's smallest unit. `/terms` (with the refund policy) and `/privacy` are included; the support address defaults to the one in `src/lib/site.ts`.

## Zero-budget setup (first 50 customers)

Everything below runs at $0 until revenue comes in:

| Need | Free option | Limit |
| --- | --- | --- |
| AI | Groq free tier, spread over 3 models, with wait-and-retry when busy | ~1 roast/minute sustained, 1,000 requests/day per model |
| Backup AI (optional) | Cerebras or Gemini free tier via `EXTRA_LLM_*` | extra capacity when Groq is busy |
| Storage | Upstash free | 500K commands/month |
| Payments | Paystack | no monthly fee, a cut per sale |
| Email to buyers | Gmail app password (`SMTP_USER`, `SMTP_PASS`) | ~500 emails/day |
| Domain | `founder-roast.vercel.app` | — |
| Hosting | Vercel Hobby until the first sale | Hobby is for non-commercial use: move to Pro once you're selling |

Check what's configured on the live site at `/api/health`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

Without keys the app still runs end to end in development:
- no `GROQ_API_KEY` → heuristic "demo analysis" (labelled in the UI)
- no Paystack key → checkout is skipped, so you can test unlocks and fix checks
- no Redis → data is stored in `.data/`

In production, missing keys fail loudly instead.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Add Upstash Redis from the Vercel Marketplace (it sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Add the other env vars from `.env.example`.
4. Add `PAYSTACK_SECRET_KEY` (test key first) and `PAYSTACK_CURRENCY`. In Paystack → Settings → API Keys & Webhooks, set the webhook URL to `https://YOUR_DOMAIN/api/paystack/webhook` so buyers who close the tab after paying still get their link by email (needs `RESEND_API_KEY`).
5. Point your domain at Vercel and set `NEXT_PUBLIC_SITE_URL` (optional; it falls back to the `.vercel.app` URL).
6. Buy once with a Paystack test card, then switch to your `sk_live_…` key.

## How a roast works

1. **Your site:** fetches the homepage plus the pricing and about pages (SSRF-guarded, IP-pinned, public DNS fallback). It extracts headings, CTAs, proof, pricing, legal pages, page weight and share tags. Every check streams to the browser as it happens.
2. **Your market:** Groq names the category and 5 direct competitors. We crawl their homepages, and any we can't reach are dropped, so we never compare against a ghost.
3. **The verdict:** Groq scores against a calibrated rubric and must ground every finding in a quote or signal from your site or a competitor's.

The browser paces the live log so people can read each check, and the whole thing takes about a minute.

## Marketing: 20 roasts a day

```bash
cp urls.example.txt urls.txt          # add today's Product Hunt / Show HN / X launches
ADMIN_KEY=... node scripts/batch-roast.mjs urls.txt --base https://YOUR_DOMAIN
```

This writes `roasts-YYYY-MM-DD.md` with ready-to-post drafts. The founder's X handle is tagged when we find it on their site, and the link unfurls into the watermarked roast card. Review every draft and post by hand. Nothing is auto-posted.

## Prices

Set `PRICE_CENTS` (default 3900) and `RECHECK_PRICE_CENTS` (default 1500). The fix-check refund is always half the fix-check price.

## Project map

- `src/lib/crawl.ts`: safe fetching and extraction
- `src/lib/competitors.ts`: market and competitor discovery
- `src/lib/analyze.ts`: the roast prompt and scoring
- `src/lib/reports.ts`: the pipeline and live events
- `src/lib/recheck.ts`: fix check, verification and the half refund
- `src/lib/paystack.ts`: Paystack checkout, verification, refunds and webhook signatures
- `src/lib/fulfil.ts`: what happens after a verified payment (callback and webhook)
- `src/app/api/*`: roast stream, checkout, fix check, PDF, share card
- `src/components/RoastLive.tsx`: the live checks screen
- `src/components/report/*`: the report UI
