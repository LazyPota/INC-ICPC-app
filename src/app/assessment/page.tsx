import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { AssessmentWorkspaceClient } from './AssessmentWorkspaceClient';

export const dynamic = 'force-dynamic';

export default async function AssessmentPage() {
  const session = await getCurrentSession();
  if (!session || !session.profile) {
    redirect('/');
  }

  const assessment = await dataStore.getAssessmentByDivision(session.profile.intended_division);
  if (!assessment) {
    redirect('/dashboard');
  }

  const attempt = await dataStore.getAttemptByCandidateAndAssessment(session.userId, assessment.id);
  if (!attempt) {
    redirect('/dashboard');
  }

  if (attempt.status === 'submitted' || attempt.status === 'expired') {
    redirect('/assessment/submitted');
  }

  // Load public questions only (NO private configurations, NO hidden tests, NO reference answers!)
  const questions = await dataStore.getQuestionsForAssessment(assessment.id, false);
  const enabledQuestions = questions.filter((q) => q.is_enabled);

  // Load existing saved answers
  const existingAnswers = await dataStore.getAnswersForAttempt(attempt.id);

  return (
    <AssessmentWorkspaceClient
      profile={session.profile}
      assessment={assessment}
      attempt={attempt}
      questions={enabledQuestions}
      initialAnswers={existingAnswers}
    />
  );
}
