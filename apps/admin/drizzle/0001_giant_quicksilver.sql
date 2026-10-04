CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`content_id` text NOT NULL,
	`kind` text NOT NULL,
	`day` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `metrics` (
	`content_id` text PRIMARY KEY NOT NULL,
	`views` integer DEFAULT 0 NOT NULL,
	`reads` integer DEFAULT 0 NOT NULL
);
