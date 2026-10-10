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
  const statusInfo = assessment
    ? await dataStore.getCandidateFacingStatus(session.userId, assessment.id)
    : {
        status: 'Not Started' as const,
        attempt: null,
        approvedScore: null,
        maxScore: null,
        feedback: null,
      };

  return (
    <CandidateDashboardClient
      profile={session.profile}
      assessment={assessment}
      attempt={statusInfo.attempt}
      evaluationStatus={statusInfo.status}
      approvedScore={statusInfo.approvedScore}
      maxScore={statusInfo.maxScore}
      approvedFeedback={statusInfo.feedback}
    />
  );
}
