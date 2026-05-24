"use client";

import { Info } from "lucide-react";
import { useConsent } from "@/lib/useConsent";

export default function OpenPreferencesButton() {
  const { openPreferences } = useConsent();

  return (
    <button
      onClick={openPreferences}
      className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-blue-700"
    >
      <Info className="h-3.5 w-3.5" />
      Manage Cookie Preferences
    </button>
  );
}
