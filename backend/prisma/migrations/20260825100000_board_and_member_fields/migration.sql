-- AlterTable users: board fields
ALTER TABLE `users` ADD COLUMN `phone` VARCHAR(20) NULL;
ALTER TABLE `users` ADD COLUMN `board_position` VARCHAR(50) NULL;
ALTER TABLE `users` ADD COLUMN `appointment_date` DATE NULL;
ALTER TABLE `users` ADD COLUMN `term_end_date` DATE NULL;

-- AlterTable members: extra form fields
ALTER TABLE `members` ADD COLUMN `first_name` VARCHAR(50) NULL;
ALTER TABLE `members` ADD COLUMN `family_name` VARCHAR(50) NULL;
ALTER TABLE `members` ADD COLUMN `birth_date` DATE NULL;
ALTER TABLE `members` ADD COLUMN `shares_count` INTEGER NOT NULL DEFAULT 0;
ALTER TABLE `members` ADD COLUMN `payment_method` VARCHAR(30) NULL;
ALTER TABLE `members` ADD COLUMN `notes` TEXT NULL;
