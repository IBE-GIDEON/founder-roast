import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL, PRICE_LABEL } from "@/lib/site";

export const metadata: Metadata = { title: "Terms & refunds" };

export default function Terms() {
  const contact = CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> : "the contact address on this site";
  return (
    <LegalPage title="Terms & refunds" updated="November 11, 2026">
      <p>
        Founder Roast analyses public web pages with automated tools and AI and gives you an opinion on them. By using the site you agree to these
        terms.
      </p>
      <h2>What you&apos;re buying</h2>
      <p>
        The free roast gives you an overall score and a short verdict. The full report ({PRICE_LABEL}, one-time) unlocks detailed scores, issues
        and fixes, a growth plan, a rewritten hero section and a PDF for that one URL. There is no subscription.
      </p>
      <h2>It&apos;s an opinion, not a guarantee</h2>
      <p>
        Scores and suggestions are generated automatically and can be wrong. They are not professional, legal or financial advice, and we
        don&apos;t guarantee any change in traffic, conversion or revenue.
      </p>
      <h2>Refunds</h2>
      <p>
        If your report fails to generate, or is clearly broken or about the wrong site, email {contact} within 7 days of purchase and we&apos;ll
        refund you in full. Because the report is delivered instantly, we don&apos;t otherwise offer refunds for change of mind.
      </p>
      <h2>Acceptable use</h2>
      <p>
        Only submit public URLs. Don&apos;t try to use the service to reach private networks, overload other people&apos;s sites, or get around
        rate limits. We may block abuse.
      </p>
      <h2>Sharing</h2>
      <p>
        Public report links show the free score and verdict. Full reports live at a private link shown after payment; anyone you give that link to
        can read the report.
      </p>
      <h2>Contact</h2>
      <p>Questions: {contact}.</p>
    </LegalPage>
  );
}
