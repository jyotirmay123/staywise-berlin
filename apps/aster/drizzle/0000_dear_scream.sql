CREATE TABLE `portfolio_vaults` (
	`id` text PRIMARY KEY NOT NULL,
	`access_hash` text NOT NULL,
	`payload_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
