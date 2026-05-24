<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:cookie-consent-rules -->
# Cookie Consent System

## Architecture
- **`frontend/src/lib/consent.ts`** — Pure utility functions for localStorage CRUD of consent state.
- **`frontend/src/lib/useConsent.ts`** — React hook wrapping consent utilities with reactive state.
- **`frontend/src/components/CookieConsentBanner.tsx`** — Banner shown on first visit.
- **`frontend/src/components/CookiePreferencesModal.tsx`** — Modal for granular toggle of cookie categories.
- **`frontend/src/components/CookieConsentProvider.tsx`** — Client component that mounts both banner and modal (used in root layout).
- **`frontend/src/components/CookiePreferencesButton.tsx`** — Small footer button to re-open preferences modal.
- **`frontend/src/components/OpenPreferencesButton.tsx`** — Full-size button used in cookie policy page.
- **`frontend/src/app/cookie-policy/page.tsx`** — Cookie policy page.
- **`frontend/src/app/privacy-policy/page.tsx`** — Privacy policy page.

## Storage
- **Key**: `bharatlocal_consent`
- **Value**: `{ analytics: boolean, marketing: boolean, timestamp: string, version: number }`
- **Essential cookies** are always enabled and are implicit (no user-visible toggle in storage).
- To **reset** consent for testing: run `localStorage.removeItem('bharatlocal_consent')` in browser DevTools.

## How to Integrate Future Analytics/Marketing Scripts
1. In the component/page where you load the script (e.g., Google Analytics, GTM, Meta Pixel), import and call `getConsent()` from `@/lib/consent`.
2. Only inject the script tag if the corresponding consent category is `true`:
   ```ts
   import { getConsent } from "@/lib/consent";
   const consent = getConsent();
   if (consent.analytics) {
     // load Google Analytics / GTM
   }
   if (consent.marketing) {
     // load Meta Pixel / AdSense
   }
   ```
3. Listen for consent changes by wrapping in a `useConsent()` hook (which re-renders on change) or by checking `getConsent()` on each page navigation.
4. Essential tracking (session tokens, CSRF protection) loads unconditionally.

## Usage Example
```tsx
"use client";
import { useConsent } from "@/lib/useConsent";

function AnalyticsLoader() {
  const { consent } = useConsent();

  useEffect(() => {
    if (consent.analytics && !window.ga) {
      // dynamically load GA script
    }
  }, [consent.analytics]);

  return null;
}
```
<!-- END:cookie-consent-rules -->
