import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CONTACT_EMAIL, CONTACT_LABEL } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy" };

export default function Privacy() {
  const contact = CONTACT_EMAIL ? <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_LABEL}</a> : "the contact address on this site";
  return (
    <LegalPage title="Privacy" updated="November 11, 2026">
      <p>We collect as little as we can.</p>
      <h2>What we store</h2>
      <p>
        The URL you submit, what we read from that public page, and the report we generate, so your report link keeps working. We keep a
        short-lived counter per IP address to rate-limit free roasts.
      </p>
      <h2>Payments</h2>
      <p>
        Payments are handled by PayPal. We never see your card or bank details. PayPal shares your email and the payment status with us so we can deliver
        and, if needed, refund your report.
      </p>
      <h2>AI processing</h2>
      <p>The public content of the page you submit is sent to our AI provider (Groq) to generate the analysis. We don&apos;t send them anything about you.</p>
      <h2>Cookies</h2>
      <p>After you buy a report we set one cookie that remembers you unlocked it. No ad or tracking cookies.</p>
      <h2>Deleting a report</h2>
      <p>Email {contact} with the report link and we&apos;ll delete it.</p>
    </LegalPage>
  );
}
