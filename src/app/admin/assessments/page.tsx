import React from 'react';
import { dataStore } from '@/lib/data/store';
import AssessmentsClient from '@/app/admin/assessments/AssessmentsClient';

export const dynamic = 'force-dynamic';

export default async function AdminAssessmentsPage() {
  const assessments = await dataStore.getAllAssessments();

  // Load questions for all assessments
  const assessmentsWithQuestions = await Promise.all(
    assessments.map(async (asmt) => {
      const questions = await dataStore.getQuestionsForAssessment(asmt.id, true);
      return {
        ...asmt,
        questions,
      };
    })
  );

  return <AssessmentsClient initialAssessments={assessmentsWithQuestions} />;
}
