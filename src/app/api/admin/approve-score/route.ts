import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { evaluationId, approvedScore, reviewNotes, reason } = body;

    if (!evaluationId) {
      return NextResponse.json({ error: 'Missing evaluationId parameter' }, { status: 400 });
    }

    const allEvals = await dataStore.getAllEvaluations();
    const evaluation = allEvals.find((e) => e.id === evaluationId);
    if (!evaluation) {
      return NextResponse.json({ error: 'Evaluation not found' }, { status: 404 });
    }

    // If adjusted score differs from original provisional AI score, require mandatory reason
    if (approvedScore !== undefined && approvedScore !== null && Number(approvedScore) !== Number(evaluation.total_score)) {
      if (!reason || reason.trim() === '') {
        return NextResponse.json(
          { error: 'A mandatory reason is required when manually adjusting an evaluation score.' },
          { status: 400 }
        );
      }

      // Persist manual score override record preserving the original AI score
      await dataStore.saveScoreOverride({
        attempt_id: evaluation.attempt_id,
        question_id: evaluation.question_id,
        admin_email: session.email,
        original_score: evaluation.total_score,
        override_score: Number(approvedScore),
        reason: reason.trim(),
      });
    }

    // Approve the evaluation
    const updated = await dataStore.approveEvaluation(
      evaluationId,
      session.email,
      approvedScore !== undefined ? Number(approvedScore) : evaluation.total_score,
      reviewNotes || reason
    );

    return NextResponse.json({
      success: true,
      evaluation: updated,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to approve score';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
