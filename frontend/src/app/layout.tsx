import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import TrackPageView from "@/components/TrackPageView";
import CookieConsentProvider from "@/components/CookieConsentProvider";

const PORTAL_URL = process.env.NEXT_PUBLIC_PORTAL_URL || "https://bharatlocal.gov.in";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(PORTAL_URL),
  title: "BharatLocal — India Hyperlocal Utility Portal",
  description: "Find verified government utility links, emergency contacts, railway stations, and ODOP information for every Indian district. Official billing portals for electricity, water, and municipal services.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    type: "website",
    siteName: "BharatLocal",
    locale: "en_IN",
  },
  twitter: {
    card: "summary_large_image",
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "BharatLocal",
  "url": PORTAL_URL,
  "description": "India Hyperlocal Utility Portal — verified government utility links for every Indian district.",
  "areaServed": "India",
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "hello@bharatlocal.in",
    "contactType": "general inquiries"
  }
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "BharatLocal",
  "url": PORTAL_URL,
  "description": "Find verified government utility links, emergency contacts, railway stations, and ODOP information for every Indian district.",
  "inLanguage": "en-IN",
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": `${PORTAL_URL}/?q={search_term_string}`
    },
    "query-input": "required name=search_term_string"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
      </head>
      <body className="min-h-full flex flex-col">
        <TrackPageView />
        {children}
        <CookieConsentProvider />
      </body>
    </html>
  );
}
