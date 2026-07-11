import { sql } from "drizzle-orm";
import { index, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const analyticsDaily = sqliteTable(
  "analytics_daily",
  {
    day: text("day").notNull(),
    path: text("path").notNull(),
    metric: text("metric", { enum: ["pageview", "calculation"] }).notNull(),
    count: integer("count").notNull().default(0),
    updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => [
    primaryKey({ columns: [table.day, table.path, table.metric] }),
    index("analytics_daily_day_metric_idx").on(table.day, table.metric),
  ],
);
