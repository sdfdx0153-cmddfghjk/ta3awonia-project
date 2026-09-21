#!/usr/bin/env bash
# ✅ شغّل هاد السكريبت بصلاحية root باش يهيّئ قاعدة البيانات والمستخدم
# الاستعمال: sudo bash setup_db.sh

set -e

echo "🔄 كنخلق قاعدة البيانات والمستخدم..."
mysql -u root <<'SQL'
CREATE DATABASE IF NOT EXISTS cooperative_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'coop'@'localhost' IDENTIFIED BY 'coop_2024';
GRANT ALL PRIVILEGES ON cooperative_db.* TO 'coop'@'localhost';
FLUSH PRIVILEGES;
SQL

echo "✅ قاعدة البيانات cooperative_db والمستخدم coop جاهزين!"
