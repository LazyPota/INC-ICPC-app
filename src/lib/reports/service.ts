import { dataStore } from '@/lib/data/store';
import { runEvaluationJobsForAttempt, processEvaluationQueue } from '@/lib/evaluations/pipeline';
import { generateConsolidatedPdfReport, type ReportCandidateData } from '@/lib/reports/pdfGenerator';
import { saveReportPdf } from '@/lib/reports/storage';
import { sendReportNotificationEmail } from '@/lib/reports/mailer';
import { formatToWIB } from '@/lib/utils/time';
import type { ConfidentialReport, ReportSummary } from '@/types/database';

export interface GenerateReportResult {
  success: boolean;
  reason?: 'CLOSING_DEADLINE_NOT_CONFIGURED' | 'DEADLINE_NOT_REACHED' | 'EVALUATIONS_IN_PROGRESS' | 'GENERATION_ERROR';
  message?: string;
  report?: ConfidentialReport;
  isExisting?: boolean;
}

export interface GenerateReportOptions {
  force?: boolean;
  triggeredBy?: string;
  candidateIds?: string[];
  hideIntegrityLogs?: boolean;
}

/**
 * Generates the consolidated PDF report for an assessment cohort.
 * Idempotent, persistent, and verifiable.
 */
export async function generateAssessmentReport(
  assessmentId: string,
  options?: GenerateReportOptions
): Promise<GenerateReportResult> {
  const assessment = await dataStore.getAssessmentById(assessmentId);
  if (!assessment) {
    throw new Error(`Assessment ${assessmentId} not found`);
  }

  // 1. Enforce Global Closing Deadline configuration
  if (!assessment.global_closing_at) {
    return {
      success: false,
      reason: 'CLOSING_DEADLINE_NOT_CONFIGURED',
      message: 'Assessment-wide global closing deadline must be configured before generating report.',
    };
  }

  const nowMs = Date.now();
  const globalDeadlineMs = new Date(assessment.global_closing_at).getTime();

  // 2. Enforce that global closing deadline has passed (unless admin forces generation)
  if (nowMs < globalDeadlineMs && !options?.force) {
    return {
      success: false,
      reason: 'DEADLINE_NOT_REACHED',
      message: `Global closing deadline (${formatToWIB(assessment.global_closing_at)} WIB) has not yet passed.`,
    };
  }

  // 3. Finalize any remaining in-progress attempts using their latest persisted answers
  await dataStore.finalizeExpiredAttemptsAtGlobalDeadline(assessmentId);

  // 4. Check for existing report to ensure idempotency (unless custom filter/options or force is requested)
  const isCustomRun = Boolean(
    options?.force ||
    (options?.candidateIds && options.candidateIds.length > 0) ||
    options?.hideIntegrityLogs !== undefined
  );
  const existingReport = await dataStore.getLatestConfidentialReport(assessmentId);
  if (
    existingReport &&
    (existingReport.status === 'ready' || existingReport.status === 'notification_sent') &&
    !isCustomRun
  ) {
    return {
      success: true,
      report: existingReport,
      isExisting: true,
      message: 'Report already generated and finalized for this assessment.',
    };
  }

  // 5. Ensure all evaluation jobs reach terminal state
  await processEvaluationQueue(50);

  // 6. Fetch consistent snapshot of candidates, attempts, evaluations
  const allCandidates = await dataStore.getAllCandidatesWithAttempts();
  const divisionCandidates = allCandidates.filter((c) => c.profile.intended_division === assessment.division);
  const questions = await dataStore.getQuestionsForAssessment(assessmentId, true);

  // Filter candidates if specific candidateIds were requested
  const targetCandidates = options?.candidateIds && options.candidateIds.length > 0
    ? divisionCandidates.filter((c) => options.candidateIds!.includes(c.profile.id))
    : divisionCandidates;

  if (targetCandidates.length === 0) {
    return {
      success: false,
      reason: 'GENERATION_ERROR',
      message: 'No candidates matched the specified filter criteria.',
    };
  }

  // For any candidate whose attempt has pending jobs, process them
  for (const cand of targetCandidates) {
    if (cand.attempt) {
      await runEvaluationJobsForAttempt(cand.attempt.id);
    }
  }

  // 7. Assemble Report Candidate Data Snapshot
  const candidateReportList: ReportCandidateData[] = [];
  let completedEvalsCount = 0;
  let unresolvedEvalsCount = 0;

  for (const cand of targetCandidates) {
    const attempt = cand.attempt;
    const answers = attempt ? await dataStore.getAnswersForAttempt(attempt.id) : [];
    const evaluations = attempt ? await dataStore.getEvaluationsForAttempt(attempt.id) : [];
    const integrityEvents = attempt ? await dataStore.getIntegrityEventsForAttempt(attempt.id) : [];
    const codeExecutions = attempt ? await dataStore.getCodeExecutionsForAttempt(attempt.id) : [];
    const overrides = attempt ? await dataStore.getScoreOverridesForAttempt(attempt.id) : [];

    evaluations.forEach((ev) => {
      if (ev.status === 'completed') completedEvalsCount++;
      else unresolvedEvalsCount++;
    });

    candidateReportList.push({
      profile: cand.profile,
      attempt,
      answers,
      evaluations,
      integrityEvents,
      codeExecutions,
      overrides,
    });
  }

  const generatedAtWIB = formatToWIB(new Date().toISOString());
  const nextVersion = existingReport ? existingReport.version + 1 : 1;

  // 8. Create or update persistent report entry with status 'generating'
  const summaryJson: ReportSummary = {
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    division: assessment.division,
    globalClosingAt: assessment.global_closing_at,
    generatedAtWIB,
    totalRegistered: candidateReportList.length,
    divisionCounts: { [assessment.division]: candidateReportList.length },
    startedCount: candidateReportList.filter((c) => c.attempt !== null).length,
    submittedCount: candidateReportList.filter(
      (c) => c.attempt && (c.attempt.status === 'submitted' || c.attempt.status === 'expired')
    ).length,
    notStartedCount: candidateReportList.filter((c) => c.attempt === null).length,
    completedEvaluations: completedEvalsCount,
    evaluationsRequiringReview: unresolvedEvalsCount,
    failedEvaluations: candidateReportList.flatMap((c) => c.evaluations).filter((e) => e.status === 'failed').length,
    totalAvailablePoints: questions.reduce((sum, q) => sum + Number(q.max_score || 0), 0),
    selectedCandidateIds: options?.candidateIds && options.candidateIds.length > 0 ? options.candidateIds : null,
    isCandidateFiltered: Boolean(options?.candidateIds && options.candidateIds.length > 0),
    hideIntegrityLogs: Boolean(options?.hideIntegrityLogs),
  };

  let report = await dataStore.createConfidentialReport({
    assessment_id: assessmentId,
    version: nextVersion,
    status: 'generating',
    email_status: 'pending',
    total_candidates: candidateReportList.length,
    reviewed_count: completedEvalsCount,
    unresolved_count: unresolvedEvalsCount,
    summary_json: summaryJson,
  });

  try {
    // 9. Generate multi-page PDF document
    const pdfBytes = await generateConsolidatedPdfReport({
      assessment,
      questions,
      candidates: candidateReportList,
      generatedAtWIB,
      hideIntegrityLogs: Boolean(options?.hideIntegrityLogs),
      isCandidateFiltered: Boolean(options?.candidateIds && options.candidateIds.length > 0),
    });

    // 10. Persist PDF to private Supabase bucket
    const pdfStoragePath = await saveReportPdf(assessmentId, nextVersion, pdfBytes);

    // 11. Send notification email to configured admin (Resend)
    const mailResult = await sendReportNotificationEmail({
      assessmentTitle: assessment.title,
      assessmentId: assessment.id,
      reportId: report.id,
      version: nextVersion,
      completedAtWIB: generatedAtWIB,
      totalCandidates: candidateReportList.length,
      reviewedCount: completedEvalsCount,
      unresolvedCount: unresolvedEvalsCount,
    });

    // 12. Update report record with final status
    const finalReportStatus = mailResult.status === 'sent' ? 'notification_sent' : 'ready';

    report = await dataStore.updateConfidentialReport(report.id, {
      status: finalReportStatus,
      pdf_storage_path: pdfStoragePath,
      email_status: mailResult.status,
      email_sent_at: mailResult.sentAt || null,
      email_recipient: mailResult.recipient || null,
      email_error: mailResult.error || null,
    });

    // 13. Audit log
    await dataStore.logAdminAudit({
      admin_email: options?.triggeredBy || 'system-cron',
      action: 'GENERATE_CONFIDENTIAL_REPORT',
      target_type: 'CONFIDENTIAL_REPORT',
      target_id: report.id,
      details: {
        assessmentId,
        version: nextVersion,
        pdfStoragePath,
        emailStatus: mailResult.status,
        totalCandidates: candidateReportList.length,
        candidateIds: options?.candidateIds || null,
        hideIntegrityLogs: Boolean(options?.hideIntegrityLogs),
      },
    });

    return {
      success: true,
      report,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Report generation error';
    report = await dataStore.updateConfidentialReport(report.id, {
      status: 'failed',
      email_error: errorMsg,
    });

    return {
      success: false,
      reason: 'GENERATION_ERROR',
      message: errorMsg,
      report,
    };
  }
}
