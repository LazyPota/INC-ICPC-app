import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { formatToWIB } from '@/lib/utils/time';

export async function GET() {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  const candidates = await dataStore.getAllCandidatesWithAttempts();

  // CSV headers
  const headers = [
    'Candidate Name',
    'Student Email',
    'Intended Division',
    'Assessment Status',
    'Started At (WIB)',
    'Submitted At (WIB)',
    'Answers Saved',
    'Total Score',
    'Evaluation Status',
    'Integrity Events Recorded',
  ];

  const rows = candidates.map((c) => {
    const startedWib = c.attempt ? formatToWIB(c.attempt.started_at) : 'N/A';
    const submittedWib = c.attempt?.submitted_at ? formatToWIB(c.attempt.submitted_at) : (c.attempt ? 'Not Submitted' : 'N/A');

    return [
      `"${c.profile.full_name.replace(/"/g, '""')}"`,
      `"${c.profile.student_email}"`,
      `"${c.profile.intended_division}"`,
      `"${c.attempt ? c.attempt.status : 'not_started'}"`,
      `"${startedWib}"`,
      `"${submittedWib}"`,
      c.answersCount,
      c.totalScore,
      `"${c.evalStatus}"`,
      c.integrityEventCount,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');

  return new NextResponse(csvContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="inc_2026_candidates_${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
