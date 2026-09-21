-- Multi-tenancy: add user_id to all business tables
-- WARNING: This assumes a fresh DB or you will need to assign existing data to a user first.

-- Members
ALTER TABLE `members` DROP INDEX `members_cin_key`;
ALTER TABLE `members` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `members` ADD CONSTRAINT `members_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE UNIQUE INDEX `members_user_id_cin_key` ON `members`(`user_id`, `cin`);
CREATE INDEX `members_user_id_idx` ON `members`(`user_id`);

-- Products
ALTER TABLE `products` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `products` ADD CONSTRAINT `products_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `products_user_id_idx` ON `products`(`user_id`);

-- Sales
ALTER TABLE `sales` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `sales` ADD CONSTRAINT `sales_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `sales_user_id_idx` ON `sales`(`user_id`);

-- Contributions
ALTER TABLE `contributions` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `contributions` ADD CONSTRAINT `contributions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `contributions_user_id_idx` ON `contributions`(`user_id`);

-- Debts
ALTER TABLE `debts` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `debts` ADD CONSTRAINT `debts_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `debts_user_id_idx` ON `debts`(`user_id`);

-- Expenses
ALTER TABLE `expenses` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `expenses` ADD CONSTRAINT `expenses_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `expenses_user_id_idx` ON `expenses`(`user_id`);

-- Suppliers
ALTER TABLE `suppliers` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `suppliers_user_id_idx` ON `suppliers`(`user_id`);

-- Purchase Orders
ALTER TABLE `purchase_orders` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `purchase_orders` ADD CONSTRAINT `purchase_orders_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `purchase_orders_user_id_idx` ON `purchase_orders`(`user_id`);

-- Profit Distributions
ALTER TABLE `profit_distributions` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `profit_distributions` ADD CONSTRAINT `profit_distributions_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `profit_distributions_user_id_idx` ON `profit_distributions`(`user_id`);

-- Inventory Checks
ALTER TABLE `inventory_checks` ADD COLUMN `user_id` INTEGER NOT NULL DEFAULT 1;
ALTER TABLE `inventory_checks` ADD CONSTRAINT `inventory_checks_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX `inventory_checks_user_id_idx` ON `inventory_checks`(`user_id`);
