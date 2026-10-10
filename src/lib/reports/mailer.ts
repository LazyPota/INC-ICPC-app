import { Resend } from 'resend';

export interface ReportNotificationPayload {
  assessmentTitle: string;
  assessmentId: string;
  reportId: string;
  version: number;
  completedAtWIB: string;
  totalCandidates: number;
  reviewedCount: number;
  unresolvedCount: number;
}

export interface MailerResult {
  status: 'sent' | 'failed' | 'unconfigured';
  recipient?: string;
  sentAt?: string;
  error?: string;
  messageId?: string;
}

export async function sendReportNotificationEmail(
  payload: ReportNotificationPayload
): Promise<MailerResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const recipient = process.env.ADMIN_REPORT_EMAIL;
  const fromEmail = process.env.EMAIL_FROM || 'reports@president.ac.id';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!apiKey || apiKey.trim() === '' || !recipient || recipient.trim() === '') {
    return {
      status: 'unconfigured',
      error: 'RESEND_API_KEY or ADMIN_REPORT_EMAIL not configured in server environment.',
    };
  }

  try {
    const resend = new Resend(apiKey);
    const reportUrl = `${appUrl}/admin/reports?id=${payload.reportId}`;

    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: recipient,
      subject: `[INC 2026 Admin] Confidential Evaluation Report Ready: ${payload.assessmentTitle}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
          <div style="border-bottom: 2px solid #2563eb; padding-bottom: 12px; margin-bottom: 20px;">
            <span style="font-size: 11px; font-weight: 700; color: #2563eb; text-transform: uppercase; letter-spacing: 0.05em;">ICPC INC 2026 Qualification Platform</span>
            <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 4px 0 0 0;">Confidential Consolidated Report Generated</h1>
          </div>
          
          <p style="font-size: 14px; line-height: 1.6; color: #334155;">
            The assessment cohort window has closed and candidate attempts have been finalized. The consolidated evaluation dossier for <strong>${payload.assessmentTitle}</strong> is ready for administrative review.
          </p>

          <div style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <table style="width: 100%; font-size: 13px; border-collapse: collapse;">
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Assessment Name:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${payload.assessmentTitle}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Report Version:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">v${payload.version}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Completion Timestamp:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${payload.completedAtWIB} WIB</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Total Candidates:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #0f172a; text-align: right;">${payload.totalCandidates}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Evaluations Completed:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #16a34a; text-align: right;">${payload.reviewedCount}</td>
              </tr>
              <tr>
                <td style="padding: 6px 0; color: #64748b;">Requiring Manual Review:</td>
                <td style="padding: 6px 0; font-weight: 600; color: #dc2626; text-align: right;">${payload.unresolvedCount}</td>
              </tr>
            </table>
          </div>

          <div style="margin: 28px 0; text-align: center;">
            <a href="${reportUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 8px; display: inline-block;">
              Open Administrator Review Console
            </a>
          </div>

          <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 16px;">
            <strong>Confidentiality Notice:</strong> AI-generated evaluation scores are provisional recommendations. Candidates will not receive grades or feedback until you explicitly authorize and publish final results.
          </p>
        </div>
      `,
    });

    if (error) {
      return {
        status: 'failed',
        recipient,
        error: error.message,
      };
    }

    return {
      status: 'sent',
      recipient,
      sentAt: new Date().toISOString(),
      messageId: data?.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to send notification email';
    return {
      status: 'failed',
      recipient,
      error: errorMsg,
    };
  }
}
