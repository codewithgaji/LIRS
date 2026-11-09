-- ============================================================
-- LIRS Correspondence Register Management System
-- MySQL 8.0 schema
-- Usage: mysql -u root -p < database/schema.sql
-- ============================================================

DROP DATABASE IF EXISTS lirs_register;
CREATE DATABASE lirs_register CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE lirs_register;

-- ----------------------------------------------------------
-- Departments
-- ----------------------------------------------------------
CREATE TABLE departments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    name        VARCHAR(120) NOT NULL UNIQUE,
    code        VARCHAR(16)  NOT NULL UNIQUE,
    created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------
-- Staff accounts. Roles drive every permission in the system.
-- ----------------------------------------------------------
CREATE TABLE users (
    id             INT AUTO_INCREMENT PRIMARY KEY,
    full_name      VARCHAR(160) NOT NULL,
    email          VARCHAR(160) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,           -- bcrypt
    role           ENUM('admin_officer','station_manager','account_officer')
                       NOT NULL DEFAULT 'account_officer',
    department_id  INT NULL,
    station        VARCHAR(120) NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
                       ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_users_department FOREIGN KEY (department_id)
        REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_users_role ON users(role);

-- ----------------------------------------------------------
-- The register itself: one row per letter.
-- ----------------------------------------------------------
CREATE TABLE correspondence (
    id                  INT AUTO_INCREMENT PRIMARY KEY,
    reference_number    VARCHAR(40)  NOT NULL UNIQUE,   -- LIRS/COR/2026/0001
    direction           ENUM('incoming','outgoing') NOT NULL DEFAULT 'incoming',
    date_received       DATE         NOT NULL,
    letter_title        VARCHAR(255) NOT NULL,
    company_name        VARCHAR(180) NOT NULL,
    contact_phone       VARCHAR(40)  NULL,
    priority            ENUM('low','normal','high','urgent') NOT NULL DEFAULT 'normal',
    status              ENUM('pending','assigned','under_review','responded','closed','returned')
                            NOT NULL DEFAULT 'pending',
    admin_officer_id    INT NULL,
    station_manager_id  INT NULL,
    account_officer_id  INT NULL,
    department_id       INT NULL,
    remarks             TEXT NULL,
    created_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
                            ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_corr_admin   FOREIGN KEY (admin_officer_id)   REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_manager FOREIGN KEY (station_manager_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_officer FOREIGN KEY (account_officer_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_corr_dept    FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_correspondence_status        ON correspondence(status);
CREATE INDEX ix_correspondence_date_received ON correspondence(date_received);
CREATE INDEX ix_correspondence_company       ON correspondence(company_name);

-- ----------------------------------------------------------
-- Append-only audit trail of every status change.
-- ----------------------------------------------------------
CREATE TABLE correspondence_status_history (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    correspondence_id  INT NOT NULL,
    old_status         ENUM('pending','assigned','under_review','responded','closed','returned') NULL,
    new_status         ENUM('pending','assigned','under_review','responded','closed','returned') NOT NULL,
    changed_by         INT NULL,
    notes              TEXT NULL,
    changed_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_corr FOREIGN KEY (correspondence_id)
        REFERENCES correspondence(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_user FOREIGN KEY (changed_by)
        REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE INDEX ix_history_correspondence ON correspondence_status_history(correspondence_id);

-- ----------------------------------------------------------
-- Trigger: log the first entry when a letter is registered.
-- ----------------------------------------------------------
DELIMITER $$
CREATE TRIGGER trg_correspondence_insert
AFTER INSERT ON correspondence
FOR EACH ROW
BEGIN
    INSERT INTO correspondence_status_history
        (correspondence_id, old_status, new_status, changed_by, notes)
    VALUES (NEW.id, NULL, NEW.status, NEW.admin_officer_id, 'Letter registered');
END$$

-- Trigger: log every subsequent status change automatically.
CREATE TRIGGER trg_correspondence_status_update
AFTER UPDATE ON correspondence
FOR EACH ROW
BEGIN
    IF NEW.status <> OLD.status THEN
        INSERT INTO correspondence_status_history
            (correspondence_id, old_status, new_status, changed_by, notes)
        VALUES (NEW.id, OLD.status, NEW.status, NEW.station_manager_id, 'Status updated');
    END IF;
END$$
DELIMITER ;

-- ----------------------------------------------------------
-- Convenience view used by the reporting screens.
-- ----------------------------------------------------------
CREATE VIEW v_correspondence_full AS
SELECT c.id,
       c.reference_number,
       c.direction,
       c.date_received,
       c.letter_title,
       c.company_name,
       c.priority,
       c.status,
       d.name AS department_name,
       ao.full_name AS account_officer_name,
       sm.full_name AS station_manager_name
FROM correspondence c
LEFT JOIN departments d ON d.id = c.department_id
LEFT JOIN users ao ON ao.id = c.account_officer_id
LEFT JOIN users sm ON sm.id = c.station_manager_id;
