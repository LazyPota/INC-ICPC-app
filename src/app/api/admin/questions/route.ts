import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const assessmentId = searchParams.get('assessmentId');
  if (!assessmentId) {
    return NextResponse.json({ error: 'Missing assessmentId' }, { status: 400 });
  }

  const questions = await dataStore.getQuestionsForAssessment(assessmentId, true);
  return NextResponse.json({ questions });
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { question, privateConfig } = body;

    if (!question || !question.assessment_id || !question.title || !question.statement) {
      return NextResponse.json({ error: 'Invalid question payload' }, { status: 400 });
    }

    const saved = await dataStore.saveQuestion(question, privateConfig);

    await dataStore.logAdminAudit({
      admin_email: session.email,
      action: question.id ? 'UPDATE_QUESTION' : 'CREATE_QUESTION',
      target_type: 'question',
      target_id: saved.id,
      details: { title: saved.title, division: saved.division },
    });

    return NextResponse.json({ success: true, question: saved });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to save question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const questionId = searchParams.get('id');
    if (!questionId) {
      return NextResponse.json({ error: 'Missing questionId' }, { status: 400 });
    }

    await dataStore.deleteQuestion(questionId);

    await dataStore.logAdminAudit({
      admin_email: session.email,
      action: 'DELETE_QUESTION',
      target_type: 'question',
      target_id: questionId,
      details: {},
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to delete question';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
