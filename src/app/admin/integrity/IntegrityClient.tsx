'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { IntegrityEvent, Profile, AssessmentAttempt } from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import { ShieldAlert, AlertTriangle, Eye } from 'lucide-react';

interface CandidateRecord {
  profile: Profile;
  attempt: AssessmentAttempt | null;
  answersCount: number;
  integrityEventCount: number;
  totalScore: number;
  evalStatus: string;
}

export function IntegrityClient({
  events,
  candidates,
}: {
  events: IntegrityEvent[];
  candidates: CandidateRecord[];
}) {
  const [severityFilter, setSeverityFilter] = useState('all');

  const filteredEvents = events.filter((e) => {
    if (severityFilter === 'all') return true;
    return e.severity === severityFilter;
  });

  return (
    <main className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Integrity Proctor Logs</h2>
        <p className="text-xs text-slate-400 mt-1">
          Auditable log of browser visibility changes, window blur, duplicate active tabs, and clipboard events
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['all', 'high', 'medium', 'low'].map((sev) => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
              severityFilter === sev
                ? 'bg-blue-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {sev} Severity
          </button>
        ))}
      </div>

      {/* Events Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Timestamp (WIB)</th>
                <th className="py-3 px-4">Candidate</th>
                <th className="py-3 px-4">Event Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Session ID</th>
                <th className="py-3 px-4">Metadata</th>
                <th className="py-3 px-4 text-right">Candidate Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {filteredEvents.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 italic font-sans">
                    No integrity events found.
                  </td>
                </tr>
              ) : (
                filteredEvents.map((ev) => {
                  const candidateRecord = candidates.find((c) => c.profile.id === ev.candidate_id);

                  return (
                    <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300">{formatToWIB(ev.created_at)}</td>
                      <td className="py-3 px-4 text-white font-sans font-semibold">
                        {candidateRecord ? candidateRecord.profile.full_name : ev.candidate_id}
                      </td>
                      <td className="py-3 px-4 font-sans text-blue-400">{ev.event_type}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ev.severity === 'high'
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : ev.severity === 'medium'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}>
                          {ev.severity.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500 truncate max-w-xs">{ev.session_id}</td>
                      <td className="py-3 px-4 text-slate-400 truncate max-w-xs">
                        {JSON.stringify(ev.metadata)}
                      </td>
                      <td className="py-3 px-4 text-right font-sans">
                        {candidateRecord && (
                          <Link
                            href={`/admin/candidates/${candidateRecord.profile.id}`}
                            className="inline-flex items-center gap-1 text-slate-400 hover:text-white"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
