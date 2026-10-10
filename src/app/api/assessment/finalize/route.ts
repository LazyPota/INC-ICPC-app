import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { FinalizeAttemptSchema } from '@/lib/validations/assessment';
import { enqueueAttemptEvaluations, runEvaluationJobsForAttempt } from '@/lib/evaluations/pipeline';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = FinalizeAttemptSchema.parse(body);

    const attempt = await dataStore.getAttemptById(validated.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.candidate_id !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Atomically finalize attempt
    const finalized = await dataStore.finalizeAttempt(validated.attemptId, 'submitted');

    // Persistently enqueue evaluation jobs into the database queue
    await enqueueAttemptEvaluations(validated.attemptId);

    // Trigger asynchronous evaluation processing in background
    runEvaluationJobsForAttempt(validated.attemptId).catch((err) => {
      console.error('Error processing background evaluation jobs for attempt:', validated.attemptId, err);
    });

    return NextResponse.json({
      success: true,
      attempt: finalized,
      message:
        'Your assessment has been submitted successfully. Your evaluation is being processed and will remain confidential until the administrator completes the review and publishes the results. You do not need to take any further action.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to finalize assessment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
