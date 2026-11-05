CREATE TABLE `confia_admin_settings` (
	`user_id` text PRIMARY KEY NOT NULL,
	`enabled_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `confia_analyses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target` text NOT NULL,
	`hostname` text NOT NULL,
	`verdict` text NOT NULL,
	`result_json` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `analyses_owner_time` ON `confia_analyses` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `confia_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `confia_businesses` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`cnpj` text NOT NULL,
	`name` text NOT NULL,
	`domain` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`review_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `business_owner_domain` ON `confia_businesses` (`user_id`,`domain`);--> statement-breakpoint
CREATE TABLE `confia_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `confia_reports` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`target` text NOT NULL,
	`category` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pendente' NOT NULL,
	`review_note` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `reports_owner_time` ON `confia_reports` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `confia_meta_templates` (
	`name` text PRIMARY KEY NOT NULL,
	`remote_id` text,
	`status` text NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `confia_meta_events` (
	`hash` text PRIMARY KEY NOT NULL,
	`created_at` integer NOT NULL
);
