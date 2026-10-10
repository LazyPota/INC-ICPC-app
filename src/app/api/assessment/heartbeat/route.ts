import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { calculateRemainingSeconds, isDeadlineExpired } from '@/lib/utils/time';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { attemptId, sessionId } = await request.json();
    if (!attemptId || !sessionId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    const attempt = await dataStore.getAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    // Verify candidate owns this attempt
    if (attempt.candidate_id !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const expired = isDeadlineExpired(attempt.deadline_at);
    if (expired && attempt.status === 'in_progress') {
      await dataStore.finalizeAttempt(attemptId, 'expired');
    }

    const { valid, activeSessionId } = await dataStore.recordHeartbeat(attemptId, sessionId);
    const remainingSeconds = calculateRemainingSeconds(attempt.deadline_at);

    return NextResponse.json({
      valid,
      activeSessionId,
      remainingSeconds,
      status: expired ? 'expired' : attempt.status,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Heartbeat error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
