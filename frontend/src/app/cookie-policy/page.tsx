import Link from "next/link";
import type { Metadata } from "next";
import { Cookie, ShieldCheck, BarChart3, Megaphone } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import OpenPreferencesButton from "@/components/OpenPreferencesButton";

export const metadata: Metadata = {
  title: "Cookie Policy — BharatLocal",
  description: "Learn how BharatLocal uses cookies to improve your experience and how you can control your preferences.",
  alternates: { canonical: "/cookie-policy" },
  openGraph: {
    title: "Cookie Policy — BharatLocal",
    description: "Learn how BharatLocal uses cookies and how you can control your cookie preferences.",
  },
  twitter: {
    title: "Cookie Policy — BharatLocal",
    description: "Learn how BharatLocal uses cookies and how you can control your cookie preferences.",
  },
};

export default function CookiePolicyPage() {
  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl flex-1 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
            <Cookie className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-3xl">Cookie Policy</h1>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Last updated: May 24, 2026</p>
          </div>
        </div>

        <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            This Cookie Policy explains how BharatLocal (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) uses cookies and similar tracking technologies when you visit our website at{" "}
            <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-200">bharatlocal.in</code>.
          </p>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">What Are Cookies?</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit a website. They help the website remember your actions and preferences over time, improving your browsing experience.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">How We Use Cookies</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We categorize cookies into three groups based on their purpose:
            </p>

            <div className="mt-6 grid gap-4">
              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Essential Cookies</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      These cookies are necessary for the website to function. They enable core features such as security, network management, and accessibility. Essential cookies are always active and cannot be disabled.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Examples: session tokens, CSRF tokens, consent preference storage.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400">
                    <BarChart3 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Analytics Cookies</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      These cookies help us understand how visitors interact with our site by collecting anonymous information. We use this data to improve content, fix errors, and optimize the user experience.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Examples: page view counts, search trends, popular district pages.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400">
                    <Megaphone className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">Marketing Cookies</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                      These cookies track your browsing activity across websites to build a profile of your interests. They may be set by third-party advertising partners to serve relevant advertisements.
                    </p>
                    <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Examples: ad retargeting pixels, conversion tracking tags.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Third-Party Cookies</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We do not currently deploy third-party analytics or advertising cookies. If we integrate services such as Google Analytics, Google Tag Manager, or ad platforms in the future, they will only activate after you grant explicit consent via our cookie preference center.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Managing Your Preferences</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              You can manage your cookie preferences at any time. Use the button below to open our preference center, or adjust your browser settings to block or delete cookies. Note that disabling certain cookies may affect site functionality.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <OpenPreferencesButton />
              <Link
                href="/privacy-policy"
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              >
                View Privacy Policy
              </Link>
            </div>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Changes to This Policy</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              We may update this Cookie Policy from time to time. Changes will be posted on this page with an updated &ldquo;Last updated&rdquo; date. We encourage you to review this policy periodically.
            </p>
          </section>

          <section className="mt-10">
            <h2 className="text-lg font-extrabold text-slate-900 dark:text-white">Contact Us</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              If you have questions about our use of cookies, please reach out to us at{" "}
              <a
                href="mailto:privacy@bharatlocal.in"
                className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400"
              >
                privacy@bharatlocal.in
              </a>.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}
