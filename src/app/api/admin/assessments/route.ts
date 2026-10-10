import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const assessments = await dataStore.getAllAssessments();
  return NextResponse.json({ assessments });
}

export async function PATCH(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, is_published, min_questions, max_questions, duration_minutes } = body;

    if (!id) {
      return NextResponse.json({ error: 'Missing assessment id' }, { status: 400 });
    }

    // If publishing, check question count validation:
    // "Prevent publication of an assessment that has no valid questions or violates the configured question count"
    if (is_published === true) {
      const questions = await dataStore.getQuestionsForAssessment(id);
      const enabledQuestions = questions.filter((q) => q.is_enabled);
      const minQ = min_questions !== undefined ? min_questions : 3;
      const maxQ = max_questions !== undefined ? max_questions : 5;

      if (enabledQuestions.length < minQ || enabledQuestions.length > maxQ) {
        return NextResponse.json(
          {
            error: `Cannot publish: Assessment currently has ${enabledQuestions.length} enabled questions. It must have between ${minQ} and ${maxQ} questions before publication.`,
          },
          { status: 400 }
        );
      }
    }

    const updated = await dataStore.updateAssessment({
      id,
      ...(is_published !== undefined ? { is_published } : {}),
      ...(min_questions !== undefined ? { min_questions } : {}),
      ...(max_questions !== undefined ? { max_questions } : {}),
      ...(duration_minutes !== undefined ? { duration_minutes } : {}),
    });

    await dataStore.logAdminAudit({
      admin_email: session.email,
      action: 'UPDATE_ASSESSMENT',
      target_type: 'assessment',
      target_id: id,
      details: { is_published, min_questions, max_questions },
    });

    return NextResponse.json({ success: true, assessment: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to update assessment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
