CREATE TABLE `events` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`event_type` text NOT NULL,
	`category` text,
	`context_type` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `submissions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`statement` text NOT NULL,
	`context` text NOT NULL,
	`primary_category` text NOT NULL,
	`secondary_categories` text DEFAULT '[]' NOT NULL,
	`interpretation` text,
	`status` text DEFAULT 'pending' NOT NULL,
	`privacy_confirmed` integer NOT NULL,
	`created_at` text NOT NULL
);
