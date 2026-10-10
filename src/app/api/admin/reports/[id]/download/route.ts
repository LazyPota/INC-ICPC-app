import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { getReportPdfBuffer } from '@/lib/reports/storage';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getCurrentSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const report = await dataStore.getConfidentialReportById(id);
    if (!report || !report.pdf_storage_path) {
      return NextResponse.json({ error: 'Report PDF not found' }, { status: 404 });
    }

    const pdfBuffer = await getReportPdfBuffer(report.pdf_storage_path);
    if (!pdfBuffer) {
      return NextResponse.json({ error: 'Report file missing from storage' }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inc_2026_confidential_report_v${report.version}.pdf"`,
        'Cache-Control': 'private, no-store, max-age=0',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Download error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
