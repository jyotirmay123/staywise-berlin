CREATE TABLE `account_portfolios` (
	`account_hash` text PRIMARY KEY NOT NULL,
	`payload_json` text NOT NULL,
	`revision` integer DEFAULT 1 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
