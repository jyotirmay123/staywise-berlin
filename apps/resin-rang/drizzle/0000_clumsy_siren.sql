CREATE TABLE `order_items` (
	`id` text PRIMARY KEY NOT NULL,
	`order_id` text NOT NULL,
	`product_id` text NOT NULL,
	`product_name` text NOT NULL,
	`quantity` integer NOT NULL,
	`price` real NOT NULL
);
--> statement-breakpoint
CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`customer_name` text NOT NULL,
	`phone` text NOT NULL,
	`address` text NOT NULL,
	`payment_method` text NOT NULL,
	`status` text NOT NULL,
	`total` real NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`price` real NOT NULL,
	`stock` integer NOT NULL,
	`image_url` text NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`role` text NOT NULL,
	`expires_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_unique` ON `users` (`email`);
--> statement-breakpoint
CREATE INDEX `idx_products_active_created_at` ON `products` (`active`, `created_at`);
--> statement-breakpoint
CREATE INDEX `idx_orders_user_created_at` ON `orders` (`user_id`, `created_at`);
--> statement-breakpoint
CREATE INDEX `idx_order_items_order_id` ON `order_items` (`order_id`);
--> statement-breakpoint
CREATE INDEX `idx_sessions_expires_at` ON `sessions` (`expires_at`);
--> statement-breakpoint
-- Demonstration product seed rows omitted from the public source backup.
--> statement-breakpoint
PRAGMA optimize;
