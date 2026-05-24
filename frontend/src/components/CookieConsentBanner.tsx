"use client";

import Link from "next/link";
import { Cookie, ShieldCheck, Settings, X } from "lucide-react";
import { useConsent } from "@/lib/useConsent";

export default function CookieConsentBanner() {
  const { showBanner, acceptAll, rejectNonEssential, openPreferences } = useConsent();

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 animate-in slide-in-from-bottom duration-500">
      <div className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <div className="relative rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-6 sm:p-5">
            <div className="hidden shrink-0 sm:block">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
                <Cookie className="h-5 w-5" />
              </div>
            </div>
            <div className="flex-1 text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-white">We value your privacy.</span>{" "}
              We use essential cookies for site security and preferences. Analytics and marketing cookies help us
              improve. See our{" "}
              <Link href="/cookie-policy" className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Cookie Policy
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-semibold text-blue-600 underline underline-offset-2 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                Privacy Policy
              </Link>.
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 px-4 py-3 dark:border-slate-800 sm:px-5">
            <button
              onClick={acceptAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Accept All
            </button>
            <button
              onClick={rejectNonEssential}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              <X className="h-3.5 w-3.5" />
              Reject Non-Essential
            </button>
            <button
              onClick={openPreferences}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              <Settings className="h-3.5 w-3.5" />
              Customize Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
