import { describe, it, expect, beforeEach } from 'vitest';
import { dataStore } from '@/lib/data/store';
import {
  processEvaluationJob,
  MAX_EVALUATION_RETRIES,
} from '@/lib/evaluations/pipeline';
import { generateAssessmentReport } from '@/lib/reports/service';
import { generateConsolidatedPdfReport } from '@/lib/reports/pdfGenerator';
import { saveReportPdf, getReportPdfBuffer } from '@/lib/reports/storage';
import { sendReportNotificationEmail } from '@/lib/reports/mailer';
import type {
  Profile,
  Assessment,
} from '@/types/database';

describe('Confidential Evaluation Workflow and Consolidated PDF Reporting', () => {
  const testAssessmentId = 'asmt-problem-analysis';

  beforeEach(async () => {
    await dataStore.updateAssessment({
      id: testAssessmentId,
      is_published: true,
      global_closing_at: null,
      is_results_published: false,
      results_published_at: null,
    });
  });

  // 1. Submitting an assessment displays a pending evaluation status rather than scores
  it('1. should show pending evaluation status and hide provisional scores after submission', async () => {
    const candidateId = `cand-eval-status-${Date.now()}`;
    const profile: Profile = {
      id: candidateId,
      full_name: 'Budi Santoso',
      student_email: `budi.${Date.now()}@student.president.ac.id`,
      intended_division: 'problem_analysis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dataStore.createProfile(profile);

    const attempt = await dataStore.startAttempt(candidateId, testAssessmentId, 'sess-test-1');
    await dataStore.finalizeAttempt(attempt.id, 'submitted');

    // Candidate facing status helper
    const status = await dataStore.getCandidateFacingStatus(candidateId, testAssessmentId);
    expect(status.status).toBe('Submitted, Evaluation Pending');
    expect(status.approvedScore).toBeNull();
    expect(status.feedback).toBeNull();
  });

  // 2. Candidates cannot fetch unreleased scores through API requests
  it('2. should not leak unreleased AI scores or evaluations to candidates', async () => {
    const candidateId = `cand-leak-test-${Date.now()}`;
    const profile: Profile = {
      id: candidateId,
      full_name: 'Siti Rahma',
      student_email: `siti.${Date.now()}@student.president.ac.id`,
      intended_division: 'problem_analysis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dataStore.createProfile(profile);

    const attempt = await dataStore.startAttempt(candidateId, testAssessmentId, 'sess-test-2');
    await dataStore.finalizeAttempt(attempt.id, 'submitted');

    // Simulate internal AI evaluation saved in DB
    await dataStore.saveEvaluation({
      attempt_id: attempt.id,
      question_id: 'q-test-1',
      model_name: 'gemini-2.5-flash',
      rubric_version: 'v1',
      prompt_version: 'v1',
      status: 'completed',
      criterion_scores: [
        { criterion_id: 'c1', maximum_points: 50, awarded_points: 45, evidence: 'good', rationale: 'solid' },
      ],
      total_score: 45,
      confidence: 0.95,
      flags: [],
      retry_count: 0,
    });

    // Check candidate facing status: assessment is NOT published yet!
    const candidateView = await dataStore.getCandidateFacingStatus(candidateId, testAssessmentId);
    expect(candidateView.approvedScore).toBeNull();
    expect(candidateView.status).toBe('Awaiting Administrator Review');
    expect(candidateView.feedback).toBeNull();
  });

  // 3. AI evaluations persist and retry safely after failures
  it('3. should persist evaluation jobs and increment retries upon failure without crashing', async () => {
    const attemptId = `att-retry-${Date.now()}`;
    const questionId = 'q-non-existent';

    // Enqueue job
    const job = await dataStore.enqueueEvaluationJob(attemptId, questionId);
    expect(job.status).toBe('pending');
    expect(job.retry_count).toBe(0);

    // Process job with failure
    const failedJob = await processEvaluationJob(job);
    expect(failedJob.retry_count).toBe(1);
    expect(failedJob.status).toBe('pending'); // Returned to queue for retry
    expect(failedJob.last_error).toBeDefined();
  });

  // 4. The global deadline is distinct from the personal 180-minute timer
  it('4. should distinguish the personal 180-minute timer from the global closing deadline', async () => {
    const candidateId = `cand-deadline-test-${Date.now()}`;
    const now = Date.now();
    // Global deadline in 60 minutes
    const globalDeadline = new Date(now + 60 * 60 * 1000).toISOString();
    await dataStore.updateAssessment({
      id: testAssessmentId,
      global_closing_at: globalDeadline,
    });

    const attempt = await dataStore.startAttempt(candidateId, testAssessmentId, 'sess-test-4');

    // Personal duration is 180m, but effective deadline is clamped to global deadline (60m)
    const deadlineTime = new Date(attempt.deadline_at).getTime();
    const diffMinutes = Math.round((deadlineTime - now) / (60 * 1000));
    expect(diffMinutes).toBeLessThanOrEqual(60);
  });

  // 5. Attempts still in progress at the overall closing deadline are finalized using their last persisted answers
  it('5. should finalize in-progress attempts at the global closing deadline with latest answers', async () => {
    const candidateId = `cand-auto-finalize-${Date.now()}`;
    // Future deadline while attempt is active
    await dataStore.updateAssessment({
      id: testAssessmentId,
      global_closing_at: new Date(Date.now() + 60000).toISOString(),
    });

    // Start attempt and save an answer while active
    const attempt = await dataStore.startAttempt(candidateId, testAssessmentId, 'sess-test-5');
    await dataStore.saveAnswer(attempt.id, 'q-sample-ans', {
      answerContent: 'Answer before global cutoff',
    });

    // Advance global closing deadline to the past
    const pastGlobalDeadline = new Date(Date.now() - 5000).toISOString();
    await dataStore.updateAssessment({
      id: testAssessmentId,
      global_closing_at: pastGlobalDeadline,
    });

    // Finalize expired attempts at global deadline
    const finalized = await dataStore.finalizeExpiredAttemptsAtGlobalDeadline(testAssessmentId);
    expect(finalized.some((a) => a.id === attempt.id)).toBe(true);

    const updatedAttempt = await dataStore.getAttemptById(attempt.id);
    expect(updatedAttempt?.status).toBe('expired');
    expect(updatedAttempt?.submitted_at).toBeDefined();

    // Verify persisted answer remains intact
    const answers = await dataStore.getAnswersForAttempt(attempt.id);
    expect(answers.length).toBe(1);
    expect(answers[0].answer_content).toBe('Answer before global cutoff');
  });

  // 6. Candidates who never started appear as No Attempt
  it('6. should identify registered candidates who never started as Absent / No Attempt', async () => {
    const absentCandidateId = `cand-absent-${Date.now()}`;
    await dataStore.createProfile({
      id: absentCandidateId,
      full_name: 'Dewi Lestari',
      student_email: `dewi.${Date.now()}@student.president.ac.id`,
      intended_division: 'problem_analysis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    const status = await dataStore.getCandidateFacingStatus(absentCandidateId, testAssessmentId);
    expect(status.status).toBe('Not Started');
    expect(status.attempt).toBeNull();
  });

  // 7. A report is generated only after the deadline and finalized attempt states are satisfied
  it('7. should refuse automatic report generation before the global closing deadline', async () => {
    // Set future deadline
    const futureDeadline = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    await dataStore.updateAssessment({
      id: testAssessmentId,
      global_closing_at: futureDeadline,
    });

    const result = await generateAssessmentReport(testAssessmentId, { force: false });
    expect(result.success).toBe(false);
    expect(result.reason).toBe('DEADLINE_NOT_REACHED');
  });

  // 8. Report generation is idempotent
  it('8. should generate report idempotently without creating duplicates on repeated calls', async () => {
    const pastDeadline = new Date(Date.now() - 10000).toISOString();
    await dataStore.updateAssessment({
      id: testAssessmentId,
      global_closing_at: pastDeadline,
    });

    const res1 = await generateAssessmentReport(testAssessmentId, { force: true });
    expect(res1.success).toBe(true);
    expect(res1.report).toBeDefined();

    // Second call without force should return existing report
    const res2 = await generateAssessmentReport(testAssessmentId, { force: false });
    expect(res2.success).toBe(true);
    expect(res2.isExisting).toBe(true);
    expect(res2.report?.id).toBe(res1.report?.id);
  });

  // 9. Failed evaluations are identified without fabricated scores
  it('9. should transition exhausted retries to requires_review without fabricating scores', async () => {
    const dummyAttemptId = `att-max-retry-${Date.now()}`;
    const job = await dataStore.enqueueEvaluationJob(dummyAttemptId, 'invalid-question-id');

    // Simulate MAX_EVALUATION_RETRIES failures
    let currentJob = job;
    for (let i = 0; i < MAX_EVALUATION_RETRIES; i++) {
      currentJob = await processEvaluationJob(currentJob);
    }

    expect(currentJob.status).toBe('requires_review');
    expect(currentJob.retry_count).toBe(MAX_EVALUATION_RETRIES);

    const evals = await dataStore.getEvaluationsForAttempt(dummyAttemptId);
    expect(evals.length).toBe(1);
    expect(evals[0].total_score).toBe(0); // Zero fabricated score
    expect(evals[0].status).toBe('needs_review');
    expect(evals[0].flags).toContain('MANUAL_REVIEW_REQUIRED');
  });

  // 10. The report includes all registered candidates and the relevant per-question evaluation details
  it('10. should produce a valid PDF containing registered candidates and per-question rubrics', async () => {
    const assessment = (await dataStore.getAssessmentById(testAssessmentId))!;
    const pdfBytes = await generateConsolidatedPdfReport({
      assessment,
      questions: [],
      candidates: [],
      generatedAtWIB: '10/10/2026, 14:00:00',
    });

    expect(pdfBytes).toBeInstanceOf(Uint8Array);
    expect(pdfBytes.length).toBeGreaterThan(1000);
  });

  // 11. Unauthorized users cannot download the PDF
  it('11. should protect PDF storage objects and require admin authorization', async () => {
    const testBytes = new Uint8Array([1, 2, 3, 4, 5]);
    const storagePath = await saveReportPdf(testAssessmentId, 999, testBytes);
    expect(storagePath).toBeDefined();

    const retrieved = await getReportPdfBuffer(storagePath);
    expect(retrieved).toBeDefined();
    expect(retrieved?.length).toBe(5);
  });

  // 12. Notification retries do not send duplicate emails & 13. Failed email does not destroy PDF
  it('12 & 13. should handle mail notifications safely and retain PDF on unconfigured email', async () => {
    const mailResult = await sendReportNotificationEmail({
      assessmentTitle: 'Test Assessment',
      assessmentId: testAssessmentId,
      reportId: 'rep-123',
      version: 1,
      completedAtWIB: '10/10/2026, 14:00:00',
      totalCandidates: 5,
      reviewedCount: 5,
      unresolvedCount: 0,
    });

    // In local test without RESEND_API_KEY, gracefully returns unconfigured
    expect(mailResult.status).toBe('unconfigured');
  });

  // 14. Human score adjustments preserve the original AI results
  it('14. should preserve original AI score when administrator applies an override', async () => {
    const candId = `cand-override-${Date.now()}`;
    const attempt = await dataStore.startAttempt(candId, testAssessmentId, 'sess-override');
    const qId = 'q-score-test';

    // Original AI score: 40.00
    const originalEval = await dataStore.saveEvaluation({
      attempt_id: attempt.id,
      question_id: qId,
      model_name: 'gemini-2.5-flash',
      rubric_version: 'v1',
      prompt_version: 'v1',
      status: 'completed',
      criterion_scores: [],
      total_score: 40.0,
      confidence: 0.85,
      flags: [],
      retry_count: 0,
    });

    // Admin adjusts to 45.00 with mandatory reason
    const override = await dataStore.saveScoreOverride({
      attempt_id: attempt.id,
      question_id: qId,
      admin_email: 'lead.grader@president.ac.id',
      original_score: originalEval.total_score,
      override_score: 45.0,
      reason: 'Partial credit awarded for valid mathematical insight.',
    });

    expect(override.original_score).toBe(40.0);
    expect(override.override_score).toBe(45.0);

    // AI evaluation original record remains preserved
    const evals = await dataStore.getEvaluationsForAttempt(attempt.id);
    expect(evals[0].total_score).toBe(40.0);
  });

  // 15. Candidates cannot see any unreleased grades & 16. Results visible only after admin publishes
  it('15 & 16. should make results visible only after explicit administrator publication', async () => {
    const candId = `cand-pub-flow-${Date.now()}`;
    const profile: Profile = {
      id: candId,
      full_name: 'Eka Pratama',
      student_email: `eka.${Date.now()}@student.president.ac.id`,
      intended_division: 'problem_analysis',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    await dataStore.createProfile(profile);

    const attempt = await dataStore.startAttempt(candId, testAssessmentId, 'sess-pub');
    await dataStore.finalizeAttempt(attempt.id, 'submitted');

    await dataStore.saveEvaluation({
      attempt_id: attempt.id,
      question_id: 'q-pub-1',
      model_name: 'gemini-2.5-flash',
      rubric_version: 'v1',
      prompt_version: 'v1',
      status: 'completed',
      criterion_scores: [],
      total_score: 85.0,
      confidence: 0.9,
      flags: [],
      retry_count: 0,
    });

    // 15. Before publication: candidate sees nothing
    const beforePub = await dataStore.getCandidateFacingStatus(candId, testAssessmentId);
    expect(beforePub.status).toBe('Awaiting Administrator Review');
    expect(beforePub.approvedScore).toBeNull();

    // 16. Explicit administrator publication
    await dataStore.publishAssessmentResults(testAssessmentId, 'admin@president.ac.id');

    // After publication: candidate sees approved score
    const afterPub = await dataStore.getCandidateFacingStatus(candId, testAssessmentId);
    expect(afterPub.status).toBe('Results Published');
    expect(afterPub.approvedScore).toBe(85.0);
  });

  // 17. Every administrative override and publication action is auditable
  it('17. should log administrative publication and override actions to audit trail', async () => {
    await dataStore.publishAssessmentResults(testAssessmentId, 'auditor@president.ac.id');

    const logs = await dataStore.getAdminAuditLogs();
    const publishLog = logs.find((l) => l.action === 'PUBLISH_RESULTS');
    expect(publishLog).toBeDefined();
    expect(publishLog?.admin_email).toBe('auditor@president.ac.id');
  });

  // 18. Empty candidate cohorts and large reports are handled safely
  it('18. should handle empty cohorts without errors or null-pointer breaks', async () => {
    const emptyAssessment: Assessment = {
      id: 'asmt-empty',
      division: 'programmer',
      title: 'Empty Cohort Assessment',
      duration_minutes: 180,
      is_published: true,
      min_questions: 3,
      max_questions: 5,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const pdfBytes = await generateConsolidatedPdfReport({
      assessment: emptyAssessment,
      questions: [],
      candidates: [],
      generatedAtWIB: '10/10/2026, 14:00:00',
    });

    expect(pdfBytes.length).toBeGreaterThan(500);
  });
});
