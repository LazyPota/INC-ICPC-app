import { PDFDocument, rgb, StandardFonts, type PDFFont, type PDFPage } from 'pdf-lib';
import type {
  Assessment,
  Profile,
  AssessmentAttempt,
  Question,
  PrivateQuestionConfig,
  CandidateAnswer,
  AiEvaluation,
  IntegrityEvent,
  ManualScoreOverride,
  CodeExecution,
} from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';

export interface ReportCandidateData {
  profile: Profile;
  attempt: AssessmentAttempt | null;
  answers: CandidateAnswer[];
  evaluations: AiEvaluation[];
  integrityEvents: IntegrityEvent[];
  codeExecutions: CodeExecution[];
  overrides: ManualScoreOverride[];
}

export interface ConsolidatedReportData {
  assessment: Assessment;
  questions: Array<Question & { privateConfig?: PrivateQuestionConfig }>;
  candidates: ReportCandidateData[];
  generatedAtWIB: string;
}

function sanitizeText(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[^\x20-\x7E\t\n\r]/g, ' ');
}

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  const paragraphs = text.split('\n');
  for (const para of paragraphs) {
    if (!para.trim()) {
      lines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = '';
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const width = font.widthOfTextAtSize(testLine, size);
      if (width <= maxWidth) {
        currentLine = testLine;
      } else {
        if (currentLine) lines.push(currentLine);
        currentLine = word;
      }
    }
    if (currentLine) lines.push(currentLine);
  }
  return lines;
}

/**
 * Generates a multi-page consolidated confidential evaluation PDF report using pure-JS pdf-lib.
 */
