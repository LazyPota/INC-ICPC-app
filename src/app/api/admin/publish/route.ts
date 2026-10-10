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
    const { assessmentId, forcePartial } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Missing assessmentId parameter' }, { status: 400 });
    }

    const assessment = await dataStore.getAssessmentById(assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });
    }

    // Inspect candidates and evaluations for this assessment
    const allCandidates = await dataStore.getAllCandidatesWithAttempts();
    const candidates = allCandidates.filter((c) => c.profile.intended_division === assessment.division);

    let completedEvaluations = 0;
    let unresolvedEvaluations = 0;
    let manuallyAdjustedCount = 0;

    for (const cand of candidates) {
      if (cand.attempt) {
        const evals = await dataStore.getEvaluationsForAttempt(cand.attempt.id);
        const overrides = await dataStore.getScoreOverridesForAttempt(cand.attempt.id);
        if (overrides.length > 0) manuallyAdjustedCount += overrides.length;

        evals.forEach((ev) => {
          if (ev.status === 'completed') completedEvaluations++;
          else unresolvedEvaluations++;
        });

        // If candidate submitted but evals are missing
        if (evals.length === 0 && (cand.attempt.status === 'submitted' || cand.attempt.status === 'expired')) {
          unresolvedEvaluations++;
        }
      }
    }

    // Guard: Prevent publication with unresolved evaluations unless explicitly confirmed (forcePartial: true)
    if (unresolvedEvaluations > 0 && !forcePartial) {
      return NextResponse.json(
        {
          success: false,
          reason: 'UNRESOLVED_EVALUATIONS',
          unresolvedCount: unresolvedEvaluations,
          message: `Cannot publish results: There are ${unresolvedEvaluations} unresolved evaluation(s) requiring review. Explicit confirmation is required to publish partial results.`,
        },
        { status: 400 }
      );
    }

    // Authoritative publication
    const updated = await dataStore.publishAssessmentResults(assessmentId, session.email);

    return NextResponse.json({
      success: true,
      assessment: updated,
      publishedAt: updated.results_published_at,
      metrics: {
        totalCandidates: candidates.length,
        completedEvaluations,
        unresolvedEvaluations,
        manuallyAdjustedCount,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Publication failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
