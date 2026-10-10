import { NextResponse } from 'next/server';
import { dataStore } from '@/lib/data/store';
import { generateAssessmentReport } from '@/lib/reports/service';

export const dynamic = 'force-dynamic';

/**
 * Scheduled deadline checker compatible with Netlify cron and external schedulers.
 * Checks stored database global_closing_at timestamps, finalizes attempts, and triggers report generation.
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    // If CRON_SECRET is configured, verify bearer token
    if (cronSecret && cronSecret.trim() !== '') {
      if (authHeader !== `Bearer ${cronSecret}`) {
        return NextResponse.json({ error: 'Unauthorized cron invocation' }, { status: 401 });
      }
    }

    const assessments = await dataStore.getAllAssessments();
    const nowMs = Date.now();
    const generated: string[] = [];
    const skipped: string[] = [];

    for (const assessment of assessments) {
      if (!assessment.global_closing_at) {
        skipped.push(`${assessment.division}: No closing deadline configured`);
        continue;
      }

      const deadlineMs = new Date(assessment.global_closing_at).getTime();
      if (nowMs >= deadlineMs) {
        // Global closing deadline reached -> run report generation pipeline
        const result = await generateAssessmentReport(assessment.id, {
          triggeredBy: 'cron-scheduler',
        });

        if (result.success) {
          generated.push(`${assessment.division}: ${result.isExisting ? 'Already up-to-date' : 'Generated'}`);
        } else {
          skipped.push(`${assessment.division}: ${result.reason} - ${result.message}`);
        }
      } else {
        skipped.push(`${assessment.division}: Deadline in future (${assessment.global_closing_at})`);
      }
    }

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      checkedCount: assessments.length,
      generated,
      skipped,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Deadline check error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return GET(request);
}
