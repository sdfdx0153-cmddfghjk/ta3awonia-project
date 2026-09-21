-- CreateTable board_members
CREATE TABLE `board_members` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `member_id` INTEGER NOT NULL,
    `position` VARCHAR(50) NOT NULL,
    `appointment_date` DATE NOT NULL,
    `term_years` INTEGER NOT NULL DEFAULT 3,
    `term_end_date` DATE NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `board_members_user_id_member_id_key`(`user_id`, `member_id`),
    INDEX `board_members_user_id_idx`(`user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `board_members` ADD CONSTRAINT `board_members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `board_members` ADD CONSTRAINT `board_members_member_id_fkey` FOREIGN KEY (`member_id`) REFERENCES `members`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
