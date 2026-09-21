CREATE TABLE `assemblies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `type` VARCHAR(30) NOT NULL DEFAULT 'ordinary',
    `date` DATE NOT NULL,
    `place` VARCHAR(200) NULL,
    `attendees` INTEGER NOT NULL DEFAULT 0,
    `agenda` TEXT NULL,
    `decisions` TEXT NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `assemblies_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `assemblies` ADD CONSTRAINT `assemblies_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
