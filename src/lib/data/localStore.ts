import fs from 'fs';
import path from 'path';
import { isSupabaseConfigured } from '@/lib/supabase/admin';
import type {
  Profile,
  Assessment,
  Question,
  PrivateQuestionConfig,
  AssessmentAttempt,
  CandidateAnswer,
  IntegrityEvent,
  AiEvaluation,
  ManualScoreOverride,
  AdminAuditLog,
  DivisionType,
  CodeExecution,
} from '@/types/database';

export class DatabaseConfigurationError extends Error {
  constructor(message = 'Production database configuration missing: Supabase credentials are required in production.') {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

export function isProductionEnvironment(): boolean {
  return process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';
}

export function assertPersistenceConfigured(): void {
  if (isProductionEnvironment() && !isSupabaseConfigured()) {
    throw new DatabaseConfigurationError(
      'PERSISTENCE_ERROR: Supabase database is not configured in production. Local JSON fallback is strictly forbidden in production.'
    );
  }
}

export interface DatabaseSchema {
  profiles: Profile[];
  assessments: Assessment[];
  questions: Question[];
  private_configs: PrivateQuestionConfig[];
  attempts: AssessmentAttempt[];
  answers: CandidateAnswer[];
  integrity_events: IntegrityEvent[];
  ai_evaluations: AiEvaluation[];
  score_overrides: ManualScoreOverride[];
  audit_logs: AdminAuditLog[];
  code_executions: CodeExecution[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

const defaultAssessments: Assessment[] = [
  {
    id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    title: 'ICPC INC 2026 - Problem Analysis Assessment',
    duration_minutes: 180,
    is_published: false,
    min_questions: 3,
    max_questions: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    title: 'ICPC INC 2026 - Algorithm Builder Assessment',
    duration_minutes: 180,
    is_published: false,
    min_questions: 3,
    max_questions: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'asmt-programmer',
    division: 'programmer',
    title: 'ICPC INC 2026 - Programmer Assessment',
    duration_minutes: 180,
    is_published: false,
    min_questions: 3,
    max_questions: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function getInitialDB(): DatabaseSchema {
  return {
    profiles: [],
    assessments: defaultAssessments,
    questions: [], // Question bank starts strictly empty as requested!
    private_configs: [],
    attempts: [],
    answers: [],
    integrity_events: [],
    ai_evaluations: [],
    score_overrides: [],
    audit_logs: [],
    code_executions: [],
  };
}

export function readLocalDB(): DatabaseSchema {
  assertPersistenceConfigured();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DATA_FILE)) {
      const initial = getInitialDB();
      fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2), 'utf-8');
      return initial;
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return JSON.parse(raw) as DatabaseSchema;
  } catch (err) {
    if (err instanceof DatabaseConfigurationError) {
      throw err;
    }
    console.error('Error reading local DB, using initial state:', err);
    return getInitialDB();
  }
}

export function writeLocalDB(data: DatabaseSchema): void {
  assertPersistenceConfigured();
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    if (err instanceof DatabaseConfigurationError) {
      throw err;
    }
    console.error('Error writing local DB:', err);
  }
}
