import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { AdminScoreOverrideSchema } from '@/lib/validations/assessment';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const validated = AdminScoreOverrideSchema.parse(body);

    const evals = await dataStore.getEvaluationsForAttempt(validated.attemptId);
    const existingEval = evals.find((e) => e.question_id === validated.questionId);
    const originalScore = existingEval ? existingEval.total_score : 0;

    const override = await dataStore.saveScoreOverride({
      attempt_id: validated.attemptId,
      question_id: validated.questionId,
      admin_email: session.email,
      original_score: originalScore,
      override_score: validated.overrideScore,
      reason: validated.reason,
    });

    await dataStore.logAdminAudit({
      admin_email: session.email,
      action: 'OVERRIDE_SCORE',
      target_type: 'attempt_question',
      target_id: `${validated.attemptId}:${validated.questionId}`,
      details: {
        original_score: originalScore,
        override_score: validated.overrideScore,
        reason: validated.reason,
      },
    });

    return NextResponse.json({ success: true, override });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: (error as { issues: Array<{ message: string }> }).issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to override score';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
