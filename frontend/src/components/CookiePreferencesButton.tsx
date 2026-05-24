"use client";

import { Settings } from "lucide-react";
import { useConsent } from "@/lib/useConsent";

export default function CookiePreferencesButton() {
  const { openPreferences } = useConsent();

  return (
    <button
      onClick={openPreferences}
      className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-blue-600 dark:text-slate-400 dark:hover:text-white"
    >
      <Settings className="h-3 w-3" />
      Cookie Preferences
    </button>
  );
}
