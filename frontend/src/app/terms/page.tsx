import Link from "next/link";
import type { Metadata } from "next";
import { Scale, FileText, Shield, Gavel, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Terms & Conditions — BharatLocal",
  description: "Read the terms and conditions governing the use of BharatLocal — India Hyperlocal Utility Portal.",
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Scale className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Terms & Conditions</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last updated: May 24, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            Please read these Terms & Conditions (&ldquo;Terms&rdquo;) carefully before using the BharatLocal website and services. By accessing or using our portal, you agree to be bound by these Terms.
          </p>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-500" /> Acceptance of Terms
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              By using BharatLocal (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;), you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, please discontinue use of the portal immediately.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-blue-500" /> Description of Service
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              BharatLocal is a hyperlocal utility directory that indexes verified government and administrative links for Indian states and districts. We aggregate publicly available information and present it in a structured, hierarchical format. We do not process payments, issue bills, or provide direct government services.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Gavel className="h-5 w-5 text-blue-500" /> User Responsibilities
            </h2>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>You agree to use the portal only for lawful purposes and in compliance with all applicable Indian laws.</li>
              <li>You must verify the authenticity of any service link before making payments or sharing personal data.</li>
              <li>You shall not attempt to scrape, reverse-engineer, or disrupt the operation of this portal.</li>
              <li>You are responsible for maintaining the confidentiality of any account credentials issued to you.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Scale className="h-5 w-5 text-blue-500" /> Intellectual Property
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              All content on BharatLocal including text, graphics, logos, and software is the property of BharatLocal unless otherwise attributed. You may not reproduce, distribute, or create derivative works without prior written consent. Government portal names and logos are the property of their respective owners.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-blue-500" /> Third-Party Links
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Our portal contains links to third-party websites including official government portals, utility billing gateways, and informational resources. We do not control, endorse, or assume responsibility for the content, privacy practices, or availability of these external sites.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-500" /> Limitation of Liability
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              BharatLocal provides information on an &ldquo;as is&rdquo; and &ldquo;as available&rdquo; basis. We make no warranties regarding the accuracy, completeness, or reliability of the information provided. To the fullest extent permitted by Indian law, we disclaim all liability for any loss or damage arising from your use of the portal.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Gavel className="h-5 w-5 text-blue-500" /> Governing Law
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              These Terms shall be governed by and construed in accordance with the laws of India. Any disputes arising out of these Terms shall be subject to the exclusive jurisdiction of the courts in New Delhi, India.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <FileText className="h-5 w-5 text-blue-500" /> Changes to Terms
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We reserve the right to modify these Terms at any time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. Continued use after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-blue-500" /> Contact Us
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              For questions regarding these Terms, please reach out to us at{" "}
              <a
                href="mailto:legal@bharatlocal.in"
                className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
              >
                legal@bharatlocal.in
              </a>.
            </p>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Privacy Policy
              </Link>
              <Link
                href="/disclaimer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Disclaimer
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
