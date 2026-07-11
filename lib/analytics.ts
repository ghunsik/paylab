export const ANALYTICS_METRICS = ["pageview", "calculation"] as const;

export type AnalyticsMetric = (typeof ANALYTICS_METRICS)[number];

export type AnalyticsEvent = {
  metric: AnalyticsMetric;
  path: string;
};

const MAX_PATH_LENGTH = 160;
const PAGEVIEW_PATHS = new Set([
  "/",
  "/standards",
  "/methodology",
  "/privacy",
  "/terms",
  "/calculators/salary",
  "/calculators/hourly",
  "/calculators/severance",
  "/calculators/unemployment",
  "/calculators/annual-leave",
  "/calculators/weekly-holiday",
  "/calculators/shutdown",
]);
const CALCULATOR_PATHS = new Set(
  [...PAGEVIEW_PATHS].filter((path) => path.startsWith("/calculators/")),
);

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

  return PAGEVIEW_PATHS.has(normalized) ? normalized : null;
}

export function parseAnalyticsEvent(value: unknown): AnalyticsEvent | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const keys = Object.keys(value).sort();
  if (keys.length !== 2 || keys[0] !== "metric" || keys[1] !== "path") return null;

  const payload = value as { metric?: unknown; path?: unknown };
  const path = normalizeAnalyticsPath(payload.path);
  if (!isAnalyticsMetric(payload.metric) || !path) return null;

  if (payload.metric === "calculation" && !CALCULATOR_PATHS.has(path)) {
    return null;
  }

  return { metric: payload.metric, path };
}
