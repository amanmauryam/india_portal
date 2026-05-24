"use client";

import { useState, useCallback, useEffect } from "react";
import {
  readConsent,
  acceptAll as acceptAllConsent,
  rejectNonEssential as rejectNonEssentialConsent,
  updateConsent as updateConsentStorage,
  type ConsentState,
  type ConsentCategory,
} from "./consent";

const CONSENT_CHANGE_EVENT = "bharatlocal:consent-change";
const PREFERENCES_EVENT = "bharatlocal:preferences";

export interface UseConsentReturn {
  consent: ConsentState;
  showBanner: boolean;
  showPreferences: boolean;
  acceptAll: () => void;
  rejectNonEssential: () => void;
  openPreferences: () => void;
  closePreferences: () => void;
  updateConsent: (category: ConsentCategory, enabled: boolean) => void;
}

export function useConsent(): UseConsentReturn {
  const [consent, setConsent] = useState<ConsentState>({ analytics: false, marketing: false, timestamp: "" });
  const [showPreferences, setShowPreferences] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
    setConsent(readConsent());

    function handleConsentChange() {
      setConsent(readConsent());
    }
    function handlePreferences(e: Event) {
      const detail = (e as CustomEvent).detail;
      setShowPreferences(detail?.open ?? false);
    }
    window.addEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
    window.addEventListener(PREFERENCES_EVENT, handlePreferences);
    window.addEventListener("storage", handleConsentChange);
    return () => {
      window.removeEventListener(CONSENT_CHANGE_EVENT, handleConsentChange);
      window.removeEventListener(PREFERENCES_EVENT, handlePreferences);
      window.removeEventListener("storage", handleConsentChange);
    };
  }, []);

  const acceptAll = useCallback(() => {
    acceptAllConsent();
    setConsent(readConsent());
    setShowPreferences(false);
    window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { open: false } }));
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT));
  }, []);

  const rejectNonEssential = useCallback(() => {
    rejectNonEssentialConsent();
    setConsent(readConsent());
    setShowPreferences(false);
    window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { open: false } }));
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT));
  }, []);

  const openPreferences = useCallback(() => {
    setShowPreferences(true);
    window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { open: true } }));
  }, []);

  const closePreferences = useCallback(() => {
    setShowPreferences(false);
    window.dispatchEvent(new CustomEvent(PREFERENCES_EVENT, { detail: { open: false } }));
  }, []);

  const updateConsent = useCallback((category: ConsentCategory, enabled: boolean) => {
    updateConsentStorage(category, enabled);
    setConsent(readConsent());
    window.dispatchEvent(new CustomEvent(CONSENT_CHANGE_EVENT));
  }, []);

  return {
    consent,
    showBanner: hydrated ? consent.timestamp === "" : false,
    showPreferences,
    acceptAll,
    rejectNonEssential,
    openPreferences,
    closePreferences,
    updateConsent,
  };
}
