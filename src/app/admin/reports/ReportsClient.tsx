'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type {
  Assessment,
  ConfidentialReport,
  Profile,
  AssessmentAttempt,
  AiEvaluation,
  Question,
  DivisionType,
  ReportSummary,
} from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import {
  FileText,
  Download,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Lock,
  Users,
  Search,
  Shield,
  ShieldOff,
  X,
} from 'lucide-react';

interface CandidateRecord {
  profile: Profile;
  attempt: AssessmentAttempt | null;
  answersCount: number;
  integrityEventCount: number;
  totalScore: number;
  evalStatus: string;
}

interface Props {
  initialAssessments: Assessment[];
  initialReports: ConfidentialReport[];
  candidates: CandidateRecord[];
  evaluations: AiEvaluation[];
  questions: Question[];
}

export function ReportsClient({
  initialAssessments,
  initialReports,
  candidates,
  evaluations,
  questions,
}: Props) {
  const router = useRouter();
  const [selectedDivision, setSelectedDivision] = useState<DivisionType>('problem_analysis');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [actionMessage, setActionMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Generate Report Modal State
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [candidateScope, setCandidateScope] = useState<'all' | 'custom'>('all');
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<string[]>([]);
  const [hideIntegrityLogs, setHideIntegrityLogs] = useState(false);
  const [forceReport, setForceReport] = useState(false);
  const [candidateFilterQuery, setCandidateFilterQuery] = useState('');

  // Publish Modal State
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [confirmPartialPublish, setConfirmPartialPublish] = useState(false);

  const currentAssessment =
    initialAssessments.find((a) => a.division === selectedDivision) || initialAssessments[0];

  const reportsForCurrentDivision = initialReports.filter(
    (r) => r.assessment_id === currentAssessment?.id
  );

  const divisionCandidates = candidates.filter(
    (c) => c.profile.intended_division === selectedDivision
  );

  const divisionEvals = evaluations.filter((e) => {
    const q = questions.find((item) => item.id === e.question_id);
    return q?.division === selectedDivision;
  });

  const completedEvalsCount = divisionEvals.filter((e) => e.status === 'completed').length;
  const unresolvedEvalsCount = divisionEvals.filter(
    (e) => e.status === 'needs_review' || e.status === 'failed'
  ).length;

  const searchLower = candidateFilterQuery.trim().toLowerCase();
  const modalCandidates = divisionCandidates.filter((c) => {
    if (!searchLower) return true;
    return (
      c.profile.full_name?.toLowerCase().includes(searchLower) ||
      c.profile.student_email?.toLowerCase().includes(searchLower)
    );
  });

  const openGenerateModal = (isForce = false) => {
    setForceReport(isForce);
    setCandidateScope('all');
    setSelectedCandidateIds(divisionCandidates.map((c) => c.profile.id));
    setHideIntegrityLogs(false);
    setCandidateFilterQuery('');
    setIsGenerateModalOpen(true);
  };

  const toggleCandidateSelection = (id: string) => {
    setSelectedCandidateIds((prev) =>
      prev.includes(id) ? prev.filter((cId) => cId !== id) : [...prev, id]
    );
  };

  const selectAllCandidates = () => {
    setSelectedCandidateIds(divisionCandidates.map((c) => c.profile.id));
  };

  const deselectAllCandidates = () => {
    setSelectedCandidateIds([]);
  };

  const handleConfirmGenerateReport = async () => {
    if (!currentAssessment) return;
    if (candidateScope === 'custom' && selectedCandidateIds.length === 0) {
      setActionMessage({
        type: 'error',
        text: 'Please select at least one candidate to generate the confidential report.',
      });
      return;
    }

    setIsGenerating(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: currentAssessment.id,
          force: forceReport,
          candidateIds: candidateScope === 'custom' ? selectedCandidateIds : undefined,
          hideIntegrityLogs,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setIsGenerateModalOpen(false);
      setActionMessage({
        type: 'success',
        text: data.message || 'Report generated successfully.',
      });
      router.refresh();
    } catch (err: unknown) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Error generating report',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePublishResults = async () => {
    if (!currentAssessment) return;
    setIsPublishing(true);
    setActionMessage(null);
    try {
      const res = await fetch('/api/admin/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId: currentAssessment.id,
          forcePartial: confirmPartialPublish,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || data.error || 'Failed to publish results');
      }

      setIsPublishModalOpen(false);
      setActionMessage({
        type: 'success',
        text: `Results officially published to candidates on ${formatToWIB(data.publishedAt)} WIB.`,
      });
      router.refresh();
    } catch (err: unknown) {
      setActionMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Publication failed',
      });
    } finally {
      setIsPublishing(false);
    }
  };


  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <Lock className="w-6 h-6 text-rose-500" />
            Confidential Reports & Result Publication
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Compile consolidated PDF reports following the global closing deadline, review provisional AI evaluations, adjust scores with mandatory reasons, and authorize publication to candidate dashboards.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => openGenerateModal(false)}
            disabled={isGenerating}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white transition-colors flex items-center gap-2 shadow-lg shadow-blue-950/40"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
            <span>{isGenerating ? 'Generating PDF...' : 'Generate Consolidated Report'}</span>
          </button>

          <button
            onClick={() => {
              setConfirmPartialPublish(false);
              setIsPublishModalOpen(true);
            }}
            disabled={currentAssessment?.is_results_published}
            className={`px-4 py-2 text-xs font-bold rounded-xl transition-colors flex items-center gap-2 ${
              currentAssessment?.is_results_published
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800 cursor-default'
                : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>
              {currentAssessment?.is_results_published ? 'Results Published' : 'Publish Final Results'}
            </span>
          </button>
        </div>
      </div>

      {actionMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-start gap-2.5 ${
            actionMessage.type === 'success'
              ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-200'
              : 'bg-red-950/80 border border-red-800 text-red-200'
          }`}
        >
          {actionMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          )}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Division Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        {[
          { id: 'problem_analysis', label: 'Problem Analysis' },
          { id: 'algorithm_builder', label: 'Algorithm Builder' },
          { id: 'programmer', label: 'Programmer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setSelectedDivision(tab.id as DivisionType);
              setActionMessage(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              selectedDivision === tab.id
                ? 'border-rose-500 text-rose-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Cohort Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block mb-1">Global Closing Deadline</span>
          <span className="font-mono font-bold text-white block">
            {currentAssessment?.global_closing_at
              ? formatToWIB(currentAssessment.global_closing_at)
              : 'Not Configured'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {currentAssessment?.global_closing_at ? 'Stored UTC • Displayed WIB' : 'Configure in Assessments tab'}
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block mb-1">Registered Candidates</span>
          <span className="font-mono font-bold text-white text-base block">
            {divisionCandidates.length}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {divisionCandidates.filter((c) => c.attempt !== null).length} started attempt
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block mb-1">Evaluations Status</span>
          <span className="font-mono font-bold text-emerald-400 text-base block">
            {completedEvalsCount} Completed
          </span>
          <span className="text-[10px] text-rose-400 font-semibold mt-1 block">
            {unresolvedEvalsCount} Requiring Review
          </span>
        </div>

        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <span className="text-slate-400 block mb-1">Candidate Release State</span>
          <span
            className={`font-mono font-bold text-base block ${
              currentAssessment?.is_results_published ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {currentAssessment?.is_results_published ? 'Released (Published)' : 'Confidential (Locked)'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {currentAssessment?.is_results_published
              ? `Published on ${formatToWIB(currentAssessment.results_published_at || '')}`
              : 'Provisional AI grades held'}
          </span>
        </div>
      </div>

      {/* Section 1: Confidential PDF Report Runs Table */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            Consolidated Assessment PDF Reports
          </h3>
          <span className="text-[11px] text-slate-400">
            {reportsForCurrentDivision.length} Report Run(s) Recorded
          </span>
        </div>

        {reportsForCurrentDivision.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-950/60 border border-slate-800/80 text-center text-xs text-slate-400 space-y-3">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p>No consolidated report has been generated yet for this division.</p>
            <p className="text-[11px] text-slate-500 max-w-md mx-auto">
              Once the global closing deadline passes or when you initiate generation, a comprehensive multi-page PDF will be saved to private Supabase storage.
            </p>
            <button
              onClick={() => openGenerateModal(true)}
              disabled={isGenerating}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
            >
              Force Generate Draft Report
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-950/70 border-b border-slate-800">
                <tr>
                  <th className="p-3">Run Version</th>
                  <th className="p-3">Generation Status</th>
                  <th className="p-3">Candidate Scope</th>
                  <th className="p-3">Proctoring Telemetry</th>
                  <th className="p-3">Evaluations</th>
                  <th className="p-3">Email Notification</th>
                  <th className="p-3">Created (WIB)</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {reportsForCurrentDivision.map((rep) => {
                  const summary = (rep.summary_json || {}) as Partial<ReportSummary>;
                  const isFiltered = Boolean(summary.isCandidateFiltered);
                  const logsHidden = Boolean(summary.hideIntegrityLogs);

                  return (
                    <tr key={rep.id} className="hover:bg-slate-950/40">
                      <td className="p-3 font-mono font-bold text-white">v{rep.version}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            rep.status === 'ready' || rep.status === 'notification_sent'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : rep.status === 'generating'
                              ? 'bg-blue-950 text-blue-300 border border-blue-800 animate-pulse'
                              : 'bg-red-950 text-red-300 border border-red-800'
                          }`}
                        >
                          {rep.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-3">
                        {isFiltered ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-950/80 text-purple-300 border border-purple-800 inline-flex items-center gap-1">
                            <Users className="w-3 h-3 text-purple-400" />
                            <span>{rep.total_candidates} Selected</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 inline-flex items-center gap-1">
                            <span>All ({rep.total_candidates})</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        {logsHidden ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-amber-950/80 text-amber-300 border border-amber-800 inline-flex items-center gap-1">
                            <ShieldOff className="w-3 h-3 text-amber-400" />
                            <span>Omitted</span>
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-slate-800/80 text-slate-300 border border-slate-700/60 inline-flex items-center gap-1">
                            <Shield className="w-3 h-3 text-slate-400" />
                            <span>Included</span>
                          </span>
                        )}
                      </td>
                      <td className="p-3">
                        <span className="text-emerald-400 font-mono font-semibold">{rep.reviewed_count} OK</span>
                        {rep.unresolved_count > 0 && (
                          <span className="text-rose-400 font-mono font-semibold ml-2">
                            ({rep.unresolved_count} Review)
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-[11px]">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] uppercase ${
                            rep.email_status === 'sent'
                              ? 'bg-emerald-950 text-emerald-300'
                              : rep.email_status === 'unconfigured'
                              ? 'bg-slate-800 text-slate-400'
                              : 'bg-red-950 text-red-300'
                          }`}
                        >
                          {rep.email_status}
                        </span>
                        {rep.email_recipient && (
                          <span className="text-slate-500 block text-[10px] mt-0.5">{rep.email_recipient}</span>
                        )}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{formatToWIB(rep.created_at)}</td>
                      <td className="p-3 text-right space-x-2">
                        {rep.pdf_storage_path && (
                          <a
                            href={`/api/admin/reports/${rep.id}/download`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-300 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download PDF</span>
                          </a>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Section 2: Candidate Evaluations & Score Override Dossier */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              Candidate Evaluations & Score Overrides
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Review provisional rubric evaluations, inspect confidence, and adjust scores with a mandatory reason.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="text-[11px] font-bold text-slate-400 uppercase bg-slate-950/70 border-b border-slate-800">
              <tr>
                <th className="p-3">Candidate</th>
                <th className="p-3">Email</th>
                <th className="p-3">Attempt Status</th>
                <th className="p-3">Provisional / Approved Score</th>
                <th className="p-3">Review Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {divisionCandidates.map((cand) => {
                const candEvals = evaluations.filter((e) => e.attempt_id === cand.attempt?.id);
                const hasNeedsReview = candEvals.some(
                  (e) => e.status === 'needs_review' || e.status === 'failed'
                );

                return (
                  <tr key={cand.profile.id} className="hover:bg-slate-950/40">
                    <td className="p-3 font-semibold text-white">{cand.profile.full_name}</td>
                    <td className="p-3 font-mono text-slate-400">{cand.profile.student_email}</td>
                    <td className="p-3">
                      <span className="font-mono text-[11px] text-slate-300">
                        {cand.attempt ? cand.attempt.status : 'No Attempt (Absent)'}
                      </span>
                    </td>
                    <td className="p-3 font-mono font-bold text-purple-300">
                      {cand.totalScore} pts
                    </td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          cand.evalStatus === 'Completed'
                            ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                            : hasNeedsReview
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {cand.evalStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <a
                        href={`/admin/candidates/${cand.profile.id}`}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect Dossier</span>
                      </a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Confirmation Modal: Publish Final Results */}
      {isPublishModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2.5 rounded-xl bg-emerald-950 border border-emerald-700 text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Publish Assessment Results</h3>
                <p className="text-xs text-slate-400">Confirmation Summary & Authoritative Action</p>
              </div>
            </div>

            {/* Summary Metrics */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center text-slate-400">
                <span>Assessment:</span>
                <span className="font-semibold text-white">{currentAssessment?.title}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Total Candidates:</span>
                <span className="font-mono font-bold text-white">{divisionCandidates.length}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Evaluations Completed:</span>
                <span className="font-mono font-bold text-emerald-400">{completedEvalsCount}</span>
              </div>
              <div className="flex justify-between items-center text-slate-400">
                <span>Unresolved Evaluations:</span>
                <span
                  className={`font-mono font-bold ${
                    unresolvedEvalsCount > 0 ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  {unresolvedEvalsCount}
                </span>
              </div>
            </div>

            {unresolvedEvalsCount > 0 && (
              <div className="p-3.5 rounded-xl bg-amber-950/70 border border-amber-800 text-amber-200 text-xs space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>Unresolved Evaluations Warning</span>
                </div>
                <p className="leading-relaxed">
                  There are {unresolvedEvalsCount} evaluation(s) requiring review. By default, publishing with unresolved evaluations is disallowed to prevent publishing incomplete scores.
                </p>
                <label className="flex items-center gap-2 pt-1 font-semibold text-amber-100 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={confirmPartialPublish}
                    onChange={(e) => setConfirmPartialPublish(e.target.checked)}
                    className="rounded bg-slate-950 border-slate-700 text-amber-500 focus:ring-0"
                  />
                  <span>I authorize publishing partial results for resolved candidates</span>
                </label>
              </div>
            )}

            <p className="text-xs text-slate-400 leading-relaxed">
              Once published, candidate dashboards will display their final approved grades and committee notes. This action is permanently recorded in the administrative audit log.
            </p>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsPublishModalOpen(false)}
                disabled={isPublishing}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                onClick={handlePublishResults}
                disabled={isPublishing || (unresolvedEvalsCount > 0 && !confirmPartialPublish)}
                className="px-5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                {isPublishing ? 'Publishing...' : 'Confirm & Publish Results'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Configuration Modal: Generate Consolidated Confidential Report */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-950 border border-blue-700 text-blue-400">
                  <FileText className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Generate Confidential Report</h3>
                  <p className="text-xs text-slate-400">
                    {currentAssessment?.title} • {selectedDivision.replace('_', ' ').toUpperCase()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
                className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              {/* Option 1: Candidate Inclusion Scope */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-200 block">Candidate Inclusion Scope</label>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setCandidateScope('all')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      candidateScope === 'all'
                        ? 'bg-blue-950/50 border-blue-600 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>All Candidates</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-blue-900/60 text-blue-300">
                        {divisionCandidates.length}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Compile full division cohort into the consolidated dossier.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCandidateScope('custom')}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      candidateScope === 'custom'
                        ? 'bg-blue-950/50 border-blue-600 text-white'
                        : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                    }`}
                  >
                    <div className="font-bold flex items-center justify-between">
                      <span>Select Candidates</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-purple-900/60 text-purple-300">
                        {selectedCandidateIds.length} Selected
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Filter to specific candidates for targeted review or sharing.
                    </p>
                  </button>
                </div>
              </div>

              {/* Candidate Selection List (when custom) */}
              {candidateScope === 'custom' && (
                <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="relative flex-1">
                      <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
                      <input
                        type="text"
                        value={candidateFilterQuery}
                        onChange={(e) => setCandidateFilterQuery(e.target.value)}
                        placeholder="Filter by name or email..."
                        className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                        type="button"
                        onClick={selectAllCandidates}
                        className="text-blue-400 hover:text-blue-300 font-semibold"
                      >
                        Select All
                      </button>
                      <span className="text-slate-600">•</span>
                      <button
                        type="button"
                        onClick={deselectAllCandidates}
                        className="text-slate-400 hover:text-slate-300"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="max-h-48 overflow-y-auto space-y-1 divide-y divide-slate-800/60 border border-slate-800 rounded-lg p-1 bg-slate-900/50">
                    {modalCandidates.length === 0 ? (
                      <p className="text-center text-xs text-slate-500 py-4">No candidates match your search.</p>
                    ) : (
                      modalCandidates.map((cand) => {
                        const isSelected = selectedCandidateIds.includes(cand.profile.id);
                        return (
                          <label
                            key={cand.profile.id}
                            className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                              isSelected ? 'bg-blue-950/40 text-white' : 'hover:bg-slate-800/40 text-slate-300'
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleCandidateSelection(cand.profile.id)}
                                className="rounded bg-slate-950 border-slate-700 text-blue-500 focus:ring-0 shrink-0"
                              />
                              <div className="min-w-0">
                                <div className="font-semibold text-xs truncate">{cand.profile.full_name}</div>
                                <div className="text-[10px] text-slate-400 font-mono truncate">
                                  {cand.profile.student_email}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[10px]">
                              <span className="font-mono text-purple-300 font-semibold">{cand.totalScore} pts</span>
                              <span
                                className={`px-1.5 py-0.5 rounded uppercase font-medium ${
                                  cand.attempt?.status === 'submitted'
                                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                                    : cand.attempt
                                    ? 'bg-slate-800 text-slate-300'
                                    : 'bg-red-950/60 text-red-400 border border-red-900'
                                }`}
                              >
                                {cand.attempt ? cand.attempt.status : 'Absent'}
                              </span>
                            </div>
                          </label>
                        );
                      })
                    )}
                  </div>
                  <div className="text-[11px] text-slate-400 text-right">
                    {selectedCandidateIds.length} candidate(s) selected for inclusion
                  </div>
                </div>
              )}

              {/* Option 2: Integrity & Proctoring Telemetry */}
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideIntegrityLogs}
                    onChange={(e) => setHideIntegrityLogs(e.target.checked)}
                    className="mt-0.5 rounded bg-slate-900 border-slate-700 text-amber-500 focus:ring-0 shrink-0"
                  />
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-1.5">
                      <ShieldOff className="w-3.5 h-3.5 text-amber-400" />
                      <span>Omit Integrity & Proctoring Logs from PDF</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                      Removes Section D proctoring telemetry (tab switching, paste events, focus loss flags, and timestamps) from the generated PDF dossier. Ideal when distributing evaluations to external review boards or non-proctoring faculty.
                    </p>
                  </div>
                </label>
              </div>

              {/* Option 3: Force Generation Ahead of Deadline */}
              <div className="bg-slate-950/50 border border-slate-800/80 rounded-xl p-3 text-xs">
                <label className="flex items-center gap-2.5 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={forceReport}
                    onChange={(e) => setForceReport(e.target.checked)}
                    className="rounded bg-slate-900 border-slate-700 text-blue-500 focus:ring-0"
                  />
                  <span>Force generation / regenerate draft even if deadline has not passed</span>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsGenerateModalOpen(false)}
                disabled={isGenerating}
                className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmGenerateReport}
                disabled={isGenerating || (candidateScope === 'custom' && selectedCandidateIds.length === 0)}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-blue-950/40"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
                <span>{isGenerating ? 'Generating PDF...' : 'Generate Consolidated PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
