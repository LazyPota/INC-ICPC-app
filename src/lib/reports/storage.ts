import fs from 'fs';
import path from 'path';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';

const LOCAL_REPORTS_DIR = path.join(process.cwd(), '.data', 'reports');

/**
 * Stores report PDF in private Supabase Storage bucket 'admin-reports', or local storage fallback.
 * Strictly non-public storage.
 */
export async function saveReportPdf(
  assessmentId: string,
  version: number,
  pdfBytes: Uint8Array
): Promise<string> {
  const fileName = `v${version}_report.pdf`;
  const storagePath = `${assessmentId}/${fileName}`;

  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();

    // Ensure bucket exists
    const { data: buckets } = await supabase.storage.listBuckets();
    const bucketExists = buckets?.some((b) => b.name === 'admin-reports');
    if (!bucketExists) {
      await supabase.storage.createBucket('admin-reports', { public: false });
    }

    const { error } = await supabase.storage
      .from('admin-reports')
      .upload(storagePath, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) {
      throw new Error(`Failed to upload report to Supabase storage: ${error.message}`);
    }

    return storagePath;
  }

  // Local fallback
  const targetDir = path.join(LOCAL_REPORTS_DIR, assessmentId);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }

  const localFilePath = path.join(targetDir, fileName);
  fs.writeFileSync(localFilePath, Buffer.from(pdfBytes));
  return storagePath;
}

/**
 * Retrieves report PDF buffer for authorized administrative streaming.
 */
export async function getReportPdfBuffer(storagePath: string): Promise<Buffer | null> {
  if (isSupabaseConfigured()) {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage.from('admin-reports').download(storagePath);
    if (error || !data) {
      console.error('Error downloading report from Supabase:', error);
      return null;
    }
    const arrayBuffer = await data.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  // Local fallback
  const localFilePath = path.join(LOCAL_REPORTS_DIR, storagePath);
  if (fs.existsSync(localFilePath)) {
    return fs.readFileSync(localFilePath);
  }
  return null;
}
