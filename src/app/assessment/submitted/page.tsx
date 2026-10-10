import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { formatToWIB } from '@/lib/utils/time';
import { CheckCircle2, ArrowLeft, FileCheck } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function SubmittedPage() {
  const session = await getCurrentSession();
  if (!session || !session.profile) {
    redirect('/');
  }

  const assessment = await dataStore.getAssessmentByDivision(session.profile.intended_division);
  const attempt = assessment
    ? await dataStore.getAttemptByCandidateAndAssessment(session.userId, assessment.id)
    : null;

  const answers = attempt ? await dataStore.getAnswersForAttempt(attempt.id) : [];

  return (
    <main className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col justify-center items-center p-6 selection:bg-blue-600 selection:text-white">
      <div className="max-w-lg w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-700/80 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950/50">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block mb-1">
            Receipt Authoritative Confirmation
          </span>
          <h1 className="text-2xl font-extrabold text-white">Assessment Submitted</h1>
          <p className="text-xs text-slate-400 mt-1">
            Your attempt has been finalized and locked against further edits.
          </p>
        </div>

        {/* Attempt Summary Grid */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 text-xs space-y-3 text-left">
          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-400">Candidate:</span>
            <span className="font-semibold text-white">{session.profile.full_name}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-400">Student Email:</span>
            <span className="font-mono text-slate-300">{session.profile.student_email}</span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-400">Division:</span>
            <span className="font-semibold text-blue-400 uppercase">
              {session.profile.intended_division.replace('_', ' ')}
            </span>
          </div>

          <div className="flex justify-between items-center border-b border-slate-900 pb-2">
            <span className="text-slate-400">Submitted At:</span>
            <span className="font-mono text-slate-200">
              {attempt?.submitted_at ? formatToWIB(attempt.submitted_at) : 'Finalized'}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Answers Saved:</span>
            <span className="font-bold text-emerald-400">{answers.length} Recorded</span>
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-blue-950/40 border border-blue-900/60 text-xs text-blue-300 text-left flex items-start gap-2.5">
          <FileCheck className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
          <span>
            Your assessment has been submitted successfully. Your evaluation is being processed and will remain confidential until the administrator completes the review and publishes the results. You do not need to take any further action.
          </span>
        </div>

        <Link
          href="/dashboard"
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Dashboard</span>
        </Link>
      </div>
    </main>
  );
}
