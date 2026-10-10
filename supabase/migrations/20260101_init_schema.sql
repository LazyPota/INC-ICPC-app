-- ==============================================================================
-- INC 2026 Candidate Assessment Platform - Database Schema & Security Migration
-- Target: Supabase PostgreSQL
-- ==============================================================================

-- 1. Create Enums
CREATE TYPE division_type AS ENUM ('problem_analysis', 'algorithm_builder', 'programmer');
CREATE TYPE question_type_enum AS ENUM ('multiple_choice', 'short_answer', 'long_answer', 'pseudocode', 'cpp_code');
CREATE TYPE attempt_status_enum AS ENUM ('in_progress', 'submitted', 'expired', 'grading_pending', 'grading_completed');
CREATE TYPE event_severity_enum AS ENUM ('low', 'medium', 'high');
CREATE TYPE eval_status_enum AS ENUM ('pending', 'completed', 'failed', 'needs_review');

-- 2. Profiles Table (Extends Supabase Auth or Standalone)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    student_email TEXT UNIQUE NOT NULL,
    intended_division division_type NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT valid_institutional_email CHECK (student_email ~* '^[a-zA-Z0-9._%+-]+@student\.president\.ac\.id$'),
    CONSTRAINT name_length CHECK (char_length(trim(full_name)) >= 2 AND char_length(trim(full_name)) <= 150)
);

-- 3. Assessments Table
CREATE TABLE IF NOT EXISTS public.assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    division division_type UNIQUE NOT NULL,
    title TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 180,
    is_published BOOLEAN NOT NULL DEFAULT FALSE,
    min_questions INTEGER NOT NULL DEFAULT 3,
    max_questions INTEGER NOT NULL DEFAULT 5,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Questions Table (Candidate-Facing Content)
CREATE TABLE IF NOT EXISTS public.questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
    division division_type NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    statement TEXT NOT NULL,
    question_type question_type_enum NOT NULL,
    max_score NUMERIC(5,2) NOT NULL DEFAULT 100.00,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    constraints TEXT,
    examples JSONB DEFAULT '[]'::jsonb,
    options JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_order_per_assessment UNIQUE (assessment_id, order_index)
);

-- 5. Private Question Configurations (Strict Admin Only - Hidden Keys & Rubrics)
CREATE TABLE IF NOT EXISTS public.private_question_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID UNIQUE NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    reference_answer TEXT,
    grading_rubric JSONB NOT NULL DEFAULT '[]'::jsonb,
    test_cases JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 6. Assessment Attempts Table
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE RESTRICT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    deadline_at TIMESTAMPTZ NOT NULL,
    submitted_at TIMESTAMPTZ,
    status attempt_status_enum NOT NULL DEFAULT 'in_progress',
    active_session_id TEXT NOT NULL,
    last_heartbeat_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT one_attempt_per_candidate_assessment UNIQUE (candidate_id, assessment_id)
);

-- 7. Candidate Answers Table
CREATE TABLE IF NOT EXISTS public.candidate_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    answer_content TEXT,
    selected_option TEXT,
    code_content TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    is_final BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT unique_answer_per_attempt_question UNIQUE (attempt_id, question_id)
);

-- 8. Integrity Events Table
CREATE TABLE IF NOT EXISTS public.integrity_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity event_severity_enum NOT NULL DEFAULT 'low',
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    question_id UUID REFERENCES public.questions(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 9. AI Evaluations Table
CREATE TABLE IF NOT EXISTS public.ai_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    model_name TEXT NOT NULL,
    rubric_version TEXT NOT NULL DEFAULT 'v1',
    prompt_version TEXT NOT NULL DEFAULT 'v1',
    status eval_status_enum NOT NULL DEFAULT 'pending',
    criterion_scores JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_score NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    confidence NUMERIC(3,2) NOT NULL DEFAULT 1.00,
    evidence TEXT,
    rationale TEXT,
    flags JSONB NOT NULL DEFAULT '[]'::jsonb,
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT unique_evaluation_per_attempt_question UNIQUE (attempt_id, question_id)
);

-- 10. Manual Score Overrides Table
CREATE TABLE IF NOT EXISTS public.manual_score_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    admin_email TEXT NOT NULL,
    original_score NUMERIC(5,2) NOT NULL,
    override_score NUMERIC(5,2) NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 11. Code Sandbox Execution Results Table
