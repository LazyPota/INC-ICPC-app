import React from 'react';
import { notFound } from 'next/navigation';
import { dataStore } from '@/lib/data/store';
import { CandidateDetailClient } from './CandidateDetailClient';

export const dynamic = 'force-dynamic';

export default async function CandidateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await dataStore.getProfile(id);
  if (!profile) {
    notFound();
  }

  const assessment = await dataStore.getAssessmentByDivision(profile.intended_division);
  const attempt = assessment
    ? await dataStore.getAttemptByCandidateAndAssessment(profile.id, assessment.id)
    : null;

  const questions = assessment ? await dataStore.getQuestionsForAssessment(assessment.id, true) : [];
  const answers = attempt ? await dataStore.getAnswersForAttempt(attempt.id) : [];
  const integrityEvents = attempt ? await dataStore.getIntegrityEventsForAttempt(attempt.id) : [];
  const evaluations = attempt ? await dataStore.getEvaluationsForAttempt(attempt.id) : [];
  const overrides = attempt ? await dataStore.getScoreOverridesForAttempt(attempt.id) : [];

  return (
    <CandidateDetailClient
      profile={profile}
      assessment={assessment}
      attempt={attempt}
      questions={questions}
      answers={answers}
      integrityEvents={integrityEvents}
      evaluations={evaluations}
      overrides={overrides}
    />
  );
}
