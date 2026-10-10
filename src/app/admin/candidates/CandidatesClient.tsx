'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Profile, AssessmentAttempt } from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import { Search, Filter, ShieldAlert, ArrowRight, UserCheck } from 'lucide-react';

interface CandidateRecord {
  profile: Profile;
  attempt: AssessmentAttempt | null;
  answersCount: number;
  integrityEventCount: number;
  totalScore: number;
  evalStatus: string;
}

export function CandidatesClient({ initialCandidates }: { initialCandidates: CandidateRecord[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const filteredCandidates = useMemo(() => {
    return initialCandidates.filter((c) => {
      const matchSearch =
        c.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.profile.student_email.toLowerCase().includes(searchTerm.toLowerCase());

      const matchDivision =
        divisionFilter === 'all' || c.profile.intended_division === divisionFilter;

      const attemptStatus = c.attempt ? c.attempt.status : 'not_started';
      const matchStatus = statusFilter === 'all' || attemptStatus === statusFilter;

      return matchSearch && matchDivision && matchStatus;
    });
  }, [initialCandidates, searchTerm, divisionFilter, statusFilter]);

  return (
    <main className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Candidate Management</h2>
        <p className="text-xs text-slate-400 mt-1">
          Inspect candidate qualification attempts, submission timelines, proctor flags, and scores
        </p>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-4 rounded-xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by candidate name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={divisionFilter}
            onChange={(e) => setDivisionFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Divisions</option>
            <option value="problem_analysis">Problem Analysis</option>
            <option value="algorithm_builder">Algorithm Builder</option>
            <option value="programmer">Programmer</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Attempt Statuses</option>
            <option value="not_started">Not Started</option>
            <option value="in_progress">In Progress</option>
            <option value="submitted">Submitted</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-semibold">
              <tr>
                <th className="py-3 px-4">Candidate Name</th>
                <th className="py-3 px-4">Student Email</th>
                <th className="py-3 px-4">Division</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Submitted At (WIB)</th>
                <th className="py-3 px-4">Answers</th>
                <th className="py-3 px-4">Score</th>
                <th className="py-3 px-4">Evaluation</th>
                <th className="py-3 px-4">Proctor Flags</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-slate-500 italic">
                    No candidates found matching the filters.
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((c) => {
                  const hasSuspiciousActivity = c.integrityEventCount >= 2;
                  return (
                    <tr key={c.profile.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-semibold text-white">{c.profile.full_name}</td>
                      <td className="py-3 px-4 font-mono text-slate-300">{c.profile.student_email}</td>
                      <td className="py-3 px-4 text-blue-400 uppercase font-semibold">
                        {c.profile.intended_division.replace('_', ' ')}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          !c.attempt
                            ? 'bg-slate-800 text-slate-400'
                            : c.attempt.status === 'in_progress'
                            ? 'bg-blue-950 text-blue-300 border border-blue-800'
                            : c.attempt.status === 'submitted'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : 'bg-red-950 text-red-300 border border-red-800'
                        }`}>
                          {c.attempt ? c.attempt.status : 'not_started'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {c.attempt?.submitted_at ? formatToWIB(c.attempt.submitted_at) : '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 font-semibold">{c.answersCount}</td>
                      <td className="py-3 px-4 font-bold text-white">{c.totalScore} pts</td>
                      <td className="py-3 px-4">
                        <span className="text-[11px] text-slate-300">{c.evalStatus}</span>
                      </td>
                      <td className="py-3 px-4">
                        {c.integrityEventCount > 0 ? (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            hasSuspiciousActivity
                              ? 'bg-amber-950 text-amber-300 border border-amber-800'
                              : 'bg-slate-800 text-slate-400'
                          }`}>
                            <ShieldAlert className="w-3 h-3 text-amber-400" />
                            {c.integrityEventCount} events
                          </span>
                        ) : (
                          <span className="text-slate-500">0</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <Link
                          href={`/admin/candidates/${c.profile.id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-[11px] font-medium transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
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
