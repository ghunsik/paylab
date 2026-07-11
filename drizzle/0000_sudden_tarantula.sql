CREATE TABLE `analytics_daily` (
	`day` text NOT NULL,
	`path` text NOT NULL,
	`metric` text NOT NULL,
	`count` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	PRIMARY KEY(`day`, `path`, `metric`)
);
--> statement-breakpoint
CREATE INDEX `analytics_daily_day_metric_idx` ON `analytics_daily` (`day`,`metric`);