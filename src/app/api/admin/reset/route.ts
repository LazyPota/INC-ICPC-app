import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const { attemptId } = await request.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
    }

    await dataStore.resetAttempt(attemptId, session.email);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to reset attempt';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
