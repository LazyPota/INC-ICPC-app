import React from 'react';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { redirect } from 'next/navigation';
import { ReportsClient } from './ReportsClient';

export const dynamic = 'force-dynamic';

export default async function AdminReportsPage() {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    redirect('/');
  }

  const assessments = await dataStore.getAllAssessments();
  const reports = await dataStore.getAllConfidentialReports();
  const candidates = await dataStore.getAllCandidatesWithAttempts();
  const evaluations = await dataStore.getAllEvaluations();
  const questions = await dataStore.getAllQuestions();

  return (
    <ReportsClient
      initialAssessments={assessments}
      initialReports={reports}
      candidates={candidates}
      evaluations={evaluations}
      questions={questions}
    />
  );
}
