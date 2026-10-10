'use client';

import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  totalQuestions: number;
  answeredCount: number;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export function SubmitConfirmationModal({
  isOpen,
  totalQuestions,
  answeredCount,
  onConfirm,
  onCancel,
  isSubmitting,
}: Props) {
  const [acknowledged, setAcknowledged] = useState(false);

  if (!isOpen) return null;

  const unansweredCount = totalQuestions - answeredCount;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-slate-900 border border-slate-750 max-w-md w-full rounded-xl p-6 shadow-2xl text-slate-100 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-4">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Finalize & Submit Assessment</h3>
          </div>
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <p className="text-sm text-slate-300">
            Are you sure you want to finalize your submission? Review your progress below:
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/70 border border-slate-800 rounded-lg p-3 text-center">
              <span className="text-xs text-slate-400 block mb-1">Answered</span>
              <span className="text-xl font-bold text-emerald-400 flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                {answeredCount} / {totalQuestions}
              </span>
            </div>

            <div className={`border rounded-lg p-3 text-center ${
              unansweredCount > 0
                ? 'bg-amber-950/40 border-amber-800/80'
                : 'bg-slate-950/70 border-slate-800'
            }`}>
              <span className="text-xs text-slate-400 block mb-1">Unanswered</span>
              <span className={`text-xl font-bold ${unansweredCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {unansweredCount}
              </span>
            </div>
          </div>

          {unansweredCount > 0 && (
            <div className="text-xs text-amber-300/90 bg-amber-950/40 border border-amber-800/60 rounded-md p-2.5">
              Warning: You have {unansweredCount} unanswered {unansweredCount === 1 ? 'question' : 'questions'}. Unanswered questions will receive zero points.
            </div>
          )}

          <label className="flex items-start gap-2.5 pt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              id="confirm-submit-checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-1 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-xs text-slate-300 leading-snug">
              I understand that submitting is <strong className="text-white">permanent and irreversible</strong>. I will not be able to reopen or edit my answers.
            </span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            Continue Assessment
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={!acknowledged || isSubmitting}
            className={`px-5 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              acknowledged && !isSubmitting
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/40'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Finalizing...' : 'Confirm Submission'}
          </button>
        </div>
      </div>
    </div>
  );
}