export async function generateConsolidatedPdfReport(data: ConsolidatedReportData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();

  const fontRegular = await doc.embedFont(StandardFonts.Helvetica);
  const fontBold = await doc.embedFont(StandardFonts.HelveticaBold);

  const PAGE_WIDTH = 595.28;
  const PAGE_HEIGHT = 841.89;
  const MARGIN_LEFT = 45;
  const MARGIN_RIGHT = 45;
  const CONTENT_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;
  const BOTTOM_LIMIT = 55;

  let currentPage: PDFPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let currentY = PAGE_HEIGHT - 50;

  function ensureSpace(requiredHeight: number) {
    if (currentY - requiredHeight < BOTTOM_LIMIT) {
      currentPage = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      currentY = PAGE_HEIGHT - 50;
      drawRunningHeader();
    }
  }

  function drawRunningHeader() {
    currentPage.drawText(
      sanitizeText(`CONFIDENTIAL REPORT - ${data.assessment.title.toUpperCase()}`),
      {
        x: MARGIN_LEFT,
        y: PAGE_HEIGHT - 30,
        size: 7.5,
        font: fontBold,
        color: rgb(0.4, 0.45, 0.5),
      }
    );
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: PAGE_HEIGHT - 34 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: PAGE_HEIGHT - 34 },
      thickness: 0.5,
      color: rgb(0.8, 0.82, 0.85),
    });
  }

  function drawSectionHeader(title: string, sectionLetter: string) {
    ensureSpace(35);
    currentY -= 10;
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: currentY - 5,
      width: CONTENT_WIDTH,
      height: 22,
      color: rgb(0.12, 0.16, 0.22),
    });
    currentPage.drawText(sanitizeText(`${sectionLetter}. ${title.toUpperCase()}`), {
      x: MARGIN_LEFT + 8,
      y: currentY + 2,
      size: 9.5,
      font: fontBold,
      color: rgb(0.95, 0.96, 0.98),
    });
    currentY -= 20;
  }

  function drawKeyValue(key: string, value: string, indent = 0) {
    ensureSpace(14);
    const keyWidth = 160;
    currentPage.drawText(sanitizeText(key), {
      x: MARGIN_LEFT + indent,
      y: currentY,
      size: 8.5,
      font: fontBold,
      color: rgb(0.3, 0.35, 0.4),
    });
    currentPage.drawText(sanitizeText(value), {
      x: MARGIN_LEFT + indent + keyWidth,
      y: currentY,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.1, 0.1, 0.1),
    });
    currentY -= 13;
  }

  function drawParagraphText(text: string, font: PDFFont, size: number, color = rgb(0.15, 0.15, 0.15), indent = 0) {
    const wrapped = wrapText(sanitizeText(text), font, size, CONTENT_WIDTH - indent);
    for (const line of wrapped) {
      ensureSpace(size + 4);
      currentPage.drawText(line, {
        x: MARGIN_LEFT + indent,
        y: currentY,
        size,
        font,
        color,
      });
      currentY -= size + 3;
    }
  }

  // =========================================================================
  // Document Title & Cover Banner
  // =========================================================================
  drawRunningHeader();

  currentPage.drawText('ICPC INC 2026 CANDIDATE ASSESSMENT PLATFORM', {
    x: MARGIN_LEFT,
    y: currentY,
    size: 8.5,
    font: fontBold,
    color: rgb(0.2, 0.4, 0.7),
  });
  currentY -= 18;

  currentPage.drawText('Consolidated Confidential Evaluation Report', {
    x: MARGIN_LEFT,
    y: currentY,
    size: 16,
    font: fontBold,
    color: rgb(0.08, 0.12, 0.18),
  });
  currentY -= 14;

  currentPage.drawText(
    'Provisional AI Evaluations and Administrative Review Dossier. All scores remain confidential until publication.',
    {
      x: MARGIN_LEFT,
      y: currentY,
      size: 8,
      font: fontRegular,
      color: rgb(0.45, 0.48, 0.52),
    }
  );
  currentY -= 15;

  currentPage.drawLine({
    start: { x: MARGIN_LEFT, y: currentY },
    end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: currentY },
    thickness: 1,
    color: rgb(0.2, 0.4, 0.7),
  });
  currentY -= 12;

  // =========================================================================
  // SECTION A: Executive Summary
  // =========================================================================
  drawSectionHeader('Executive Summary', 'SECTION A');

  const totalRegistered = data.candidates.length;
  const startedCandidates = data.candidates.filter((c) => c.attempt !== null);
  const submittedCandidates = data.candidates.filter(
    (c) => c.attempt && (c.attempt.status === 'submitted' || c.attempt.status === 'expired')
  );
  const notStartedCandidates = data.candidates.filter((c) => c.attempt === null);

  const allEvals = data.candidates.flatMap((c) => c.evaluations);
  const completedEvals = allEvals.filter((e) => e.status === 'completed');
  const reviewRequiredEvals = allEvals.filter((e) => e.status === 'needs_review');
  const failedEvals = allEvals.filter((e) => e.status === 'failed');

  const totalAvailablePoints = data.questions.reduce((sum, q) => sum + Number(q.max_score || 0), 0);

  drawKeyValue('Assessment Name:', data.assessment.title);
  drawKeyValue('Assessment Identifier:', data.assessment.id);
  drawKeyValue('Division:', data.assessment.division.toUpperCase().replace('_', ' '));
  drawKeyValue(
    'Global Closing Deadline:',
    data.assessment.global_closing_at ? formatToWIB(data.assessment.global_closing_at) : 'Not Configured'
  );
  drawKeyValue('Report Generation Timestamp:', `${data.generatedAtWIB} (Asia/Jakarta)`);
  drawKeyValue('Total Registered Candidates:', `${totalRegistered}`);
  drawKeyValue('Candidates Started:', `${startedCandidates.length} (${Math.round((startedCandidates.length / (totalRegistered || 1)) * 100)}%)`);
  drawKeyValue('Candidates Submitted/Finalized:', `${submittedCandidates.length}`);
  drawKeyValue('Candidates Absent (No Attempt):', `${notStartedCandidates.length}`);
  drawKeyValue('Evaluations Completed:', `${completedEvals.length}`);
  drawKeyValue('Evaluations Requiring Review:', `${reviewRequiredEvals.length}`);
  drawKeyValue('Failed / Incomplete Grading Jobs:', `${failedEvals.length}`);
  drawKeyValue('Total Available Division Points:', `${totalAvailablePoints} pts`);

  currentY -= 8;

  // Notice Box
  ensureSpace(40);
  currentPage.drawRectangle({
    x: MARGIN_LEFT,
    y: currentY - 26,
    width: CONTENT_WIDTH,
    height: 30,
    color: rgb(0.96, 0.97, 0.98),
    borderColor: rgb(0.8, 0.85, 0.9),
    borderWidth: 0.5,
  });
  currentPage.drawText(
    'LEGAL NOTICE & CONFIDENTIALITY: AI-generated evaluations and provisional scores are advisory recommendations.',
    {
      x: MARGIN_LEFT + 8,
      y: currentY - 10,
      size: 7.5,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.3),
    }
  );
  currentPage.drawText(
    'Grades must not be published to candidates before explicit review and authorization by the INC 2026 Qualification Administrator.',
    {
      x: MARGIN_LEFT + 8,
      y: currentY - 21,
      size: 7,
      font: fontRegular,
      color: rgb(0.35, 0.4, 0.45),
    }
  );
  currentY -= 36;

  // =========================================================================
  // SECTIONS B, C, D, E for each candidate (Grouped together per candidate)
  // =========================================================================
  drawSectionHeader('Candidate Results & Detailed Evaluations', 'SECTIONS B, C, D, E');

  if (data.candidates.length === 0) {
    drawParagraphText('No candidates are registered for this assessment division.', fontRegular, 8.5);
  }

  data.candidates.forEach((cand, idx) => {
    ensureSpace(60);

    // Candidate Header Separator
    currentPage.drawRectangle({
      x: MARGIN_LEFT,
      y: currentY - 4,
      width: CONTENT_WIDTH,
      height: 18,
      color: rgb(0.92, 0.94, 0.97),
    });
    currentPage.drawText(
      sanitizeText(`CANDIDATE #${idx + 1}: ${cand.profile.full_name.toUpperCase()} (${cand.profile.student_email})`),
      {
        x: MARGIN_LEFT + 6,
        y: currentY + 1.5,
        size: 8.5,
        font: fontBold,
        color: rgb(0.1, 0.2, 0.35),
      }
    );
    currentY -= 18;

    // SECTION B: Candidate Results Summary
    let totalScore = 0;
    cand.evaluations.forEach((ev) => {
      const override = cand.overrides.find((o) => o.question_id === ev.question_id);
      totalScore += override ? override.override_score : (ev.approved_score ?? ev.total_score);
    });

    let attemptStatus = 'No Attempt (Absent)';
    let evalStatus = 'No Attempt';
    let timeConsumed = '0 Minutes';

    if (cand.attempt) {
      attemptStatus = cand.attempt.status === 'submitted' ? 'Submitted' : cand.attempt.status === 'expired' ? 'Time Expired (Auto-Submitted)' : 'In Progress';
      if (cand.evaluations.length === 0) evalStatus = 'Evaluation Pending';
      else if (cand.evaluations.some((e) => e.status === 'failed')) evalStatus = 'Evaluation Failed';
      else if (cand.evaluations.some((e) => e.status === 'needs_review')) evalStatus = 'Requires Manual Review';
      else evalStatus = 'Completed';

      if (cand.attempt.started_at && cand.attempt.submitted_at) {
        const diffMs = new Date(cand.attempt.submitted_at).getTime() - new Date(cand.attempt.started_at).getTime();
        const mins = Math.max(1, Math.round(diffMs / (60 * 1000)));
        timeConsumed = `${mins} Minutes`;
      }
    }

    const requiresManualReview =
      cand.evaluations.some((e) => e.status === 'needs_review' || e.status === 'failed') ||
      (cand.attempt && cand.evaluations.length === 0);

    drawKeyValue('Intended Division:', cand.profile.intended_division.toUpperCase().replace('_', ' '), 8);
    drawKeyValue('Attempt Identifier:', cand.attempt ? cand.attempt.id : 'N/A (No Attempt)', 8);
    drawKeyValue('Registration Date:', formatToWIB(cand.profile.created_at), 8);
    drawKeyValue('Attempt Start:', cand.attempt?.started_at ? formatToWIB(cand.attempt.started_at) : 'N/A', 8);
    drawKeyValue('Attempt Submission:', cand.attempt?.submitted_at ? formatToWIB(cand.attempt.submitted_at) : 'N/A', 8);
    drawKeyValue('Time Consumed:', timeConsumed, 8);
    drawKeyValue('Attempt Status:', attemptStatus, 8);
    drawKeyValue('Evaluation Status:', evalStatus, 8);
    drawKeyValue(
      'Provisional Total Score:',
      `${Math.round(totalScore * 100) / 100} / ${totalAvailablePoints} points`,
      8
    );
    drawKeyValue('Manual Review Required:', requiresManualReview ? 'YES - FLAG RAISED' : 'No', 8);

    currentY -= 6;

    // SECTION C: Detailed Question Evaluation
    ensureSpace(30);
    currentPage.drawText('Section C: Detailed Question Evaluation', {
      x: MARGIN_LEFT + 8,
      y: currentY,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    currentY -= 12;

    if (!cand.attempt || cand.answers.length === 0) {
      drawParagraphText('Candidate did not submit any answers for this assessment.', fontRegular, 8, rgb(0.4, 0.4, 0.4), 8);
    } else {
      data.questions.forEach((q, qIdx) => {
        const answer = cand.answers.find((a) => a.question_id === q.id);
        const evalItem = cand.evaluations.find((e) => e.question_id === q.id);
        const codeExec = cand.codeExecutions.find((ce) => ce.question_id === q.id);
        const override = cand.overrides.find((o) => o.question_id === q.id);

        ensureSpace(40);
        currentPage.drawText(
          sanitizeText(`Q${qIdx + 1}: ${q.title} (${q.question_type.replace('_', ' ').toUpperCase()}) - Max: ${q.max_score} pts`),
          {
            x: MARGIN_LEFT + 12,
            y: currentY,
            size: 8,
            font: fontBold,
            color: rgb(0.15, 0.15, 0.2),
          }
        );
        currentY -= 11;

        // Statement summary
        drawParagraphText(
          `Statement: ${q.statement.slice(0, 150)}${q.statement.length > 150 ? '...' : ''}`,
          fontRegular,
          7.5,
          rgb(0.35, 0.35, 0.35),
          12
        );

        // Candidate Submitted Answer
        const submittedText =
          answer?.code_content || answer?.answer_content || answer?.selected_option || '[No answer submitted]';
        drawParagraphText(
          `Submitted Answer: ${submittedText.slice(0, 300)}${submittedText.length > 300 ? ' [truncated]' : ''}`,
          fontRegular,
          7.5,
          rgb(0.1, 0.1, 0.1),
          12
        );

        // Scoring Breakdown
        const awarded = override ? override.override_score : (evalItem?.approved_score ?? evalItem?.total_score ?? 0);
        drawKeyValue('Awarded Score:', `${awarded} / ${q.max_score} pts ${override ? '(OVERRIDDEN)' : ''}`, 12);

        if (codeExec) {
          drawKeyValue(
            'Execution Outcome:',
            `${codeExec.status} | Passed ${codeExec.passed_tests}/${codeExec.total_tests} test cases`,
            12
          );
        }

        if (evalItem) {
          drawKeyValue('Model Evaluator:', `${evalItem.model_name} (Confidence: ${Math.round(evalItem.confidence * 100)}%)`, 12);
          if (evalItem.rationale) {
            drawParagraphText(`Rationale: ${evalItem.rationale}`, fontRegular, 7.5, rgb(0.25, 0.3, 0.35), 12);
          }
          if (evalItem.evidence) {
            drawParagraphText(`Evidence: ${evalItem.evidence}`, fontRegular, 7, rgb(0.4, 0.4, 0.4), 12);
          }
          if (evalItem.flags && evalItem.flags.length > 0) {
            drawKeyValue('Flags:', evalItem.flags.join(', '), 12);
          }
        }
        currentY -= 4;
      });
    }

    // SECTION D: Integrity Review
    ensureSpace(30);
    currentPage.drawText('Section D: Integrity & Proctoring Review', {
      x: MARGIN_LEFT + 8,
      y: currentY,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    currentY -= 12;

    if (cand.integrityEvents.length === 0) {
      drawParagraphText('No suspicious integrity events recorded for this session.', fontRegular, 8, rgb(0.4, 0.4, 0.4), 8);
    } else {
      drawKeyValue('Total Integrity Events:', `${cand.integrityEvents.length} recorded`, 8);
      cand.integrityEvents.slice(0, 5).forEach((ev) => {
        ensureSpace(12);
        currentPage.drawText(
          sanitizeText(`- [${formatToWIB(ev.created_at)}] ${ev.event_type.toUpperCase()} (Severity: ${ev.severity.toUpperCase()})`),
          {
            x: MARGIN_LEFT + 12,
            y: currentY,
            size: 7.5,
            font: fontRegular,
            color: ev.severity === 'high' ? rgb(0.7, 0.1, 0.1) : rgb(0.3, 0.3, 0.3),
          }
        );
        currentY -= 11;
      });
      if (cand.integrityEvents.length > 5) {
        drawParagraphText(`... and ${cand.integrityEvents.length - 5} additional events in audit log.`, fontRegular, 7, rgb(0.5, 0.5, 0.5), 12);
      }
    }

    // SECTION E: Administrator Review
    ensureSpace(40);
    currentPage.drawText('Section E: Administrator Review & Final Determination', {
      x: MARGIN_LEFT + 8,
      y: currentY,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.25, 0.35),
    });
    currentY -= 12;

    const hasOverride = cand.overrides.length > 0;
    const isApproved = cand.evaluations.length > 0 && cand.evaluations.every((e) => e.is_approved);

    drawKeyValue('Review Status:', isApproved ? 'Approved by Administrator' : requiresManualReview ? 'Requires Administrator Review' : 'Pending Administrative Review', 8);
    drawKeyValue('Human-Adjusted Score:', hasOverride ? `${totalScore} pts (Adjusted)` : 'No Manual Adjustment', 8);
    if (hasOverride) {
      const reasons = cand.overrides.map((o) => o.reason).join('; ');
      drawParagraphText(`Adjustment Reason: ${reasons}`, fontRegular, 7.5, rgb(0.2, 0.2, 0.2), 8);
    }
    drawKeyValue('Final Publication Status:', data.assessment.is_results_published ? 'Published to Candidate' : 'Confidential (Unpublished)', 8);

    currentY -= 14;
    currentPage.drawLine({
      start: { x: MARGIN_LEFT, y: currentY },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: currentY },
      thickness: 0.5,
      color: rgb(0.85, 0.88, 0.9),
    });
    currentY -= 12;
  });

  // =========================================================================
  // Footer on Every Page (Total Page Numbering & Security Stamps)
  // =========================================================================
  const totalPages = doc.getPageCount();
  for (let i = 0; i < totalPages; i++) {
    const page = doc.getPage(i);
    page.drawLine({
      start: { x: MARGIN_LEFT, y: 38 },
      end: { x: PAGE_WIDTH - MARGIN_RIGHT, y: 38 },
      thickness: 0.5,
      color: rgb(0.8, 0.82, 0.85),
    });

    page.drawText(
      sanitizeText(`ICPC INC 2026 CONFIDENTIAL EVALUATION REPORT | Page ${i + 1} of ${totalPages}`),
      {
        x: MARGIN_LEFT,
        y: 26,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.45, 0.48, 0.52),
      }
    );

    page.drawText(
      sanitizeText(`Generated: ${data.generatedAtWIB} WIB`),
      {
        x: PAGE_WIDTH - MARGIN_RIGHT - 130,
        y: 26,
        size: 7.5,
        font: fontRegular,
        color: rgb(0.45, 0.48, 0.52),
      }
    );
  }

  return await doc.save();
}
