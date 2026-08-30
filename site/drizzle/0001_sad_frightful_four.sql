CREATE INDEX `idx_events_type_created` ON `events` (`event_type`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_category` ON `events` (`category`);--> statement-breakpoint
CREATE INDEX `idx_submissions_status_created` ON `submissions` (`status`,`created_at`);