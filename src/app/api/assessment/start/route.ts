import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { StartAttemptSchema } from '@/lib/validations/assessment';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = StartAttemptSchema.parse(body);

    // Enforce that candidate can only access their selected division
    if (session.profile.intended_division !== validated.division) {
      return NextResponse.json(
        { error: 'You are not enrolled in this assessment division.' },
        { status: 403 }
      );
    }

    const assessment = await dataStore.getAssessmentByDivision(validated.division);
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    if (!assessment.is_published && !session.isAdmin) {
      return NextResponse.json(
        { error: 'This assessment has not yet been published by the administrator.' },
        { status: 403 }
      );
    }

    // Atomically start or retrieve existing attempt with authoritative server deadline
    const attempt = await dataStore.startAttempt(session.userId, assessment.id, validated.sessionId);

    return NextResponse.json({
      success: true,
      attempt,
      assessment,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start assessment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
