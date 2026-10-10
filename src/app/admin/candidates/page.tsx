import React from 'react';
import { dataStore } from '@/lib/data/store';
import { CandidatesClient } from './CandidatesClient';

export const dynamic = 'force-dynamic';

export default async function AdminCandidatesPage() {
  const candidates = await dataStore.getAllCandidatesWithAttempts();

  return <CandidatesClient initialCandidates={candidates} />;
}
