import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { ProctorEventSchema, LEGACY_QUESTION_MAP } from '@/lib/validations/assessment';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = ProctorEventSchema.parse(body);

    const attempt = await dataStore.getAttemptById(validated.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.candidate_id !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Sanitize metadata to avoid unbounded payload size
    const sanitizedMetadata: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(validated.metadata)) {
      if (typeof val === 'string') {
        sanitizedMetadata[key] = val.slice(0, 500); // Truncate strings to prevent abuse
      } else if (typeof val === 'number' || typeof val === 'boolean') {
        sanitizedMetadata[key] = val;
      }
    }

    const mappedQuestionId = validated.questionId
      ? (LEGACY_QUESTION_MAP[validated.questionId] || validated.questionId)
      : null;

    await dataStore.logIntegrityEvent({
      attempt_id: validated.attemptId,
      candidate_id: session.userId,
      session_id: validated.sessionId,
      event_type: validated.eventType,
      severity: validated.severity,
      metadata: sanitizedMetadata,
      question_id: mappedQuestionId,
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to log integrity event';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
