'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { Profile, AssessmentAttempt, AiEvaluation, Question } from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import { Brain, Sparkles, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

interface CandidateRecord {
  profile: Profile;
  attempt: AssessmentAttempt | null;
  answersCount: number;
  integrityEventCount: number;
  totalScore: number;
  evalStatus: string;
}

export function GradingClient({
  candidates,
  evaluations,
  questions,
}: {
  candidates: CandidateRecord[];
  evaluations: AiEvaluation[];
  questions: Question[];
}) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredEvals = evaluations.filter((ev) => {
    if (statusFilter === 'all') return true;
    return ev.status === statusFilter;
  });

  return (
    <main className="p-8 space-y-6 max-w-6xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">AI Evaluation & Scoring</h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect rubric-based AI grading output, model confidence, evidence citations, and manual overrides
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs">
        {['all', 'completed', 'needs_review', 'failed'].map((st) => (
          <button
            key={st}
            onClick={() => setStatusFilter(st)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors capitalize ${
              statusFilter === st
                ? 'bg-purple-600 text-white'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Evaluations List */}
      {filteredEvals.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-xs text-slate-500 italic">
          No evaluations matching the selected filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEvals.map((ev) => {
            const question = questions.find((q) => q.id === ev.question_id);
            const candidateRecord = candidates.find((c) => c.attempt?.id === ev.attempt_id);

            return (
              <div
                key={ev.id}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wide block">
                      {candidateRecord?.profile.full_name} ({candidateRecord?.profile.student_email})
                    </span>
                    <h4 className="text-sm font-bold text-white mt-0.5">
                      {question?.title || 'Question'}
                    </h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      ev.status === 'completed'
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : ev.status === 'needs_review'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800'
                        : 'bg-red-950 text-red-300 border border-red-800'
                    }`}>
                      {ev.status}
                    </span>

                    <span className="text-sm font-bold text-white font-mono">
                      {ev.total_score} pts
                    </span>

                    {candidateRecord && (
                      <Link
                        href={`/admin/candidates/${candidateRecord.profile.id}`}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs transition-colors flex items-center gap-1"
                      >
                        <span>Review</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </div>

                <p className="text-xs text-slate-300 italic">&quot;{ev.rationale}&quot;</p>

                {ev.flags && ev.flags.length > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400">Flags:</span>
                    {ev.flags.map((flag, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-800 text-amber-300 text-[10px] font-mono"
                      >
                        {flag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
