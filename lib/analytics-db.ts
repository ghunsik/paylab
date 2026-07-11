import { env } from "cloudflare:workers";
import type { AnalyticsEvent, AnalyticsMetric } from "@/lib/analytics";

export type DailyAnalytics = {
  day: string;
  pageviews: number;
  calculations: number;
};

export type PathAnalytics = {
  path: string;
  total: number;
};

export type AnalyticsDashboard = {
  periodDays: number;
  totals: Record<AnalyticsMetric, number>;
  today: Record<AnalyticsMetric, number>;
  daily: DailyAnalytics[];
  pagePaths: PathAnalytics[];
  calculators: PathAnalytics[];
};

type MetricTotalRow = { metric: AnalyticsMetric; total: number };

function getDatabase(): D1Database {
  if (!env.DB) {
    throw new Error("Analytics database binding is unavailable.");
  }
  return env.DB;
}

function kstDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function metricRecord(rows: MetricTotalRow[]): Record<AnalyticsMetric, number> {
  const result: Record<AnalyticsMetric, number> = { pageview: 0, calculation: 0 };
  for (const row of rows) {
    if (row.metric in result) result[row.metric] = Number(row.total) || 0;
  }
  return result;
}

export async function incrementAnalytics(event: AnalyticsEvent): Promise<void> {
  const database = getDatabase();
  await database
    .prepare(`
      INSERT INTO analytics_daily (day, path, metric, count, updated_at)
      VALUES (?1, ?2, ?3, 1, CURRENT_TIMESTAMP)
      ON CONFLICT (day, path, metric)
      DO UPDATE SET count = count + 1, updated_at = CURRENT_TIMESTAMP
    `)
    .bind(kstDay(), event.path, event.metric)
    .run();
}

export async function getAnalyticsDashboard(periodDays = 30): Promise<AnalyticsDashboard> {
  const database = getDatabase();
  const safePeriodDays = Math.min(Math.max(Math.trunc(periodDays), 1), 90);
  const sinceModifier = `-${safePeriodDays - 1} days`;

  const statements = [
    database.prepare(`
      SELECT metric, SUM(count) AS total
      FROM analytics_daily
      WHERE day >= date('now', '+9 hours', ?1)
      GROUP BY metric
    `).bind(sinceModifier),
    database.prepare(`
      SELECT metric, SUM(count) AS total
      FROM analytics_daily
      WHERE day = date('now', '+9 hours')
      GROUP BY metric
    `),
    database.prepare(`
      SELECT
        day,
        SUM(CASE WHEN metric = 'pageview' THEN count ELSE 0 END) AS pageviews,
        SUM(CASE WHEN metric = 'calculation' THEN count ELSE 0 END) AS calculations
      FROM analytics_daily
      WHERE day >= date('now', '+9 hours', ?1)
      GROUP BY day
      ORDER BY day DESC
    `).bind(sinceModifier),
    database.prepare(`
      SELECT path, SUM(count) AS total
      FROM analytics_daily
      WHERE metric = 'pageview' AND day >= date('now', '+9 hours', ?1)
      GROUP BY path
      ORDER BY total DESC, path ASC
      LIMIT 10
    `).bind(sinceModifier),
    database.prepare(`
      SELECT path, SUM(count) AS total
      FROM analytics_daily
      WHERE metric = 'calculation' AND day >= date('now', '+9 hours', ?1)
      GROUP BY path
      ORDER BY total DESC, path ASC
      LIMIT 10
    `).bind(sinceModifier),
  ];

  const [totalsResult, todayResult, dailyResult, pagePathsResult, calculatorsResult] =
    await database.batch(statements);

  const totals = (totalsResult.results ?? []) as MetricTotalRow[];
  const today = (todayResult.results ?? []) as MetricTotalRow[];
  const daily = (dailyResult.results ?? []).map((row) => ({
    day: String(row.day),
    pageviews: Number(row.pageviews) || 0,
    calculations: Number(row.calculations) || 0,
  }));
  const toPaths = (rows: Record<string, unknown>[]) => rows.map((row) => ({
    path: String(row.path),
    total: Number(row.total) || 0,
  }));

  return {
    periodDays: safePeriodDays,
    totals: metricRecord(totals),
    today: metricRecord(today),
    daily,
    pagePaths: toPaths((pagePathsResult.results ?? []) as Record<string, unknown>[]),
    calculators: toPaths((calculatorsResult.results ?? []) as Record<string, unknown>[]),
  };
}
