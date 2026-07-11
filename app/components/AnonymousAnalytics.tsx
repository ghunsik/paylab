"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import type { AnalyticsMetric } from "@/lib/analytics";

const ANALYTICS_ENDPOINT = "/api/analytics";

export function recordAnonymousMetric(metric: AnalyticsMetric, path: string) {
  void fetch(ANALYTICS_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ metric, path }),
    keepalive: true,
    credentials: "omit",
    mode: "same-origin",
  }).catch(() => {
    // Analytics must never interrupt the calculator experience.
  });
}

export function AnonymousAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/analytics")) return;
    recordAnonymousMetric("pageview", pathname);
  }, [pathname]);

  return null;
}