CREATE TABLE IF NOT EXISTS public.code_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    attempt_id UUID NOT NULL REFERENCES public.assessment_attempts(id) ON DELETE CASCADE,
    question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    passed_tests INTEGER NOT NULL DEFAULT 0,
    total_tests INTEGER NOT NULL DEFAULT 0,
    test_results JSONB DEFAULT '[]'::jsonb,
    compile_output TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 12. Administrative Audit Logs Table
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_email TEXT NOT NULL,
    action TEXT NOT NULL,
    target_type TEXT NOT NULL,
    target_id TEXT,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- Indexes for High Performance
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_student_email ON public.profiles(student_email);
CREATE INDEX IF NOT EXISTS idx_questions_assessment_id ON public.questions(assessment_id);
CREATE INDEX IF NOT EXISTS idx_questions_division ON public.questions(division);
CREATE INDEX IF NOT EXISTS idx_attempts_candidate_id ON public.assessment_attempts(candidate_id);
CREATE INDEX IF NOT EXISTS idx_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_answers_attempt_id ON public.candidate_answers(attempt_id);
CREATE INDEX IF NOT EXISTS idx_integrity_attempt_id ON public.integrity_events(attempt_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_attempt_id ON public.ai_evaluations(attempt_id);

-- ==============================================================================
-- Initial Assessments Setup (Default 3 Divisions)
-- ==============================================================================
INSERT INTO public.assessments (division, title, duration_minutes, is_published, min_questions, max_questions)
VALUES 
    ('problem_analysis', 'ICPC INC 2026 - Problem Analysis Assessment', 180, FALSE, 3, 5),
    ('algorithm_builder', 'ICPC INC 2026 - Algorithm Builder Assessment', 180, FALSE, 3, 5),
    ('programmer', 'ICPC INC 2026 - Programmer Assessment', 180, FALSE, 3, 5)
ON CONFLICT (division) DO NOTHING;

-- ==============================================================================
-- Row Level Security (RLS) Configuration
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_question_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.candidate_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integrity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.manual_score_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is an authenticated candidate
CREATE OR REPLACE FUNCTION public.current_candidate_id()
RETURNS UUID AS $$
    SELECT auth.uid();
$$ LANGUAGE sql STABLE;

-- Profiles Policies
CREATE POLICY "Users can view own profile" 
    ON public.profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY "Users can update own profile before attempt" 
    ON public.profiles FOR UPDATE 
    USING (auth.uid() = id AND NOT EXISTS (
        SELECT 1 FROM public.assessment_attempts WHERE candidate_id = auth.uid()
    ));

-- Assessments Policies (Only published assessments visible to authenticated candidates matching division)
CREATE POLICY "Candidates view matching published assessment" 
    ON public.assessments FOR SELECT 
    USING (
        is_published = TRUE AND division = (
            SELECT intended_division FROM public.profiles WHERE id = auth.uid()
        )
    );

-- Questions Policies (Candidates can only see enabled questions for their matching assessment)
CREATE POLICY "Candidates view active division questions" 
    ON public.questions FOR SELECT 
    USING (
        is_enabled = TRUE AND EXISTS (
            SELECT 1 FROM public.assessment_attempts a
            WHERE a.candidate_id = auth.uid() 
              AND a.assessment_id = questions.assessment_id
              AND (a.status = 'in_progress' OR a.status = 'submitted')
        )
    );

-- Private Question Configs (ZERO ACCESS FOR CANDIDATES - STRICTLY ADMIN/SERVICE ROLE)
-- No candidate policy exists on private_question_configs!

-- Assessment Attempts Policies
CREATE POLICY "Candidates view own attempts" 
    ON public.assessment_attempts FOR SELECT 
    USING (candidate_id = auth.uid());

CREATE POLICY "Candidates update own attempt heartbeat/session" 
    ON public.assessment_attempts FOR UPDATE 
    USING (candidate_id = auth.uid() AND status = 'in_progress');

-- Candidate Answers Policies
CREATE POLICY "Candidates view own answers" 
    ON public.candidate_answers FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM public.assessment_attempts a 
        WHERE a.id = candidate_answers.attempt_id AND a.candidate_id = auth.uid()
    ));

CREATE POLICY "Candidates insert and update own answers while active" 
    ON public.candidate_answers FOR ALL 
    USING (EXISTS (
        SELECT 1 FROM public.assessment_attempts a 
        WHERE a.id = candidate_answers.attempt_id 
          AND a.candidate_id = auth.uid() 
          AND a.status = 'in_progress'
          AND timezone('utc'::text, now()) < a.deadline_at
    ));

-- Integrity Events Policies
CREATE POLICY "Candidates can insert integrity events for own attempt" 
    ON public.integrity_events FOR INSERT 
    WITH CHECK (
        candidate_id = auth.uid() AND EXISTS (
            SELECT 1 FROM public.assessment_attempts a
            WHERE a.id = integrity_events.attempt_id AND a.candidate_id = auth.uid()
        )
    );

-- ==============================================================================
-- Automatic Profile Synchronization on auth.users Signup
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, student_email, intended_division)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE((new.raw_user_meta_data->>'intended_division')::public.division_type, 'problem_analysis'::public.division_type)
  )
  ON CONFLICT (id) DO UPDATE SET
    student_email = EXCLUDED.student_email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    updated_at = timezone('utc'::text, now());
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper to verify email verification status
CREATE OR REPLACE FUNCTION public.is_email_verified(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT (email_confirmed_at IS NOT NULL) FROM auth.users WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Service role bypasses RLS automatically in Supabase for all administrative tasks.
