-- ─────────────────────────────────────────────────────────────────────────────
-- Apex Fitness — MySQL 8 / MariaDB 10.4+ schema
--
-- Import in phpMyAdmin: create database `apex_fitness` (utf8mb4_unicode_ci),
-- select it, Import → schema.sql, then Import → seed.sql.
--
-- Dates are stored as DATE in gym-local time (Asia/Kolkata). Membership rules:
--   expiry_date    = start_date + duration_days
--   days_remaining = expiry_date − today   (0 or less → expired)
-- ─────────────────────────────────────────────────────────────────────────────

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ── Members & staff ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id                 INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name               VARCHAR(120) NOT NULL,
  email              VARCHAR(190) NOT NULL,
  phone              VARCHAR(20)  NULL,
  password_hash      VARCHAR(255) NOT NULL,
  role               ENUM('member','admin') NOT NULL DEFAULT 'member',
  date_of_birth      DATE NULL,
  gender             ENUM('male','female','other','prefer_not') NULL,
  address            VARCHAR(500) NULL,
  -- Answer to "Have you already purchased an Apex Fitness membership?"
  onboarding_status  ENUM('pending','member','not_member') NOT NULL DEFAULT 'pending',
  email_opt_in       TINYINT(1) NOT NULL DEFAULT 1,
  whatsapp_opt_in    TINYINT(1) NOT NULL DEFAULT 1,
  is_active          TINYINT(1) NOT NULL DEFAULT 1,
  notes              TEXT NULL,               -- staff-only notes
  last_login_at      DATETIME NULL,
  created_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  KEY idx_users_role (role),
  KEY idx_users_phone (phone)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Membership plans (informational — memberships are bought at the gym) ────
CREATE TABLE IF NOT EXISTS membership_plans (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  slug           VARCHAR(40)  NOT NULL,
  name           VARCHAR(80)  NOT NULL,
  duration_days  SMALLINT UNSIGNED NOT NULL,
  price          DECIMAL(10,2) NULL,          -- shown as "pay at the front desk"; NULL hides it
  tagline        VARCHAR(160) NULL,
  features       TEXT NULL,                   -- JSON array of strings
  is_featured    TINYINT(1) NOT NULL DEFAULT 0,
  is_active      TINYINT(1) NOT NULL DEFAULT 1,
  sort_order     SMALLINT NOT NULL DEFAULT 0,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plans_slug (slug)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Memberships (one row per purchase / renewal) ────────────────────────────
CREATE TABLE IF NOT EXISTS memberships (
  id                   INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id              INT UNSIGNED NOT NULL,
  plan_id              INT UNSIGNED NULL,
  plan_name            VARCHAR(80) NOT NULL,     -- snapshot, survives plan edits
  purchase_date        DATE NOT NULL,
  start_date           DATE NOT NULL,
  duration_days        SMALLINT UNSIGNED NOT NULL,
  expiry_date          DATE NOT NULL,            -- start_date + duration_days (calculated by the API)
  -- Members add their own memberships; staff confirm them against the front-desk receipt.
  verification_status  ENUM('pending','verified','rejected') NOT NULL DEFAULT 'pending',
  source               ENUM('member','admin') NOT NULL DEFAULT 'member',
  receipt_number       VARCHAR(60) NULL,
  is_cancelled         TINYINT(1) NOT NULL DEFAULT 0,
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_memberships_user (user_id, expiry_date),
  KEY idx_memberships_expiry (expiry_date),
  CONSTRAINT fk_memberships_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_memberships_plan FOREIGN KEY (plan_id) REFERENCES membership_plans (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Notifications (dashboard, email, WhatsApp) + history ────────────────────
-- The UNIQUE key (membership_id, type, channel) is what makes reminders
-- impossible to send twice: the reminder job INSERT IGNOREs a row first and
-- only dispatches when the insert actually created it.
CREATE TABLE IF NOT EXISTS notifications (
  id             INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id        INT UNSIGNED NOT NULL,
  membership_id  INT UNSIGNED NULL,
  type           ENUM('reminder_first','reminder_second','expired','membership_added','membership_verified','custom') NOT NULL,
  channel        ENUM('dashboard','email','whatsapp') NOT NULL,
  status         ENUM('pending','sent','failed','skipped') NOT NULL DEFAULT 'pending',
  title          VARCHAR(160) NOT NULL,
  message        VARCHAR(1000) NOT NULL,
  recipient      VARCHAR(190) NULL,             -- email address / phone used
  attempts       TINYINT UNSIGNED NOT NULL DEFAULT 0,
  error          VARCHAR(500) NULL,
  read_at        DATETIME NULL,                 -- dashboard channel only
  sent_at        DATETIME NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_notification_once (membership_id, type, channel),
  KEY idx_notifications_user (user_id, channel, created_at),
  KEY idx_notifications_status (status, channel),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_notifications_membership FOREIGN KEY (membership_id) REFERENCES memberships (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Contact form ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS contact_messages (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id     INT UNSIGNED NULL,
  name        VARCHAR(120) NOT NULL,
  email       VARCHAR(190) NOT NULL,
  phone       VARCHAR(20)  NULL,
  topic       VARCHAR(60)  NOT NULL DEFAULT 'general',
  message     TEXT NOT NULL,
  status      ENUM('new','handled') NOT NULL DEFAULT 'new',
  ip_address  VARCHAR(45) NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_contact_status (status, created_at),
  CONSTRAINT fk_contact_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Gym settings (key → value, editable in /admin/settings) ─────────────────
CREATE TABLE IF NOT EXISTS settings (
  setting_key    VARCHAR(80) NOT NULL,
  setting_value  TEXT NULL,
  updated_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (setting_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Login / form rate limiting ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rate_limits (
  bucket      VARCHAR(120) NOT NULL,
  hits        INT UNSIGNED NOT NULL DEFAULT 0,
  window_end  DATETIME NOT NULL,
  PRIMARY KEY (bucket),
  KEY idx_rate_window (window_end)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
