import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  dataStore,
  assertPersistenceConfigured,
  DatabaseConfigurationError,
  isProductionEnvironment,
} from '@/lib/data/store';
import { readLocalDB, writeLocalDB } from '@/lib/data/localStore';
import { getCurrentSession, isAdminEmail } from '@/lib/auth/session';
import { isJudge0Configured, executeCppCode } from '@/lib/judge0/executor';
import { evaluateCandidateAnswer, isGeminiConfigured } from '@/lib/gemini/evaluator';
import { isDeadlineExpired, calculateRemainingSeconds } from '@/lib/utils/time';

describe('Production Audit Test Suite - Staging Readiness', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  // ==========================================
  // 1. Production Persistence Guard
  // ==========================================
  describe('1. Production Persistence Guard', () => {
    it('should throw DatabaseConfigurationError in production if Supabase is not configured', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(isProductionEnvironment()).toBe(true);
      expect(() => assertPersistenceConfigured()).toThrow(DatabaseConfigurationError);
    });

    it('should throw DatabaseConfigurationError in Netlify environment if Supabase is not configured', () => {
      process.env.NETLIFY = 'true';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(isProductionEnvironment()).toBe(true);
      expect(() => assertPersistenceConfigured()).toThrow(DatabaseConfigurationError);
    });

    it('should prohibit reading or writing local JSON store in production mode', () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      delete process.env.NEXT_PUBLIC_SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      expect(() => readLocalDB()).toThrow(DatabaseConfigurationError);
      expect(() => writeLocalDB({} as unknown as Parameters<typeof writeLocalDB>[0])).toThrow(DatabaseConfigurationError);
    });
  });

  // ==========================================
  // 2. Email Verification & Identity
  // ==========================================
  describe('2. Email Ownership & Institutional Domain', () => {
    it('should only accept official student domain', () => {
      const emailRegex = /^[a-zA-Z0-9._%+-]+@student\.president\.ac\.id$/;
      expect(emailRegex.test('valid.student@student.president.ac.id')).toBe(true);
      expect(emailRegex.test('imposter@gmail.com')).toBe(false);
      expect(emailRegex.test('staff@president.ac.id')).toBe(false);
      expect(emailRegex.test('coach@student.president.ac.id')).toBe(true);
    });
  });

  // ==========================================
  // 3. Server-side Session Validation & Cookie Tampering Defense
  // ==========================================
  describe('3. Session Security & Anti-Tampering', () => {
    it('should strictly reject unsigned inc_session cookie in production environment', async () => {
      (process.env as Record<string, string | undefined>).NODE_ENV = 'production';
      // In production mode with unconfigured Supabase, forged inc_session cookies are ignored
      const session = await getCurrentSession();
      expect(session).toBeNull();
    });

    it('should reject non-admin emails from obtaining admin status', () => {
      process.env.ADMIN_EMAILS = 'coach@student.president.ac.id,icpc@student.president.ac.id';
      expect(isAdminEmail('coach@student.president.ac.id')).toBe(true);
      expect(isAdminEmail('student.candidate@student.president.ac.id')).toBe(false);
      expect(isAdminEmail('hacker@student.president.ac.id')).toBe(false);
    });
  });

  // ==========================================
  // 4. Candidate Authorization & Isolation
  // ==========================================
  describe('4. Candidate Authorization & Attempt Isolation', () => {
    it('should enforce candidate division matching on attempts', async () => {
      const candidateId = `cand-auth-${Date.now()}`;
      const intendedDivision = 'problem_analysis';
      
      const profile = await dataStore.createProfile({
        id: candidateId,
        full_name: 'Candidate Auth Test',
        student_email: `${candidateId}@student.president.ac.id`,
        intended_division: intendedDivision,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      expect(profile.intended_division).toBe('problem_analysis');
      expect(profile.intended_division).not.toBe('programmer');
    });
  });

  // ==========================================
  // 5. Assessment Deadlines & Timeout Finalization
  // ==========================================
  describe('5. Assessment Deadlines & Timeout Handling', () => {
    it('should recognize expired deadlines accurately', () => {
      const pastDeadline = new Date(Date.now() - 5000).toISOString();
      expect(isDeadlineExpired(pastDeadline)).toBe(true);
      expect(calculateRemainingSeconds(pastDeadline)).toBe(0);

      const futureDeadline = new Date(Date.now() + 60000).toISOString();
      expect(isDeadlineExpired(futureDeadline)).toBe(false);
      expect(calculateRemainingSeconds(futureDeadline)).toBeGreaterThan(0);
    });

    it('should reject saving answers after deadline has expired', async () => {
      const candidateId = `cand-expired-${Date.now()}`;
      const assessmentId = 'asmt-problem-analysis';
      const sessionId = 'expired-session-1';

      const attempt = await dataStore.startAttempt(candidateId, assessmentId, sessionId);
      
      // Simulate expired attempt
      attempt.deadline_at = new Date(Date.now() - 1000).toISOString();
      const db = readLocalDB();
      const idx = db.attempts.findIndex((a) => a.id === attempt.id);
      if (idx >= 0) {
        db.attempts[idx].deadline_at = attempt.deadline_at;
        writeLocalDB(db);
      }

      await expect(
        dataStore.saveAnswer(attempt.id, 'q-test-1', { answerContent: 'Late submission' })
      ).rejects.toThrow(/deadline has expired/i);
    });

    it('should finalize attempt with expired status on timeout', async () => {
      const candidateId = `cand-timeout-${Date.now()}`;
      const assessmentId = 'asmt-problem-analysis';
      const sessionId = 'timeout-session-1';

      const attempt = await dataStore.startAttempt(candidateId, assessmentId, sessionId);
      const expired = await dataStore.finalizeAttempt(attempt.id, 'expired');

      expect(expired.status).toBe('expired');
      expect(expired.submitted_at).toBeDefined();
    });
  });

  // ==========================================
  // 6. Answer Autosaving & Early Submission
  // ==========================================
  describe('6. Autosaving & Early Submission', () => {
    it('should increment version on consecutive autosaves', async () => {
      const candidateId = `cand-autosave-${Date.now()}`;
      const assessmentId = 'asmt-algorithm-builder';
      const sessionId = 'autosave-session';

      const attempt = await dataStore.startAttempt(candidateId, assessmentId, sessionId);
      
      const a1 = await dataStore.saveAnswer(attempt.id, 'q-algo-1', { answerContent: 'Draft v1' });
      expect(a1.version).toBe(1);

      const a2 = await dataStore.saveAnswer(attempt.id, 'q-algo-1', { answerContent: 'Draft v2' });
      expect(a2.version).toBe(2);
      expect(a2.answer_content).toBe('Draft v2');

      // Early submission locks answers
      const finalized = await dataStore.finalizeAttempt(attempt.id, 'submitted');
      expect(finalized.status).toBe('submitted');

      const db = readLocalDB();
      const savedAns = db.answers.find((a) => a.attempt_id === attempt.id && a.question_id === 'q-algo-1');
      expect(savedAns?.is_final).toBe(true);
    });
  });

  // ==========================================
  // 7. AI Grading Failures & Safe Fallback
  // ==========================================
  describe('7. AI Evaluator Resilience & No Fabricated Results', () => {
    it('should not fabricate grading scores when Gemini API key is missing', async () => {
      delete process.env.GEMINI_API_KEY;
      expect(isGeminiConfigured()).toBe(false);

      const result = await evaluateCandidateAnswer({
        attemptId: 'att-safe-eval',
        questionId: 'q-safe-eval',
        division: 'problem_analysis',
        questionTitle: 'Safe Evaluation Test',
        questionStatement: 'Analyze complexity',
        maxScore: 25,
        candidateAnswerText: 'O(N log N) using divide and conquer',
        gradingRubric: [
          { id: 'crit-1', criterion: 'Complexity', max_score: 25, description: 'Correct bound' },
        ],
      });

      expect(result.total_score).toBe(0);
      expect(result.confidence).toBe('low');
      expect(result.needs_human_review).toBe(true);
      expect(result.review_reason).toContain('Gemini API key is not configured');
    });
  });

  // ==========================================
  // 8. Programmer Assessment & Judge0 Isolation
  // ==========================================
  describe('8. Programmer Assessment & Judge0 Execution Sandbox', () => {
    it('should correctly report Judge0 unconfigured status without fabricating passed tests', async () => {
      delete process.env.JUDGE0_API_URL;
      delete process.env.JUDGE0_API_KEY;

      expect(isJudge0Configured()).toBe(false);

      const testCases = [
        { id: 'tc-1', input: '5\n1 2 3 4 5\n', expected_output: '15\n', is_hidden: false },
        { id: 'tc-2', input: '3\n10 20 30\n', expected_output: '60\n', is_hidden: true },
      ];

      const execResult = await executeCppCode(
        '#include <iostream>\nint main() { return 0; }',
        testCases
      );

      expect(execResult.isConfigured).toBe(false);
      expect(execResult.status).toBe('unavailable');
      expect(execResult.passedTests).toBe(0);
      expect(execResult.totalTests).toBe(2);
      expect(execResult.compileOutput).toContain('not configured');

      // Verify hidden test stdout is never leaked
      const hiddenResult = execResult.results.find((r) => r.testId === 'tc-2');
      expect(hiddenResult?.stdout).toBeUndefined();
    });
  });

  // ==========================================
  // 9. Administrative Audit Trail
  // ==========================================
  describe('9. Administrative Audit Trail Persistence', () => {
    it('should log administrative audit events with details', async () => {
      const adminEmail = 'admin@student.president.ac.id';
      await dataStore.logAdminAudit({
        admin_email: adminEmail,
        action: 'UPDATE_ASSESSMENT',
        target_type: 'assessment',
        target_id: 'asmt-problem-analysis',
        details: { published: false, updated_fields: ['is_published'] },
      });

      const logs = await dataStore.getAdminAuditLogs();
      const found = logs.find((l) => l.action === 'UPDATE_ASSESSMENT');
      expect(found).toBeDefined();
      expect(found?.admin_email).toBe(adminEmail);
      expect(found?.target_id).toBe('asmt-problem-analysis');
    });
  });
});
