'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile, Assessment, AssessmentAttempt, DivisionType } from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import {
  Terminal,
  User,
  Mail,
  Award,
  Clock,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  LogOut,
  CheckCircle2,
  FileText,
  Lock,
} from 'lucide-react';

interface Props {
  profile: Profile;
  assessment: Assessment | null;
  attempt: AssessmentAttempt | null;
}

const divisionNames: Record<DivisionType, string> = {
  problem_analysis: 'Problem Analysis',
  algorithm_builder: 'Algorithm Builder',
  programmer: 'Programmer',
};

export function CandidateDashboardClient({ profile, assessment, attempt }: Props) {
  const router = useRouter();
  const [selectedDivision, setSelectedDivision] = useState<DivisionType>(profile.intended_division);
  const [isChangingDivision, setIsChangingDivision] = useState(false);
  const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
  const [hasAcknowledged, setHasAcknowledged] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAttemptActive = attempt && attempt.status === 'in_progress';
  const isAttemptCompleted = attempt && (attempt.status === 'submitted' || attempt.status === 'expired');

  const handleDivisionChange = async (newDiv: DivisionType) => {
    setSelectedDivision(newDiv);
    setIsChangingDivision(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/auth/division', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ division: newDiv }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update division');
      router.refresh();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Error changing division');
    } finally {
      setIsChangingDivision(false);
    }
  };

  const handleStartOrResumeAssessment = async () => {
    if (isAttemptActive) {
      router.push('/assessment');
      return;
    }

    setIsStarting(true);
    setErrorMsg(null);
    try {
      const sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
      const res = await fetch('/api/assessment/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          division: profile.intended_division,
          sessionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to start assessment');
      }

      // Store local session id
      sessionStorage.setItem('inc_active_session', sessionId);
      router.push('/assessment');
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to start assessment');
      setIsStarting(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  // Status mapping
  const getStatusBadge = () => {
    if (!assessment || !assessment.is_published) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">
          Not Published Yet
        </span>
      );
    }
    if (!attempt) {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800">
          Available to Start
        </span>
      );
    }
    if (attempt.status === 'in_progress') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-950/80 text-blue-300 border border-blue-700 animate-pulse">
          In Progress
        </span>
      );
    }
    if (attempt.status === 'submitted') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-950/70 text-purple-300 border border-purple-800">
          Submitted • Grading Pending
        </span>
      );
    }
    if (attempt.status === 'expired') {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-medium bg-red-950/70 text-red-300 border border-red-800">
          Time Expired • Auto-Submitted
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-medium bg-slate-800 text-slate-300">
        {attempt.status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col justify-between">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white tracking-tight">Candidate Dashboard</h1>
            <p className="text-xs text-slate-400">ICPC INC 2026 Qualification Program</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-300">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span>{profile.full_name}</span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-10 space-y-8">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-sm flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Candidate Profile Card */}
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" /> Candidate Name
            </span>
            <p className="text-lg font-bold text-white">{profile.full_name}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" /> Student Institutional Email
            </span>
            <p className="text-sm font-mono text-slate-200">{profile.student_email}</p>
          </div>

          <div className="space-y-1">
            <span className="text-xs text-slate-400 flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-slate-400" /> Intended Division
            </span>
            {attempt ? (
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-blue-400">
                  {divisionNames[profile.intended_division]}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1" title="Locked after attempt start">
                  <Lock className="w-3 h-3" /> Locked
                </span>
              </div>
            ) : (
              <select
                value={selectedDivision}
                disabled={isChangingDivision}
                onChange={(e) => handleDivisionChange(e.target.value as DivisionType)}
                className="w-full text-xs font-semibold px-2.5 py-1.5 bg-slate-950 border border-slate-700 rounded-lg text-blue-400 focus:outline-none focus:border-blue-500"
              >
                <option value="problem_analysis">Problem Analysis</option>
                <option value="algorithm_builder">Algorithm Builder</option>
                <option value="programmer">Programmer</option>
              </select>
            )}
          </div>
        </section>

        {/* Assessment Card */}
        <section className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-6">
            <div>
              <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">
                Assigned Division Assessment
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                {assessment?.title || `${divisionNames[profile.intended_division]} Qualification Assessment`}
              </h2>
            </div>
            <div>{getStatusBadge()}</div>
          </div>

          {/* Assessment Specs Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-blue-950/60 border border-blue-800 text-blue-400">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Total Duration</span>
                <span className="text-sm font-bold text-white">180 Minutes (3 Hours)</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-indigo-950/60 border border-indigo-800 text-indigo-400">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Question Structure</span>
                <span className="text-sm font-bold text-white">3 to 5 Division Questions</span>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5">
              <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-800 text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Autosave Engine</span>
                <span className="text-sm font-bold text-white">Continuous & Resilient</span>
              </div>
            </div>
          </div>

          {/* Attempt Info / Action */}
          {isAttemptCompleted ? (
            <div className="bg-slate-950/90 border border-purple-900/60 rounded-xl p-6 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-purple-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Assessment Successfully Submitted</h3>
              <p className="text-xs text-slate-300 max-w-lg mx-auto">
                Your answers have been finalized and recorded securely in the database on{' '}
                <span className="font-mono text-purple-300">
                  {attempt?.submitted_at ? formatToWIB(attempt.submitted_at) : 'Completed'}
                </span>
                . The qualification evaluation is underway.
              </p>
              <button
                onClick={() => router.push('/assessment/submitted')}
                className="mt-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg transition-colors"
              >
                View Submission Receipt
              </button>
            </div>
          ) : isAttemptActive ? (
            <div className="bg-blue-950/30 border border-blue-800/80 rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h4 className="text-sm font-bold text-white">Your Assessment Is Currently In Progress!</h4>
                <p className="text-xs text-slate-300 mt-1">
                  Server Deadline:{' '}
                  <span className="font-mono font-semibold text-blue-300">
                    {formatToWIB(attempt.deadline_at)}
                  </span>
                </p>
              </div>
              <button
                onClick={handleStartOrResumeAssessment}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-lg shadow-lg shadow-blue-900/50 transition-colors flex items-center gap-2"
              >
                <span>Resume Assessment</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
              <p className="text-xs text-slate-400 max-w-md">
                Ensure you have a stable workspace and 3 uninterrupted hours. The timer starts the instant you confirm and open the assessment.
              </p>

              {assessment?.is_published ? (
                <button
                  onClick={() => setIsRulesModalOpen(true)}
                  className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-xl shadow-blue-900/40 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Start Assessment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  disabled
                  className="w-full sm:w-auto px-7 py-3.5 bg-slate-800 text-slate-500 font-medium text-sm rounded-xl cursor-not-allowed"
                >
                  Assessment Not Yet Published
                </button>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Rules Acknowledgment Modal */}
      {isRulesModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
              <div className="p-2 rounded-lg bg-blue-950 border border-blue-700 text-blue-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">ICPC INC 2026 Assessment Regulations</h3>
                <p className="text-xs text-slate-400">Please review all rules before the countdown begins</p>
              </div>
            </div>

            <div className="space-y-3 text-xs text-slate-300 leading-relaxed max-h-[50vh] overflow-y-auto pr-1">
              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <strong className="text-white block mb-1">1. Fixed 3-Hour Server Timer:</strong>
                The assessment timer is strictly 180 minutes. The countdown runs authoritatively on the server. Refreshing the page, closing the tab, or switching devices will not pause the timer.
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <strong className="text-white block mb-1">2. Single Active Session & Proctoring:</strong>
                Opening duplicate assessment tabs or multiple windows is prohibited. Tab switches, window blur events, and clipboard actions are logged to an audit event trail.
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <strong className="text-white block mb-1">3. Autosave & Deadline Finalization:</strong>
                Your answers are saved automatically as you write. When the 3-hour deadline expires, your latest saved answers are automatically finalized and submitted.
              </div>

              <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg">
                <strong className="text-white block mb-1">4. Division Locking:</strong>
                Once you open the assessment, your selected division ({divisionNames[profile.intended_division]}) is locked and cannot be changed.
              </div>
            </div>

            <label className="flex items-start gap-3 pt-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-200">
                I have read, understood, and agreed to abide by all the ICPC INC 2026 assessment rules and integrity monitoring policies.
              </span>
            </label>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsRulesModalOpen(false)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!hasAcknowledged || isStarting}
                onClick={handleStartOrResumeAssessment}
                className={`px-6 py-2.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 ${
                  hasAcknowledged && !isStarting
                    ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                }`}
              >
                {isStarting ? 'Initiating Assessment...' : 'I Agree & Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-800/60 px-6 py-6 text-center text-xs text-slate-500">
        ICPC INC 2026 Candidate Assessment Platform • President University
      </footer>
    </div>
  );
}
