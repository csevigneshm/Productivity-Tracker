-- =============================================================================
-- PRODUCTIVITY TRACKER - FULL DATABASE SCHEMA REFERENCE
-- =============================================================================
-- This file is for reference only. Use Laravel migrations to apply changes.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- EXISTING TABLES (auto-created by Laravel + Fortify + Passkeys)
-- DO NOT recreate these via migrations
-- -----------------------------------------------------------------------------

CREATE TABLE `users` (
    `id`                        BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `name`                      VARCHAR(255) NOT NULL,
    `email`                     VARCHAR(255) NOT NULL UNIQUE,
    `email_verified_at`         TIMESTAMP NULL,
    `password`                  VARCHAR(255) NOT NULL,
    `two_factor_secret`         TEXT NULL,               -- added by Fortify 2FA
    `two_factor_recovery_codes` TEXT NULL,               -- added by Fortify 2FA
    `two_factor_confirmed_at`   TIMESTAMP NULL,          -- added by Fortify 2FA
    `remember_token`            VARCHAR(100) NULL,
    `created_at`                TIMESTAMP NULL,
    `updated_at`                TIMESTAMP NULL
);

CREATE TABLE `password_reset_tokens` (
    `email`      VARCHAR(255) PRIMARY KEY,
    `token`      VARCHAR(255) NOT NULL,
    `created_at` TIMESTAMP NULL
);

CREATE TABLE `sessions` (
    `id`            VARCHAR(255) PRIMARY KEY,
    `user_id`       BIGINT UNSIGNED NULL,
    `ip_address`    VARCHAR(45) NULL,
    `user_agent`    TEXT NULL,
    `payload`       LONGTEXT NOT NULL,
    `last_activity` INT NOT NULL,
    INDEX (`user_id`),
    INDEX (`last_activity`)
);

CREATE TABLE `passkeys` (
    `id`            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`       BIGINT UNSIGNED NOT NULL,
    `name`          VARCHAR(255) NOT NULL,
    `credential_id` VARCHAR(255) NOT NULL UNIQUE,
    `credential`    JSON NOT NULL,
    `last_used_at`  TIMESTAMP NULL,
    `created_at`    TIMESTAMP NULL,
    `updated_at`    TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX (`user_id`)
);

CREATE TABLE `cache` (
    `key`        VARCHAR(255) PRIMARY KEY,
    `value`      MEDIUMTEXT NOT NULL,
    `expiration` BIGINT NOT NULL,
    INDEX (`expiration`)
);

CREATE TABLE `cache_locks` (
    `key`        VARCHAR(255) PRIMARY KEY,
    `owner`      VARCHAR(255) NOT NULL,
    `expiration` BIGINT NOT NULL,
    INDEX (`expiration`)
);

CREATE TABLE `jobs` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `queue`        VARCHAR(255) NOT NULL,
    `payload`      LONGTEXT NOT NULL,
    `attempts`     SMALLINT UNSIGNED NOT NULL,
    `reserved_at`  INT UNSIGNED NULL,
    `available_at` INT UNSIGNED NOT NULL,
    `created_at`   INT UNSIGNED NOT NULL,
    INDEX (`queue`)
);

CREATE TABLE `job_batches` (
    `id`              VARCHAR(255) PRIMARY KEY,
    `name`            VARCHAR(255) NOT NULL,
    `total_jobs`      INT NOT NULL,
    `pending_jobs`    INT NOT NULL,
    `failed_jobs`     INT NOT NULL,
    `failed_job_ids`  LONGTEXT NOT NULL,
    `options`         MEDIUMTEXT NULL,
    `cancelled_at`    INT NULL,
    `created_at`      INT NOT NULL,
    `finished_at`     INT NULL
);

CREATE TABLE `failed_jobs` (
    `id`         BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `uuid`       VARCHAR(255) NOT NULL UNIQUE,
    `connection` TEXT NOT NULL,
    `queue`      TEXT NOT NULL,
    `payload`    LONGTEXT NOT NULL,
    `exception`  LONGTEXT NOT NULL,
    `failed_at`  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    INDEX (`connection`(191), `queue`(191), `failed_at`)
);


-- -----------------------------------------------------------------------------
-- NEW TABLES (created by our migrations)
-- -----------------------------------------------------------------------------

CREATE TABLE `job_applications` (
    `id`           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`      BIGINT UNSIGNED NOT NULL,
    `company_name` VARCHAR(255) NOT NULL,
    `role`         VARCHAR(255) NOT NULL,
    `type`         ENUM('government', 'corporate', 'startup') NOT NULL,
    `source`       ENUM('linkedin', 'naukri', 'indeed', 'referral', 'careers_page', 'other') NOT NULL,
    `applied_date` DATE NOT NULL,
    `status`       ENUM('applied', 'shortlisted', 'interview', 'offer', 'rejected', 'withdrawn', 'ghosted') NOT NULL DEFAULT 'applied',
    `created_at`   TIMESTAMP NULL,
    `updated_at`   TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    INDEX (`user_id`),
    INDEX (`applied_date`),
    INDEX (`status`),
    INDEX (`source`)
);

CREATE TABLE `job_application_comments` (
    `id`                 BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `job_application_id` BIGINT UNSIGNED NOT NULL,
    `comment`            TEXT NOT NULL,
    `created_at`         TIMESTAMP NULL,
    `updated_at`         TIMESTAMP NULL,
    FOREIGN KEY (`job_application_id`) REFERENCES `job_applications`(`id`) ON DELETE CASCADE,
    INDEX (`job_application_id`)
);

-- One row per user per day
-- Tracks: application counts, study hours, interview calls, profile update booleans
CREATE TABLE `daily_logs` (
    `id`                   BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    `user_id`              BIGINT UNSIGNED NOT NULL,
    `date`                 DATE NOT NULL,
    -- Activity counts
    `study_hours`          DECIMAL(4,2) NOT NULL DEFAULT 0.00,
    `interview_calls`      TINYINT UNSIGNED NOT NULL DEFAULT 0,
    -- Application counts per platform
    `linkedin_applications` SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `naukri_applications`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    `indeed_applications`   SMALLINT UNSIGNED NOT NULL DEFAULT 0,
    -- Daily profile update checklist
    `linkedin_updated`     BOOLEAN NOT NULL DEFAULT FALSE,
    `naukri_updated`       BOOLEAN NOT NULL DEFAULT FALSE,
    `github_updated`       BOOLEAN NOT NULL DEFAULT FALSE,
    `indeed_updated`       BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at`           TIMESTAMP NULL,
    `updated_at`           TIMESTAMP NULL,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    UNIQUE KEY `daily_logs_user_date_unique` (`user_id`, `date`),
    INDEX (`date`)
);
