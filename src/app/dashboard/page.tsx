import React from 'react';
import { redirect } from 'next/navigation';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { CandidateDashboardClient } from './CandidateDashboardClient';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await getCurrentSession();
  if (!session || !session.profile) {
    redirect('/');
  }

  // Get matching assessment for candidate's division only
  const assessment = await dataStore.getAssessmentByDivision(session.profile.intended_division);
  const attempt = assessment
    ? await dataStore.getAttemptByCandidateAndAssessment(session.userId, assessment.id)
    : null;

  return (
    <CandidateDashboardClient
      profile={session.profile}
      assessment={assessment}
      attempt={attempt}
    />
  );
}
