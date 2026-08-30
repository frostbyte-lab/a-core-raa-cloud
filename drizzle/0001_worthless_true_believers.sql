CREATE TABLE `araa_reports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`score` int NOT NULL,
	`level` varchar(32) NOT NULL,
	`datasetVersion` varchar(32) NOT NULL,
	`matchedCount` int NOT NULL DEFAULT 0,
	`findingCount` int NOT NULL DEFAULT 0,
	`reportMetadata` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `araa_reports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `araa_reports` ADD CONSTRAINT `araa_reports_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;