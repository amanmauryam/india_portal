export type ConsentCategory = "analytics" | "marketing";

export interface ConsentState {
  analytics: boolean;
  marketing: boolean;
  timestamp: string;
}

const STORAGE_KEY = "bharatlocal_consent";
const CONSENT_VERSION = 1;

export const CATEGORIES: Record<ConsentCategory, { label: string; description: string }> = {
  analytics: {
    label: "Analytics Cookies",
    description:
      "Help us understand how visitors interact with the website by collecting anonymous usage data. We use this to improve our content and user experience.",
  },
  marketing: {
    label: "Marketing Cookies",
    description:
      "Used to deliver relevant advertisements and track campaign performance. These may be set by third-party advertising partners.",
  },
};

export const ESSENTIAL_DESCRIPTION =
  "Required for the website to function properly. These include session management, security tokens, and preference storage. Always active.";

const DEFAULT_CONSENT: ConsentState = { analytics: false, marketing: false, timestamp: "" };

function getStoredConsent(): ConsentState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ConsentState;
    if (typeof parsed.analytics !== "boolean" || typeof parsed.marketing !== "boolean") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function readConsent(): ConsentState {
  const stored = getStoredConsent();
  return stored ? { ...stored } : { ...DEFAULT_CONSENT };
}

export function hasConsent(): boolean {
  return readConsent().timestamp !== "";
}

function persistConsent(state: ConsentState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, version: CONSENT_VERSION }));
  } catch {
    /* storage full or unavailable */
  }
}

export function acceptAll(): ConsentState {
  const state: ConsentState = {
    analytics: true,
    marketing: true,
    timestamp: new Date().toISOString(),
  };
  persistConsent(state);
  return state;
}

export function rejectNonEssential(): ConsentState {
  const state: ConsentState = {
    analytics: false,
    marketing: false,
    timestamp: new Date().toISOString(),
  };
  persistConsent(state);
  return state;
}

export function updateConsent(category: ConsentCategory, enabled: boolean): ConsentState {
  const current = readConsent();
  current[category] = enabled;
  current.timestamp = new Date().toISOString();
  persistConsent(current);
  return { ...current };
}

export function resetConsent(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
