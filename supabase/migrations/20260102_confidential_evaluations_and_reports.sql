-- ==============================================================================
-- INC 2026 Candidate Assessment Platform - Confidential Evaluations & Reports
-- Migration: 20260102_confidential_evaluations_and_reports.sql
-- ==============================================================================

-- 1. Extend Assessments Table with Global Closing Deadline & Publication Flag
ALTER TABLE public.assessments
    ADD COLUMN IF NOT EXISTS global_closing_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS is_results_published BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS results_published_at TIMESTAMPTZ;

-- 2. Extend AI Evaluations Table with Admin Approval & Review Fields
ALTER TABLE public.ai_evaluations
    ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS approved_by TEXT,
    ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS approved_score NUMERIC(5,2),
    ADD COLUMN IF NOT EXISTS review_notes TEXT;

-- 3. Persistent Evaluation Jobs Queue Table
CREATE TABLE IF NOT EXISTS public.evaluation_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed, requires_review
    retry_count INTEGER NOT NULL DEFAULT 0,
    last_error TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_job_per_attempt_question UNIQUE (attempt_id, question_id)
);

-- 4. Confidential Consolidated Reports Table
CREATE TABLE IF NOT EXISTS public.confidential_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
    status TEXT NOT NULL DEFAULT 'pending', -- pending, generating, ready, notification_sent, failed
    pdf_storage_path TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    email_status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, unconfigured
    email_sent_at TIMESTAMPTZ,
    email_recipient TEXT,
    email_error TEXT,
    total_candidates INTEGER NOT NULL DEFAULT 0,
    reviewed_count INTEGER NOT NULL DEFAULT 0,
    unresolved_count INTEGER NOT NULL DEFAULT 0,
    summary_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_assessment_version UNIQUE (assessment_id, version)
);

-- 5. Indexes for Fast Queue Processing & Report Lookups
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_status ON public.evaluation_jobs(status);
CREATE INDEX IF NOT EXISTS idx_evaluation_jobs_attempt_id ON public.evaluation_jobs(attempt_id);
CREATE INDEX IF NOT EXISTS idx_confidential_reports_assessment_id ON public.confidential_reports(assessment_id);
CREATE INDEX IF NOT EXISTS idx_assessments_global_closing_at ON public.assessments(global_closing_at);

-- 6. Storage Bucket for Private Admin Reports
INSERT INTO storage.buckets (id, name, public)
VALUES ('admin-reports', 'admin-reports', FALSE)
ON CONFLICT (id) DO NOTHING;

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.evaluation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.confidential_reports ENABLE ROW LEVEL SECURITY;

-- Note: Candidates have ZERO access to evaluation_jobs and confidential_reports.
-- Service-role client bypasses RLS for administrative and pipeline operations.
