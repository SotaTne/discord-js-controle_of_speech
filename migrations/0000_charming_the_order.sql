CREATE TABLE `base_word_table` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`base_word` text NOT NULL,
	`plane_base_word` text NOT NULL,
	`is_regex` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guild_table`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_base_word` ON `base_word_table` (`guild_id`,`base_word`);--> statement-breakpoint
CREATE UNIQUE INDEX `idx_plane_base_word` ON `base_word_table` (`guild_id`,`plane_base_word`);--> statement-breakpoint
CREATE TABLE `guild_table` (
	`id` text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
CREATE TABLE `target_word_table` (
	`guild_id` text NOT NULL,
	`base_word_id` integer PRIMARY KEY NOT NULL,
	`target_word` text NOT NULL,
	`plane_target_word` text NOT NULL,
	FOREIGN KEY (`guild_id`) REFERENCES `guild_table`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`base_word_id`) REFERENCES `base_word_table`(`id`) ON UPDATE no action ON DELETE no action
);
