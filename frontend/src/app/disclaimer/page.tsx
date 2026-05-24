import Link from "next/link";
import type { Metadata } from "next";
import { AlertTriangle, FileText, Shield, ExternalLink, Info } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Disclaimer — BharatLocal",
  description: "Important disclaimers regarding the use of BharatLocal hyperlocal utility portal and third-party links.",
};

export default function DisclaimerPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Disclaimer</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last updated: May 24, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
          <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-5 dark:border-amber-900/30 dark:bg-amber-950/10">
            <p className="text-sm font-semibold text-amber-900 dark:text-amber-300">
              Please read this disclaimer carefully before using BharatLocal.
            </p>
          </div>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Info className="h-5 w-5 text-amber-500" /> General Information Only
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              The information provided on BharatLocal is for general informational and educational purposes only. While we strive to keep the information accurate and up to date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information contained on the portal.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <ExternalLink className="h-5 w-5 text-amber-500" /> External Links Disclaimer
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              BharatLocal contains links to external websites and third-party portals that are not owned or controlled by us. We have no control over the nature, content, and availability of those sites. The inclusion of any links does not necessarily imply a recommendation or endorsement of the views expressed within them.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Users are advised to verify the authenticity of any website before making online payments or sharing personal information. Always ensure you are on the official domain (e.g., ending in <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">.gov.in</code>) before proceeding with transactions.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-amber-500" /> No Professional Advice
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              The content on BharatLocal does not constitute legal, financial, or professional advice. You should consult appropriate professionals for advice specific to your situation. We are not affiliated with any government agency unless explicitly stated.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-amber-500" /> Accuracy of Information
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Utility board links, contact numbers, and service details may change without notice. We recommend verifying critical information directly with the concerned government department or utility provider. We disclaim all liability for any loss or damage incurred as a result of reliance on the information provided.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <AlertTriangle className="h-5 w-5 text-amber-500" /> Limitation of Liability
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              In no event shall BharatLocal or its operators be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your access to, use of, or inability to use the portal. This includes but is not limited to damages for loss of data, revenue, or business interruption.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Info className="h-5 w-5 text-amber-500" /> Changes to This Disclaimer
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We may update this disclaimer from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this page periodically.
            </p>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/terms"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Terms & Conditions
              </Link>
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Privacy Policy
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
