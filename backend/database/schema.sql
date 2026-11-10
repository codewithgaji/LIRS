-- LIRS Correspondence Register, PostgreSQL schema
-- create the database lirs_register in pgAdmin first, then open the Query Tool on it and run this file
-- use this OR alembic upgrade head, not both (they build the same tables)
-- no triggers here on purpose: the api writes the status history itself, triggers would double it

CREATE TABLE departments (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(120) NOT NULL UNIQUE,
    code        VARCHAR(16)  NOT NULL UNIQUE,
    created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- staff accounts, the role drives every permission
CREATE TABLE users (
    id             SERIAL PRIMARY KEY,
    full_name      VARCHAR(160) NOT NULL,
    email          VARCHAR(160) NOT NULL UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    role           VARCHAR(32)  NOT NULL DEFAULT 'account_officer'
                       CHECK (role IN ('admin_officer','station_manager','account_officer')),
    department_id  INT NULL REFERENCES departments(id) ON DELETE SET NULL,
    station        VARCHAR(120) NULL,
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_users_role ON users(role);

-- the register itself, one row per letter
CREATE TABLE correspondence (
    id                  SERIAL PRIMARY KEY,
    reference_number    VARCHAR(40)  NOT NULL UNIQUE,
    direction           VARCHAR(16)  NOT NULL DEFAULT 'incoming'
                            CHECK (direction IN ('incoming','outgoing')),
    date_received       DATE         NOT NULL,
    letter_title        VARCHAR(255) NOT NULL,
    company_name        VARCHAR(180) NOT NULL,
    contact_phone       VARCHAR(40)  NULL,
    priority            VARCHAR(16)  NOT NULL DEFAULT 'normal'
                            CHECK (priority IN ('low','normal','high','urgent')),
    status              VARCHAR(20)  NOT NULL DEFAULT 'pending'
                            CHECK (status IN ('pending','assigned','under_review','responded','closed','returned')),
    admin_officer_id    INT NULL REFERENCES users(id) ON DELETE SET NULL,
    station_manager_id  INT NULL REFERENCES users(id) ON DELETE SET NULL,
    account_officer_id  INT NULL REFERENCES users(id) ON DELETE SET NULL,
    department_id       INT NULL REFERENCES departments(id) ON DELETE SET NULL,
    remarks             TEXT NULL,
    created_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_correspondence_status        ON correspondence(status);
CREATE INDEX ix_correspondence_date_received ON correspondence(date_received);
CREATE INDEX ix_correspondence_company       ON correspondence(company_name);

-- audit trail of every status change
CREATE TABLE correspondence_status_history (
    id                 SERIAL PRIMARY KEY,
    correspondence_id  INT NOT NULL REFERENCES correspondence(id) ON DELETE CASCADE,
    old_status         VARCHAR(20) NULL
                           CHECK (old_status IN ('pending','assigned','under_review','responded','closed','returned')),
    new_status         VARCHAR(20) NOT NULL
                           CHECK (new_status IN ('pending','assigned','under_review','responded','closed','returned')),
    changed_by         INT NULL REFERENCES users(id) ON DELETE SET NULL,
    notes              TEXT NULL,
    changed_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX ix_history_correspondence ON correspondence_status_history(correspondence_id);

-- view used by the reporting screens and the database panel
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
