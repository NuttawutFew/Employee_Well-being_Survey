-- PostgreSQL Schema for Mental Health Assessment System

-- 1. Assessment Attempts
CREATE TABLE IF NOT EXISTS assessment_attempts (
    attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    employee_id VARCHAR(100) NOT NULL,
    definition_bundle_version VARCHAR(50) NOT NULL DEFAULT '1.0.0',
    status VARCHAR(20) NOT NULL CHECK (status IN ('DRAFT', 'SUBMITTED', 'CANCELLED')),
    current_step_index INT NOT NULL DEFAULT 0,
    notice_version VARCHAR(50),
    notice_acknowledged_at TIMESTAMPTZ,
    answers JSONB NOT NULL DEFAULT '{}'::jsonb,
    result JSONB,
    snapshot JSONB,
    submitted_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancelled_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Invariant 1: At most one Submitted (and not Cancelled) attempt per employeeId across system lifetime (ADR-0007)
CREATE UNIQUE INDEX IF NOT EXISTS uq_submitted_attempt_per_employee 
ON assessment_attempts (employee_id) 
WHERE status = 'SUBMITTED';

-- Invariant 2: At most one active Draft per employeeId (ADR-0007)
CREATE UNIQUE INDEX IF NOT EXISTS uq_draft_attempt_per_employee 
ON assessment_attempts (employee_id) 
WHERE status = 'DRAFT';

-- 2. Admin Accounts
CREATE TABLE IF NOT EXISTS admin_accounts (
    admin_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'admin',
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'locked', 'disabled')),
    failed_login_attempts INT NOT NULL DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Admin Resets
CREATE TABLE IF NOT EXISTS admin_resets (
    reset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cancelled_attempt_id UUID NOT NULL REFERENCES assessment_attempts(attempt_id),
    replacement_attempt_id UUID REFERENCES assessment_attempts(attempt_id),
    actor_username VARCHAR(100) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Audit Events
CREATE TABLE IF NOT EXISTS audit_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    target VARCHAR(100),
    context JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
