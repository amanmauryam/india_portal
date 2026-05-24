"use client";

import CookieConsentBanner from "./CookieConsentBanner";
import CookiePreferencesModal from "./CookiePreferencesModal";

export default function CookieConsentProvider() {
  return (
    <>
      <CookieConsentBanner />
      <CookiePreferencesModal />
    </>
  );
}
