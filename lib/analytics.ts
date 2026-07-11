export const ANALYTICS_METRICS = ["pageview", "calculation"] as const;

export type AnalyticsMetric = (typeof ANALYTICS_METRICS)[number];

export type AnalyticsEvent = {
  metric: AnalyticsMetric;
  path: string;
};

const MAX_PATH_LENGTH = 160;
const ANALYTICS_PATH = "/analytics";
const API_PATH_PREFIX = "/api/";

function isAnalyticsMetric(value: unknown): value is AnalyticsMetric {
  return typeof value === "string" &&
    ANALYTICS_METRICS.includes(value as AnalyticsMetric);
}

export function normalizeAnalyticsPath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_PATH_LENGTH) {
    return null;
  }

  let parsed: URL;
  try {
    parsed = new URL(value, "https://paylab.local");
  } catch {
    return null;
  }

  if (parsed.origin !== "https://paylab.local" || !parsed.pathname.startsWith("/")) {
    return null;
  }

  const normalized = parsed.pathname.length > 1
    ? parsed.pathname.replace(/\/+$/, "")
    : "/";

  if (normalized === ANALYTICS_PATH || normalized.startsWith(API_PATH_PREFIX)) {
    return null;
  }

  return normalized;
}

export function parseAnalyticsEvent(value: unknown): AnalyticsEvent | null {
  if (!value || typeof value !== "object") return null;

  const payload = value as { metric?: unknown; path?: unknown };
  const path = normalizeAnalyticsPath(payload.path);
  if (!isAnalyticsMetric(payload.metric) || !path) return null;

  if (payload.metric === "calculation" && !path.startsWith("/calculators/")) {
    return null;
  }

  return { metric: payload.metric, path };
}
