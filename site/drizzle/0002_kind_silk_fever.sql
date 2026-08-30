ALTER TABLE `events` ADD `visitor_id` text;--> statement-breakpoint
ALTER TABLE `events` ADD `event_label` text;--> statement-breakpoint
CREATE INDEX `idx_events_visitor_created` ON `events` (`visitor_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `idx_events_type_label` ON `events` (`event_type`,`event_label`);