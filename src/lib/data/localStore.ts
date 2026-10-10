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
  CodeExecution,
  EvaluationJob,
  ConfidentialReport,
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
  evaluation_jobs: EvaluationJob[];
  confidential_reports: ConfidentialReport[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'local_db.json');

import {
  defaultAssessments,
  seedQuestions,
  seedPrivateConfigs,
} from '@/lib/data/questionBankSeed';

function getInitialDB(): DatabaseSchema {
  return {
    profiles: [],
    assessments: defaultAssessments,
    questions: seedQuestions,
    private_configs: seedPrivateConfigs,
    attempts: [],
    answers: [],
    integrity_events: [],
    ai_evaluations: [],
    score_overrides: [],
    audit_logs: [],
    code_executions: [],
    evaluation_jobs: [],
    confidential_reports: [],
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
    const parsed = JSON.parse(raw) as DatabaseSchema;
    parsed.evaluation_jobs ||= [];
    parsed.confidential_reports ||= [];
    return parsed;
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
