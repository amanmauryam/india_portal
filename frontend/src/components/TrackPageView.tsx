"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export default function TrackPageView() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;

    const payload: Record<string, string> = {
      event_type: "PAGE_VIEW",
      state_slug: "",
      district_slug: "",
      service_slug: "",
    };

    const parts = pathname.split("/").filter(Boolean);
    if (parts.length >= 1 && parts[0] !== "blogs") payload.state_slug = parts[0];
    if (parts.length >= 2 && parts[0] !== "blogs") payload.district_slug = parts[1];
    if (parts.length >= 3 && parts[0] !== "blogs") payload.service_slug = parts[2];

    fetch(`${API_BASE}/api/analytics/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
  }, [pathname]);

  return null;
}
