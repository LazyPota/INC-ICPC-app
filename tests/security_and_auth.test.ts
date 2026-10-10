import { describe, it, expect } from 'vitest';
import { isAdminEmail } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { ProctorEventSchema } from '@/lib/validations/assessment';

describe('Application Security & Access Control', () => {
  it('should verify admin email against configured allowlist', () => {
    process.env.ADMIN_EMAILS = 'admin@student.president.ac.id,coach@student.president.ac.id';
    expect(isAdminEmail('admin@student.president.ac.id')).toBe(true);
    expect(isAdminEmail('coach@student.president.ac.id')).toBe(true);
    expect(isAdminEmail('regular.student@student.president.ac.id')).toBe(false);
    expect(isAdminEmail('attacker@evil.com')).toBe(false);
    expect(isAdminEmail(undefined)).toBe(false);
  });

  it('should validate and sanitize proctor integrity events', () => {
    const validEvent = {
      attemptId: 'c81b7a22-3c2d-4f10-9b6e-1d579f187a4a',
      sessionId: 'sess_12345',
      eventType: 'window_blur' as const,
      severity: 'medium' as const,
      metadata: { timestamp: new Date().toISOString() },
    };

    const parsed = ProctorEventSchema.parse(validEvent);
    expect(parsed.eventType).toBe('window_blur');
    expect(parsed.severity).toBe('medium');
  });

  it('should record manual score overrides and log admin audit trail', async () => {
    const attemptId = 'test-att-override';
    const questionId = 'test-q-override';
    const adminEmail = 'admin@student.president.ac.id';

    const override = await dataStore.saveScoreOverride({
      attempt_id: attemptId,
      question_id: questionId,
      admin_email: adminEmail,
      original_score: 50,
      override_score: 85,
      reason: 'Valid alternate mathematical proof overlooked by AI evaluator.',
    });

    expect(override.override_score).toBe(85);
    expect(override.reason).toContain('alternate mathematical proof');

    await dataStore.logAdminAudit({
      admin_email: adminEmail,
      action: 'OVERRIDE_SCORE',
      target_type: 'score',
      target_id: `${attemptId}:${questionId}`,
      details: { from: 50, to: 85 },
    });

    const auditLogs = await dataStore.getAdminAuditLogs();
    const recorded = auditLogs.find((l) => l.action === 'OVERRIDE_SCORE');
    expect(recorded).toBeDefined();
    expect(recorded?.admin_email).toBe(adminEmail);
  });
});
