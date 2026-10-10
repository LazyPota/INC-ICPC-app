'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type {
  Profile,
  Assessment,
  AssessmentAttempt,
  Question,
  PrivateQuestionConfig,
  CandidateAnswer,
  IntegrityEvent,
  AiEvaluation,
  ManualScoreOverride,
} from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import {
  ArrowLeft,
  User,
  Mail,
  Award,
  Clock,
  RotateCcw,
  Sparkles,
  ShieldAlert,
  AlertTriangle,
  Edit3,
  CheckCircle2,
  FileCode,
} from 'lucide-react';

interface Props {
  profile: Profile;
  assessment: Assessment | null;
  attempt: AssessmentAttempt | null;
  questions: Array<Question & { privateConfig?: PrivateQuestionConfig }>;
  answers: CandidateAnswer[];
  integrityEvents: IntegrityEvent[];
  evaluations: AiEvaluation[];
  overrides: ManualScoreOverride[];
}

export function CandidateDetailClient({
  profile,
  assessment,
  attempt,
  questions,
  answers,
  integrityEvents,
  evaluations,
  overrides,
}: Props) {
  const router = useRouter();
  const [overrideModal, setOverrideModal] = useState<{ questionId: string; currentScore: number } | null>(null);
  const [overrideScoreInput, setOverrideScoreInput] = useState<string>('');
  const [overrideReasonInput, setOverrideReasonInput] = useState<string>('');
  const [isSubmittingOverride, setIsSubmittingOverride] = useState(false);
  const [isEvaluating, setIsEvaluating] = useState<string | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleScoreOverride = async () => {
    if (!overrideModal || !attempt) return;
    setIsSubmittingOverride(true);
    try {
      const res = await fetch('/api/admin/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId: overrideModal.questionId,
          overrideScore: parseFloat(overrideScoreInput),
          reason: overrideReasonInput,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to override score');

      setOverrideModal(null);
      setOverrideScoreInput('');
      setOverrideReasonInput('');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error overriding score');
    } finally {
      setIsSubmittingOverride(false);
    }
  };

  const handleTriggerEvaluation = async (questionId?: string) => {
    if (!attempt) return;
    setIsEvaluating(questionId || 'all');
    try {
      const res = await fetch('/api/admin/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attemptId: attempt.id,
          questionId,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to trigger evaluation');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error triggering evaluation');
    } finally {
      setIsEvaluating(null);
    }
  };

  const handleResetAttempt = async () => {
    if (!attempt) return;
    const confirm = window.confirm(
      `Are you sure you want to reset this candidate's attempt? This will permanently delete their current submission, answers, and proctor events, allowing them to restart. This action is recorded in the administrative audit log.`
    );
    if (!confirm) return;

    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to reset attempt');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error resetting attempt');
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Back button and header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/candidates"
            className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">{profile.full_name}</h2>
            <p className="text-xs text-slate-400 font-mono">{profile.student_email}</p>
          </div>
        </div>

        {attempt && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleTriggerEvaluation()}
              disabled={isEvaluating !== null}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isEvaluating === 'all' ? 'Grading with AI...' : 'Re-Evaluate All Answers'}</span>
            </button>

            <button
              onClick={handleResetAttempt}
              disabled={isResetting}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-red-950/80 hover:bg-red-900 border border-red-800 text-red-300 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isResetting ? 'Resetting...' : 'Reset Attempt'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Attempt Status Bar */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
        <div>
          <span className="text-slate-400 block mb-1">Division</span>
          <span className="font-bold text-blue-400 uppercase">
            {profile.intended_division.replace('_', ' ')}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Attempt Status</span>
          <span className="font-bold text-white uppercase">{attempt ? attempt.status : 'Not Started'}</span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Started At (WIB)</span>
          <span className="font-mono text-slate-300">
            {attempt ? formatToWIB(attempt.started_at) : 'N/A'}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-1">Submitted At (WIB)</span>
          <span className="font-mono text-slate-300">
            {attempt?.submitted_at ? formatToWIB(attempt.submitted_at) : 'In Progress / None'}
          </span>
        </div>
      </section>

      {/* Questions & Answers Breakdown */}
      <section className="space-y-6">
        <h3 className="text-lg font-bold text-white">Questions & Submissions</h3>

        {questions.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-xs text-slate-500 italic">
            No questions configured for this division yet.
          </div>
        ) : (
          questions.map((q, idx) => {
            const ans = answers.find((a) => a.question_id === q.id);
            const evaluation = evaluations.find((e) => e.question_id === q.id);
            const override = overrides.find((o) => o.question_id === q.id);
            const effectiveScore = override ? override.override_score : evaluation ? evaluation.total_score : 0;

            return (
              <div
                key={q.id}
                className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 space-y-5 shadow-xl"
              >
                {/* Question Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                      Question {idx + 1} • {q.question_type.replace('_', ' ')}
                    </span>
                    <h4 className="text-base font-bold text-white mt-0.5">{q.title}</h4>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block">Awarded Score</span>
                      <span className="text-sm font-bold text-white">
                        {effectiveScore} / {q.max_score} pts
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        setOverrideModal({
                          questionId: q.id,
                          currentScore: effectiveScore,
                        })
                      }
                      className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs flex items-center gap-1.5 transition-colors"
                      title="Override score"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Override</span>
                    </button>
                  </div>
                </div>

                {/* Candidate's Submitted Content */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-slate-400 block">
                    Candidate Submission:
                  </span>
                  {ans ? (
                    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-slate-200 whitespace-pre-wrap leading-relaxed max-h-64 overflow-y-auto">
                      {q.question_type === 'multiple_choice'
                        ? `Selected Option ID: ${ans.selected_option || 'None'}`
                        : q.question_type === 'cpp_code'
                        ? ans.code_content || '[Empty Code]'
                        : ans.answer_content || '[Empty Answer]'}
                    </div>
                  ) : (
                    <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs text-slate-500 italic">
                      No answer submitted for this question.
                    </div>
                  )}
                </div>

                {/* AI Evaluation Card */}
                {evaluation && (
                  <div className="p-5 rounded-xl bg-purple-950/20 border border-purple-900/60 space-y-4 text-xs">
                    <div className="flex items-center justify-between border-b border-purple-900/40 pb-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span className="font-bold text-purple-200">Gemini AI Evaluation</span>
                        <span className="text-[11px] text-purple-300 font-mono">
                          ({evaluation.model_name})
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-purple-300">
                          Confidence: {(evaluation.confidence * 100).toFixed(0)}%
                        </span>
                        <button
                          onClick={() => handleTriggerEvaluation(q.id)}
                          disabled={isEvaluating !== null}
                          className="px-2.5 py-1 bg-purple-900/60 hover:bg-purple-800 text-purple-200 rounded text-[11px] transition-colors"
                        >
                          {isEvaluating === q.id ? 'Evaluating...' : 'Retry AI'}
                        </button>
                      </div>
                    </div>

                    {/* Overall Rationale */}
                    {evaluation.rationale && (
                      <p className="text-slate-300 leading-relaxed italic">
                        &quot;{evaluation.rationale}&quot;
                      </p>
                    )}

                    {/* Criteria breakdown */}
                    <div className="space-y-2 pt-1">
                      <span className="font-semibold text-slate-400 block uppercase text-[10px]">
                        Rubric Criteria Breakdown:
                      </span>
                      {evaluation.criterion_scores.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 space-y-1.5"
                        >
                          <div className="flex items-center justify-between font-semibold">
                            <span className="text-slate-200">{c.criterion || c.criterion_id}</span>
                            <span className="text-purple-300 font-mono">
                              {c.awarded_points ?? c.awarded_score ?? 0} / {c.maximum_points ?? c.max_score ?? 0} pts
                            </span>
                          </div>
                          <p className="text-slate-400 text-[11px]">{c.rationale}</p>
                          {c.evidence && (
                            <p className="text-slate-500 font-mono text-[10px] pt-1">
                              Evidence: {c.evidence}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>

                    {override && (
                      <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/80 text-amber-200 text-xs">
                        <span className="font-bold block mb-0.5">
                          Manual Override Applied by {override.admin_email}:
                        </span>
                        <span>
                          Adjusted from {override.original_score} to {override.override_score} pts • Reason: &quot;{override.reason}&quot;
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>

      {/* Integrity & Proctor Events Timeline */}
      <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-amber-400" /> Integrity Proctor Event Log
        </h3>

        {integrityEvents.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No integrity violations or suspicious events recorded for this candidate.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Timestamp (WIB)</th>
                  <th className="py-2.5 px-3">Event Type</th>
                  <th className="py-2.5 px-3">Severity</th>
                  <th className="py-2.5 px-3">Session ID</th>
                  <th className="py-2.5 px-3">Metadata</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {integrityEvents.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 text-slate-300">{formatToWIB(ev.created_at)}</td>
                    <td className="py-2.5 px-3 text-white font-sans font-semibold">{ev.event_type}</td>
                    <td className="py-2.5 px-3">
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
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-xs">{ev.session_id}</td>
                    <td className="py-2.5 px-3 text-slate-400 truncate max-w-sm">{JSON.stringify(ev.metadata)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Override Score Modal */}
      {overrideModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-white">Manual Score Adjustment</h4>
            <p className="text-xs text-slate-400">
              Enter an adjusted score and a mandatory reason for this change. The modification will be recorded in the administrative audit log.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                New Score (Points)
              </label>
              <input
                type="number"
                step="0.5"
                min="0"
                value={overrideScoreInput}
                onChange={(e) => setOverrideScoreInput(e.target.value)}
                placeholder={overrideModal.currentScore.toString()}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-sm text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Reason for Adjustment <span className="text-red-400">*</span>
              </label>
              <textarea
                value={overrideReasonInput}
                onChange={(e) => setOverrideReasonInput(e.target.value)}
                placeholder="Explain the justification for this score override..."
                rows={3}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setOverrideModal(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!overrideReasonInput.trim() || !overrideScoreInput || isSubmittingOverride}
                onClick={handleScoreOverride}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                {isSubmittingOverride ? 'Saving...' : 'Save Override'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
