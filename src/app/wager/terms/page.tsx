import Link from "next/link";
import { ArrowLeft, FileText, ShieldAlert } from "lucide-react";

const updatedOn = "April 18, 2026";

export default function WagerTermsPage() {
  return (
    <div className="min-h-screen bg-fn-dark px-4 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link
            href="/wager"
            className="inline-flex items-center gap-1 rounded-sm border border-fn-gborder px-3 py-2 text-[10px] font-bold tracking-widest text-fn-text transition-colors hover:border-fn-green/40 hover:text-fn-green"
          >
            <ArrowLeft size={12} />
            BACK TO WAGER
          </Link>
          <span className="fn-label">LAST UPDATED: {updatedOn}</span>
        </div>

        <div className="rounded-sm border border-fn-gborder bg-fn-card p-5 sm:p-7">
          <div className="mb-5 flex items-center gap-2">
            <FileText size={14} className="text-fn-green" />
            <h1 className="font-display text-2xl font-black uppercase tracking-tight text-fn-text sm:text-3xl">
              Wager Terms And Conditions
            </h1>
          </div>

          <div className="mb-5 rounded-sm border border-fn-yellow/30 bg-fn-yellow/10 p-3 text-[11px] leading-relaxed text-fn-text">
            <div className="mb-1 flex items-center gap-1.5 font-bold uppercase tracking-widest text-fn-yellow">
              <ShieldAlert size={12} />
              Important Notice
            </div>
            <p>
              By placing a wager on Frag Naija, you agree to these terms. If you do not agree, do not place wagers.
            </p>
          </div>

          <div className="space-y-5 text-[12px] leading-relaxed text-fn-text">
            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">1. Eligibility</h2>
              <p>You must be at least 18 years old and legally permitted to participate in your location.</p>
              <p>You are responsible for ensuring compliance with all local laws and restrictions.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">2. Account Responsibility</h2>
              <p>You are responsible for keeping your account credentials secure and for all actions on your account.</p>
              <p>Any suspicious access, fraud, or abuse may lead to temporary suspension or permanent termination.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">3. Wager Placement And Settlement</h2>
              <p>All wagers are final once accepted and cannot be reversed except where required by law or platform policy.</p>
              <p>Market outcomes are resolved using official match or event data determined by Frag Naija.</p>
              <p>If an event is cancelled, void, or materially disrupted, wagers may be refunded or settled at platform discretion.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">4. Odds, Pricing, And Errors</h2>
              <p>Displayed odds, pool values, and pricing may change before confirmation.</p>
              <p>Frag Naija may correct obvious technical errors, pricing mistakes, or settlement mistakes, including reversing affected entries.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">5. Deposits And Withdrawals</h2>
              <p>Payment processing uses approved third-party providers. Processing times may vary.</p>
              <p>Identity verification or fraud checks may be required before withdrawals are approved.</p>
              <p>Fees charged by payment providers or banks are your responsibility unless stated otherwise.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">6. Prohibited Conduct</h2>
              <p>Use of bots, scripts, collusion, chargeback abuse, multi-accounting, or any manipulation of market outcomes is prohibited.</p>
              <p>Frag Naija may void related wagers and freeze associated balances while investigating abuse.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">7. Limitation Of Liability</h2>
              <p>Frag Naija is provided on an “as available” basis and does not guarantee uninterrupted access.</p>
              <p>To the fullest extent permitted by law, Frag Naija is not liable for indirect, incidental, or consequential losses.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">8. Term Updates</h2>
              <p>These terms may be updated periodically. Continued use of wager features after updates means you accept revised terms.</p>
            </section>

            <section>
              <h2 className="mb-1 text-[13px] font-bold uppercase tracking-wide text-fn-green">9. Contact</h2>
              <p>For support or disputes related to wagers, contact the Frag Naija support team from the platform contact page.</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
