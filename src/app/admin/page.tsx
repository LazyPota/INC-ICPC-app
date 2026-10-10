import React from 'react';
import { dataStore } from '@/lib/data/store';
import { formatToWIB } from '@/lib/utils/time';
import {
  Users,
  Brain,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  History,
  FileQuestion,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const candidates = await dataStore.getAllCandidatesWithAttempts();
  const allEvents = await dataStore.getAllIntegrityEvents();
  const auditLogs = await dataStore.getAdminAuditLogs();
  const assessments = await dataStore.getAllAssessments();

  // Metrics computation
  const totalRegistrations = candidates.length;

  const divisionCounts = {
    problem_analysis: candidates.filter((c) => c.profile.intended_division === 'problem_analysis').length,
    algorithm_builder: candidates.filter((c) => c.profile.intended_division === 'algorithm_builder').length,
    programmer: candidates.filter((c) => c.profile.intended_division === 'programmer').length,
  };

  const startedAssessments = candidates.filter((c) => c.attempt !== null).length;
  const inProgressAssessments = candidates.filter((c) => c.attempt?.status === 'in_progress').length;
  const submittedAssessments = candidates.filter((c) => c.attempt?.status === 'submitted').length;
  const expiredAssessments = candidates.filter((c) => c.attempt?.status === 'expired').length;

  const pendingEvaluations = candidates.filter(
    (c) => (c.attempt?.status === 'submitted' || c.attempt?.status === 'expired') && c.evalStatus === 'Pending Evaluation'
  ).length;

  const failedEvaluations = candidates.filter((c) => c.evalStatus === 'Evaluation Failed').length;

  // Candidates with >= 3 high/medium integrity events
  const flaggedCandidates = candidates.filter((c) => c.integrityEventCount >= 3).length;

  return (
    <main className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Executive Assessment Overview</h2>
        <p className="text-xs text-slate-400 mt-1">
          Real-time metrics for ICPC INC 2026 internal candidate qualification
        </p>
      </div>

      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Candidates */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Total Registered</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{totalRegistrations}</p>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
            <span>PA: {divisionCounts.problem_analysis}</span> •
            <span>AB: {divisionCounts.algorithm_builder}</span> •
            <span>PR: {divisionCounts.programmer}</span>
          </div>
        </div>

        {/* Card 2: Assessment Attempts */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Started Attempts</span>
            <Clock className="w-4 h-4 text-indigo-400" />
          </div>
          <p className="text-3xl font-extrabold text-white">{startedAssessments}</p>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
            <span className="text-blue-400">Active: {inProgressAssessments}</span> •
            <span className="text-emerald-400">Submitted: {submittedAssessments}</span> •
            <span className="text-red-400">Expired: {expiredAssessments}</span>
          </div>
        </div>

        {/* Card 3: AI Evaluations */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Pending AI Grading</span>
            <Brain className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-3xl font-extrabold text-purple-400">{pendingEvaluations}</p>
          <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1">
            <span className={failedEvaluations > 0 ? 'text-red-400' : 'text-slate-400'}>
              Failed / Retries: {failedEvaluations}
            </span>
          </div>
        </div>

        {/* Card 4: Integrity Flags */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
            <span>Flagged for Review</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-3xl font-extrabold text-amber-400">{flaggedCandidates}</p>
          <div className="text-[11px] text-slate-400 pt-1">
            Total Events Logged: {allEvents.length}
          </div>
        </div>
      </div>

      {/* Division Status Breakdown */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
          Division Assessments Status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {assessments.map((a) => (
            <div key={a.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase">{a.division.replace('_', ' ')}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                  a.is_published
                    ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                    : 'bg-slate-800 text-slate-400'
                }`}>
                  {a.is_published ? 'Published' : 'Draft'}
                </span>
              </div>
              <div className="text-xs text-slate-400 space-y-1">
                <div>Duration: {a.duration_minutes} Minutes</div>
                <div>Required Questions: {a.min_questions} to {a.max_questions}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Audit Logs Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" /> Administrative Audit Trail
          </h3>
          <span className="text-xs text-slate-500">Authoritative UTC recorded, displayed in WIB</span>
        </div>

        {auditLogs.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-4">No administrative actions recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3 font-semibold">Timestamp (WIB)</th>
                  <th className="py-2.5 px-3 font-semibold">Admin</th>
                  <th className="py-2.5 px-3 font-semibold">Action</th>
                  <th className="py-2.5 px-3 font-semibold">Target</th>
                  <th className="py-2.5 px-3 font-semibold">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {auditLogs.slice(0, 10).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap">{formatToWIB(log.created_at)}</td>
                    <td className="py-2.5 px-3 text-blue-400 font-sans">{log.admin_email}</td>
                    <td className="py-2.5 px-3 text-white font-sans font-semibold">{log.action}</td>
                    <td className="py-2.5 px-3 text-slate-400">{log.target_type}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{JSON.stringify(log.details)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
