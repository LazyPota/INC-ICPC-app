import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { generateAssessmentReport } from '@/lib/reports/service';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { assessmentId, force, candidateIds, hideIntegrityLogs } = body;

    if (!assessmentId) {
      return NextResponse.json({ error: 'Missing assessmentId parameter' }, { status: 400 });
    }

    const result = await generateAssessmentReport(assessmentId, {
      force: Boolean(force),
      candidateIds: Array.isArray(candidateIds) ? candidateIds.filter((id: unknown) => typeof id === 'string') : undefined,
      hideIntegrityLogs: Boolean(hideIntegrityLogs),
      triggeredBy: session.email,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          error: result.message || 'Failed to generate report',
          reason: result.reason,
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      report: result.report,
      isExisting: result.isExisting,
      message: result.isExisting
        ? 'Report already exists and is up-to-date.'
        : 'Confidential report generated successfully.',
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Report generation failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
