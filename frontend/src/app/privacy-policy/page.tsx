import Link from "next/link";
import type { Metadata } from "next";
import { Shield, Lock, Eye, Database, Mail } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Privacy Policy — BharatLocal",
  description: "BharatLocal privacy policy — how we collect, use, and protect your personal information.",
  alternates: { canonical: "/privacy-policy" },
  openGraph: {
    title: "Privacy Policy — BharatLocal",
    description: "How BharatLocal collects, uses, and protects your personal information.",
  },
  twitter: {
    title: "Privacy Policy — BharatLocal",
    description: "How BharatLocal collects, uses, and protects your personal information.",
  },
};

export default function PrivacyPolicyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Privacy Policy</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last updated: May 24, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            BharatLocal (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
          </p>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Database className="h-5 w-5 text-blue-500" /> Information We Collect
            </h2>
            <div className="mt-4 grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Information You Provide</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  <li>Contact information via email inquiries or feedback forms.</li>
                  <li>Admin panel account credentials (hashed and stored securely).</li>
                </ul>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Information Collected Automatically</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                  <li>Page views and navigation patterns (state/district/service pages visited).</li>
                  <li>Search queries entered in the site search bar.</li>
                  <li>Browser type, device type, and operating system.</li>
                  <li>Referral source and approximate geographic region (IP-based).</li>
                </ul>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Eye className="h-5 w-5 text-blue-500" /> How We Use Your Information
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We use collected information to:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>Provide and maintain accurate hyperlocal utility directories.</li>
              <li>Analyze usage patterns to improve content and site navigation.</li>
              <li>Detect and prevent fraudulent or abusive activity.</li>
              <li>Respond to user inquiries and support requests.</li>
              <li>Comply with legal obligations.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Lock className="h-5 w-5 text-blue-500" /> Data Security
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We implement industry-standard security measures including encryption in transit (TLS 1.3), secure session management, and hashed credential storage. However, no method of electronic storage is 100% secure, and we cannot guarantee absolute security.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Database className="h-5 w-5 text-blue-500" /> Data Retention
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Analytics and search logs are retained for a maximum of 12 months. Admin account data is retained until the account is deleted. You may request deletion of your data by contacting us.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Shield className="h-5 w-5 text-blue-500" /> Your Rights
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Depending on your jurisdiction (including rights under the Digital Personal Data Protection Act, 2023 of India), you may have the right to:
            </p>
            <ul className="mt-3 list-disc space-y-1.5 pl-5 text-xs leading-relaxed text-slate-600 dark:text-slate-400">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction or deletion of your data.</li>
              <li>Withdraw consent for data processing (opt out of analytics/marketing cookies).</li>
              <li>File a complaint with the relevant data protection authority.</li>
            </ul>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Database className="h-5 w-5 text-blue-500" /> Third-Party Services
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We do not currently share data with third-party analytics or advertising services. If we integrate such services in the future, they will only activate after obtaining your explicit consent via our cookie preference center.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
              <Mail className="h-5 w-5 text-blue-500" /> Contact Us
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              For privacy-related inquiries, please contact us at{" "}
              <a
                href="mailto:privacy@bharatlocal.in"
                className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
              >
                privacy@bharatlocal.in
              </a>.
            </p>
          </section>

          <section className="mt-10">
            <div className="flex flex-wrap gap-3">
              <Link
                href="/cookie-policy"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Cookie Policy
              </Link>
            </div>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
