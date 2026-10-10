import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';

export async function GET() {
  try {
    const session = await getCurrentSession();
    if (!session || !session.isAdmin) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
    }

    const reports = await dataStore.getAllConfidentialReports();
    return NextResponse.json({ reports });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to fetch reports';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
