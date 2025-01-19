CREATE TABLE `comment` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`hn_id` int NOT NULL,
	`parent_id` int NOT NULL,
	`by` varchar(128) NOT NULL,
	`text` text NOT NULL,
	`dead` boolean DEFAULT false,
	`deleted` boolean DEFAULT false,
	`type` varchar(20) NOT NULL DEFAULT 'comment',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `comment_id` PRIMARY KEY(`id`),
	CONSTRAINT `comment_hn_id_unique` UNIQUE(`hn_id`)
);
--> statement-breakpoint
CREATE TABLE `story` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`hn_id` int NOT NULL,
	`title` varchar(256) NOT NULL,
	`url` varchar(512),
	`text` text,
	`by` varchar(128) NOT NULL,
	`score` int DEFAULT 0,
	`descendants` int DEFAULT 0,
	`dead` boolean DEFAULT false,
	`deleted` boolean DEFAULT false,
	`type` varchar(20) NOT NULL DEFAULT 'story',
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `story_id` PRIMARY KEY(`id`),
	CONSTRAINT `story_hn_id_unique` UNIQUE(`hn_id`)
);
--> statement-breakpoint
CREATE TABLE `user` (
	`id` serial AUTO_INCREMENT NOT NULL,
	`username` varchar(128) NOT NULL,
	`about` text,
	`karma` int DEFAULT 0,
	`created` timestamp NOT NULL,
	`delay` int DEFAULT 0,
	`created_at` timestamp DEFAULT (now()),
	`updated_at` timestamp DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `user_id` PRIMARY KEY(`id`),
	CONSTRAINT `user_username_unique` UNIQUE(`username`)
);
