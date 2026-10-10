import { describe, it, expect, beforeEach } from 'vitest';
import { calculateRemainingSeconds, formatCountdown, isDeadlineExpired } from '@/lib/utils/time';
import { dataStore } from '@/lib/data/store';

describe('Assessment Lifecycle & Timer Integrity', () => {
  beforeEach(async () => {
    await dataStore.updateAssessment({
      id: 'asmt-problem-analysis',
      global_closing_at: null,
      is_results_published: false,
    });
  });

  it('should calculate remaining seconds correctly and format to HH:MM:SS', () => {
    const now = Date.now();
    const futureDeadline = new Date(now + 180 * 60 * 1000).toISOString(); // 3 hours

    const remaining = calculateRemainingSeconds(futureDeadline);
    expect(remaining).toBeGreaterThanOrEqual(179 * 60);
    expect(remaining).toBeLessThanOrEqual(180 * 60);

    const formatted = formatCountdown(180 * 60);
    expect(formatted).toBe('03:00:00');

    const formatted5Mins = formatCountdown(300);
    expect(formatted5Mins).toBe('00:05:00');
  });

  it('should detect when deadline has expired', () => {
    const pastDeadline = new Date(Date.now() - 10000).toISOString();
    expect(isDeadlineExpired(pastDeadline)).toBe(true);
    expect(calculateRemainingSeconds(pastDeadline)).toBe(0);
  });

  it('should atomically start assessment and enforce 180-minute deadline', async () => {
    const candidateId = `cand-${Date.now()}-${Math.random()}`;
    const assessmentId = 'asmt-problem-analysis';
    const sessionId = 'session-token-alpha';

    const attempt = await dataStore.startAttempt(candidateId, assessmentId, sessionId);
    expect(attempt).toBeDefined();
    expect(attempt.status).toBe('in_progress');
    expect(attempt.active_session_id).toBe(sessionId);

    // Verify deadline is ~180 minutes in the future
    const startTime = new Date(attempt.started_at).getTime();
    const deadlineTime = new Date(attempt.deadline_at).getTime();
    const diffMinutes = Math.round((deadlineTime - startTime) / (60 * 1000));
    expect(diffMinutes).toBe(180);

    // If starting again with same candidate and assessment, it returns existing attempt
    const secondStart = await dataStore.startAttempt(candidateId, assessmentId, 'session-token-beta');
    expect(secondStart.id).toBe(attempt.id);
  });

  it('should save answer with version increment and reject updates after finalization', async () => {
    const candidateId = `cand-save-${Date.now()}-${Math.random()}`;
    const assessmentId = 'asmt-problem-analysis';
    const sessionId = 'session-test-save';

    const attempt = await dataStore.startAttempt(candidateId, assessmentId, sessionId);
    const questionId = 'test-q-1';

    // First save
    const ans1 = await dataStore.saveAnswer(attempt.id, questionId, {
      answerContent: 'Initial technical approach',
    });
    expect(ans1.version).toBe(1);
    expect(ans1.answer_content).toBe('Initial technical approach');

    // Second save (autosave update)
    const ans2 = await dataStore.saveAnswer(attempt.id, questionId, {
      answerContent: 'Updated refined algorithmic approach',
    });
    expect(ans2.version).toBe(2);
    expect(ans2.answer_content).toBe('Updated refined algorithmic approach');

    // Finalize attempt
    const finalized = await dataStore.finalizeAttempt(attempt.id, 'submitted');
    expect(finalized.status).toBe('submitted');
    expect(finalized.submitted_at).toBeDefined();

    // Repeated finalize must be idempotent
    const refinalize = await dataStore.finalizeAttempt(attempt.id, 'submitted');
    expect(refinalize.id).toBe(finalized.id);

    // Saving after submission must be rejected
    await expect(
      dataStore.saveAnswer(attempt.id, questionId, { answerContent: 'Illegal modification after deadline' })
    ).rejects.toThrow();
  });
});
