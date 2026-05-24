"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { Cookie, X, ShieldCheck, Info, Check } from "lucide-react";
import { useConsent } from "@/lib/useConsent";
import { CATEGORIES, ESSENTIAL_DESCRIPTION, type ConsentCategory } from "@/lib/consent";

export default function CookiePreferencesModal() {
  const {
    consent,
    showPreferences,
    closePreferences,
    updateConsent,
    acceptAll,
    rejectNonEssential,
  } = useConsent();

  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showPreferences) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closePreferences();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPreferences, closePreferences]);

  if (!showPreferences) return null;

  const categories: { key: ConsentCategory; enabled: boolean }[] = [
    { key: "analytics", enabled: consent.analytics },
    { key: "marketing", enabled: consent.marketing },
  ];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === overlayRef.current) closePreferences();
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400">
              <Cookie className="h-4.5 w-4.5" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 dark:text-white">Cookie Preferences</h2>
          </div>
          <button
            onClick={closePreferences}
            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-5 py-4">
          <p className="mb-5 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
            Manage your cookie preferences below. Essential cookies are always enabled as they are required for the
            website to function. You can change your preferences at any time.
          </p>

          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400">
                  <ShieldCheck className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">Essential Cookies</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500 dark:text-slate-400">{ESSENTIAL_DESCRIPTION}</p>
                </div>
              </div>
              <span className="flex h-6 items-center rounded-full bg-green-100 px-2.5 text-[10px] font-bold text-green-700 dark:bg-green-950/30 dark:text-green-400">
                <Check className="mr-1 h-3 w-3" /> Always Active
              </span>
            </div>
          </div>

          {categories.map(({ key, enabled }) => (
            <div
              key={key}
              className="mb-3 rounded-xl border border-slate-200 p-4 dark:border-slate-700"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    <Info className="h-4 w-4" />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">{CATEGORIES[key].label}</p>
                </div>
                <label className="relative inline-flex cursor-pointer items-center">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => updateConsent(key, e.target.checked)}
                    className="peer sr-only"
                  />
                  <div className="h-6 w-11 rounded-full border border-slate-300 bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:transition-all peer-checked:border-blue-600 peer-checked:bg-blue-600 peer-checked:after:translate-x-full peer-focus:ring-2 peer-focus:ring-blue-300 dark:border-slate-600 dark:bg-slate-700 dark:after:bg-slate-300" />
                </label>
              </div>
              <p className="mt-2.5 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                {CATEGORIES[key].description}
              </p>
            </div>
          ))}

          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-800/30">
            <p className="text-[10px] leading-relaxed text-slate-400">
              Last updated:{" "}
              {consent.timestamp
                ? new Date(consent.timestamp).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "Not set"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 px-5 py-4 dark:border-slate-800">
          <div className="flex gap-3 text-xs font-medium text-slate-500 dark:text-slate-400">
            <Link href="/cookie-policy" onClick={closePreferences} className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400">
              Cookie Policy
            </Link>
            <Link href="/privacy-policy" onClick={closePreferences} className="underline underline-offset-2 hover:text-blue-600 dark:hover:text-blue-400">
              Privacy Policy
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={rejectNonEssential}
              className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
            >
              Reject All
            </button>
            <button
              onClick={acceptAll}
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-[11px] font-bold text-white transition-colors hover:bg-blue-700"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Accept All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
