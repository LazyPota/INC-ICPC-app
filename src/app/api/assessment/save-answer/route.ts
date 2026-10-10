import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { SaveAnswerSchema } from '@/lib/validations/assessment';
import { isDeadlineExpired } from '@/lib/utils/time';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = SaveAnswerSchema.parse(body);

    const attempt = await dataStore.getAttemptById(validated.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.candidate_id !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (attempt.status !== 'in_progress' || isDeadlineExpired(attempt.deadline_at) || attempt.submitted_at) {
      return NextResponse.json(
        { error: 'Assessment time limit has expired or attempt is finalized. Answers can no longer be modified.' },
        { status: 403 }
      );
    }

    const savedAnswer = await dataStore.saveAnswer(validated.attemptId, validated.questionId, {
      answerContent: validated.answerContent,
      selectedOption: validated.selectedOption,
      codeContent: validated.codeContent,
      version: validated.version,
    });

    return NextResponse.json({
      success: true,
      answer: savedAnswer,
      savedAt: savedAnswer.saved_at,
    });
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'issues' in error) {
      return NextResponse.json({ error: (error as { issues: Array<{ message: string }> }).issues[0].message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'Failed to save answer';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
