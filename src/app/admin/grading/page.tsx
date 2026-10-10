import React from 'react';
import { dataStore } from '@/lib/data/store';
import { GradingClient } from './GradingClient';

export const dynamic = 'force-dynamic';

export default async function AdminGradingPage() {
  const candidates = await dataStore.getAllCandidatesWithAttempts();
  const evaluations = await dataStore.getAllEvaluations();
  const questions = await dataStore.getAllQuestions();

  return <GradingClient candidates={candidates} evaluations={evaluations} questions={questions} />;
}
