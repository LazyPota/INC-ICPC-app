export type DivisionType = 'problem_analysis' | 'algorithm_builder' | 'programmer';

export type QuestionType =
  | 'multiple_choice'
  | 'short_answer'
  | 'long_answer'
  | 'pseudocode'
  | 'cpp_code';

export type AttemptStatus =
  | 'in_progress'
  | 'submitted'
  | 'expired'
  | 'grading_pending'
  | 'grading_completed';

export type EventSeverity = 'low' | 'medium' | 'high';

export type EvalStatus = 'pending' | 'completed' | 'failed' | 'needs_review';

export interface Profile {
  id: string;
  full_name: string;
  student_email: string;
  intended_division: DivisionType;
  created_at: string;
  updated_at: string;
}

export interface Assessment {
  id: string;
  division: DivisionType;
  title: string;
  duration_minutes: number;
  is_published: boolean;
  min_questions: number;
  max_questions: number;
  created_at: string;
  updated_at: string;
}

export interface QuestionOption {
  id: string;
  text: string;
}

export interface QuestionExample {
  input: string;
  output: string;
  explanation?: string;
}

export interface Question {
  id: string;
  assessment_id: string;
  division: DivisionType;
  order_index: number;
  title: string;
  statement: string;
  question_type: QuestionType;
  max_score: number;
  is_enabled: boolean;
  constraints?: string | null;
  examples?: QuestionExample[];
  options?: QuestionOption[];
  created_at: string;
  updated_at: string;
}

export interface RubricCriterion {
  id: string;
  criterion: string;
  max_score: number;
  description: string;
}

export interface TestCase {
  id: string;
  input: string;
  expected_output: string;
  is_hidden: boolean;
}

export interface PrivateQuestionConfig {
  id: string;
  question_id: string;
  reference_answer?: string | null;
  grading_rubric: RubricCriterion[];
  test_cases?: TestCase[];
  created_at: string;
  updated_at: string;
}

export interface AssessmentAttempt {
  id: string;
  candidate_id: string;
  assessment_id: string;
  started_at: string;
  deadline_at: string;
  submitted_at?: string | null;
  status: AttemptStatus;
  active_session_id: string;
  last_heartbeat_at: string;
  created_at: string;
  updated_at: string;
}

export interface CandidateAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  answer_content?: string | null;
  selected_option?: string | null;
  code_content?: string | null;
  version: number;
  saved_at: string;
  is_final: boolean;
}

export interface IntegrityEvent {
  id: string;
  attempt_id: string;
  candidate_id: string;
  session_id: string;
  event_type: string;
  severity: EventSeverity;
  metadata: Record<string, unknown>;
  question_id?: string | null;
  created_at: string;
}

export interface CriterionScoreResult {
  criterion_id?: string;
  criterion?: string;
  max_score?: number;
  awarded_score?: number;
  maximum_points?: number;
  awarded_points?: number;
  rationale: string;
  evidence: string;
}

export interface AiEvaluation {
  id: string;
  attempt_id: string;
  question_id: string;
  model_name: string;
  rubric_version: string;
  prompt_version: string;
  status: EvalStatus;
  criterion_scores: CriterionScoreResult[];
  total_score: number;
  confidence: number;
  evidence?: string | null;
  rationale?: string | null;
  flags: string[];
  error_message?: string | null;
  retry_count: number;
  evaluated_at: string;
}

export interface ManualScoreOverride {
  id: string;
  attempt_id: string;
  question_id: string;
  admin_email: string;
  original_score: number;
  override_score: number;
  reason: string;
  created_at: string;
}

export interface AdminAuditLog {
  id: string;
  admin_email: string;
  action: string;
  target_type: string;
  target_id?: string | null;
  details: Record<string, unknown>;
  ip_address?: string | null;
  created_at: string;
}

export interface CodeExecution {
  id: string;
  attempt_id: string;
  question_id: string;
  status: string;
  passed_tests: number;
  total_tests: number;
  test_results: unknown[];
  compile_output?: string | null;
  created_at: string;
}
