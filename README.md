# Founder Roast

Paste a startup URL. AI reads the site and its competitors live, then returns a score, a shareable roast, and (paid) the full teardown.

- **Free:** overall score, verdict, roast line, first blind spot, competitor logos, the full "what we checked" log, a watermarked share card.
- **Full report ($39):** 3 blind spots with evidence, a competitor teardown, four scores with every issue and fix, a growth plan, a rewritten hero, and a PDF.
- **Fix check ($15):** re-checks only the original findings. It never invents new problems. If everything is fixed, the site is marked up to date, no more checks can be sold for it, and $7.50 is refunded automatically through Stripe.
- **One roast per site:** repeat visitors get the original roast (180 days), not a fresh set of findings.

## What you need to launch

| Thing | Where | Cost | Env vars |
| --- | --- | --- | --- |
| Groq API key | console.groq.com/keys | pay as you go, fractions of a cent per roast | `GROQ_API_KEY` |
| Stripe account (activated) | dashboard.stripe.com | 2.9% + 30¢ per sale | `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` |
| Upstash Redis | Vercel → Storage → Marketplace → Upstash | free tier is plenty | `KV_REST_API_URL`, `KV_REST_API_TOKEN` |
| Vercel project | vercel.com (import this GitHub repo) | free / $20 Pro | — |
| Domain | any registrar or Vercel Domains | ~$10–15/yr | `NEXT_PUBLIC_SITE_URL` |
| Random secret | `openssl rand -hex 32` | — | `ACCESS_SECRET`, `ADMIN_KEY` |
| Resend (optional) | resend.com | free tier | `RESEND_API_KEY`, `EMAIL_FROM` |
| X account for the brand | x.com | — | `NEXT_PUBLIC_X_HANDLE` |
| Support email | any inbox | — | `NEXT_PUBLIC_CONTACT_EMAIL` |

Stripe needs a live website with terms, a refund policy and a contact email before it activates live payments. `/terms` and `/privacy` are included. Read them and set `NEXT_PUBLIC_CONTACT_EMAIL`.

## Run locally

```bash
npm install
cp .env.example .env.local   # fill in what you have
npm run dev
```

Without keys the app still runs end to end in development:
- no `GROQ_API_KEY` → heuristic "demo analysis" (labelled in the UI)
- no `STRIPE_SECRET_KEY` → checkout is skipped, so you can test unlocks and fix checks
- no Redis → data is stored in `.data/`

In production, missing keys fail loudly instead.

## Deploy (Vercel)

1. Import the GitHub repo in Vercel.
2. Add Upstash Redis from the Vercel Marketplace (it sets `KV_REST_API_URL` / `KV_REST_API_TOKEN`).
3. Add the other env vars from `.env.example`.
4. In Stripe → Developers → Webhooks, add `https://YOUR_DOMAIN/api/stripe/webhook` for `checkout.session.completed`, then put its signing secret in `STRIPE_WEBHOOK_SECRET`.
5. Point your domain at Vercel and set `NEXT_PUBLIC_SITE_URL`.
6. Run one real purchase with a Stripe test key first, then switch to live keys.

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
- `src/app/api/*`: roast stream, checkout, fix check, Stripe webhook, PDF, share card
- `src/components/RoastLive.tsx`: the live checks screen
- `src/components/report/*`: the report UI
