import React from 'react';
import { dataStore } from '@/lib/data/store';
import { IntegrityClient } from './IntegrityClient';

export const dynamic = 'force-dynamic';

export default async function AdminIntegrityPage() {
  const events = await dataStore.getAllIntegrityEvents();
  const candidates = await dataStore.getAllCandidatesWithAttempts();

  return <IntegrityClient events={events} candidates={candidates} />;
}
