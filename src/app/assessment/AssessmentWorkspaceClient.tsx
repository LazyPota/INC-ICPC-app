'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Profile, Assessment, AssessmentAttempt, Question, CandidateAnswer } from '@/types/database';
import { AssessmentCountdown } from '@/components/assessment/AssessmentCountdown';
import { AutosaveIndicator, type SaveState } from '@/components/assessment/AutosaveIndicator';
import { MonacoCodeEditor } from '@/components/assessment/MonacoCodeEditor';
import { ProctorMonitor } from '@/components/assessment/ProctorMonitor';
import { SubmitConfirmationModal } from '@/components/assessment/SubmitConfirmationModal';
import {
  Terminal,
  CheckCircle2,
  Save,
  Send,
  HelpCircle,
  FileCode,
  Layers,
} from 'lucide-react';

interface Props {
  profile: Profile;
  assessment: Assessment;
  attempt: AssessmentAttempt;
  questions: Question[];
  initialAnswers: CandidateAnswer[];
}

export function AssessmentWorkspaceClient({
  profile,
  assessment,
  attempt,
  questions,
  initialAnswers,
}: Props) {
  const router = useRouter();

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answersMap, setAnswersMap] = useState<Record<string, { answerContent?: string; selectedOption?: string; codeContent?: string }>>(() => {
    const map: Record<string, { answerContent?: string; selectedOption?: string; codeContent?: string }> = {};
    initialAnswers.forEach((ans) => {
      map[ans.question_id] = {
        answerContent: ans.answer_content || '',
        selectedOption: ans.selected_option || '',
        codeContent: ans.code_content || '',
      };
    });
    return map;
  });

  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [lastSavedTime, setLastSavedTime] = useState<string | null>(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sessionId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const sess = sessionStorage.getItem('inc_active_session');
      if (sess) return sess;
    }
    return attempt.active_session_id || `sess_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  });

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Synchronize sessionStorage
  useEffect(() => {
    if (typeof window !== 'undefined' && sessionId) {
      sessionStorage.setItem('inc_active_session', sessionId);
    }
  }, [sessionId]);

  const currentQuestion = questions[activeQuestionIndex];
  const currentAnswer = currentQuestion ? answersMap[currentQuestion.id] || {} : {};

  // Check how many questions have answers
  const answeredCount = questions.filter((q) => {
    const ans = answersMap[q.id];
    if (!ans) return false;
    if (q.question_type === 'multiple_choice') return Boolean(ans.selectedOption);
    if (q.question_type === 'cpp_code') return Boolean(ans.codeContent?.trim());
    return Boolean(ans.answerContent?.trim());
  }).length;

  const performSave = useCallback(
    async (qId: string, content: { answerContent?: string; selectedOption?: string; codeContent?: string }) => {
      setSaveState('saving');
      try {
        const res = await fetch('/api/assessment/save-answer', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            attemptId: attempt.id,
            questionId: qId,
            answerContent: content.answerContent,
            selectedOption: content.selectedOption,
            codeContent: content.codeContent,
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Server rejected save');
        }

        const data = await res.json();
        setSaveState('saved');
        setLastSavedTime(data.savedAt);
      } catch (err) {
        console.warn('Autosave error, keeping cached in browser:', err);
        setSaveState(navigator.onLine ? 'error' : 'offline');
      }
    },
    [attempt.id]
  );

  const handleAnswerChange = (fields: { answerContent?: string; selectedOption?: string; codeContent?: string }) => {
    if (!currentQuestion) return;

    const updated = {
      ...currentAnswer,
      ...fields,
    };

    setAnswersMap((prev) => ({
      ...prev,
      [currentQuestion.id]: updated,
    }));

    // Trigger debounced autosave (1.5 seconds)
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      performSave(currentQuestion.id, updated);
    }, 1500);
  };

  // Immediate manual save
  const handleManualSave = () => {
    if (!currentQuestion) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    performSave(currentQuestion.id, currentAnswer);
  };

  // Handle final submission (early or at deadline)
  const handleFinalize = async () => {
    setIsSubmitting(true);
    try {
      if (currentQuestion) {
        await performSave(currentQuestion.id, currentAnswer);
      }

      const res = await fetch('/api/assessment/finalize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId: attempt.id }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit assessment');
      }

      router.push('/assessment/submitted');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error finalizing submission');
      setIsSubmitting(false);
    }
  };

  // If questions empty, show warning state
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-[#070d17] text-white flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 max-w-md">
          <HelpCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold">No Published Questions Yet</h2>
          <p className="text-xs text-slate-400 mt-2 mb-6">
            The administrator has not yet populated questions for this division. Please check back later.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070d17] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
      {/* Integrity Proctor Monitor in background */}
      {sessionId && (
        <ProctorMonitor
          attemptId={attempt.id}
          sessionId={sessionId}
          currentQuestionId={currentQuestion?.id}
        />
      )}

      {/* Top Authoritative Header */}
      <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400 shrink-0">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-white tracking-tight">{assessment.title}</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-950 border border-blue-800 text-blue-300 uppercase">
                {profile.intended_division.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono">{profile.student_email}</p>
          </div>
        </div>

        {/* Question Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto py-1">
          {questions.map((q, idx) => {
            const ans = answersMap[q.id];
            const isAnswered = q.question_type === 'multiple_choice'
              ? Boolean(ans?.selectedOption)
              : q.question_type === 'cpp_code'
              ? Boolean(ans?.codeContent?.trim())
              : Boolean(ans?.answerContent?.trim());

            const isActive = idx === activeQuestionIndex;

            return (
              <button
                key={q.id}
                onClick={() => {
                  if (currentQuestion) performSave(currentQuestion.id, currentAnswer);
                  setActiveQuestionIndex(idx);
                }}
                className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-900/40 border border-blue-400/50'
                    : isAnswered
                    ? 'bg-slate-900 border border-emerald-800/80 text-emerald-300 hover:bg-slate-800'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:bg-slate-800'
                }`}
              >
                <span>Q{idx + 1}</span>
                {isAnswered && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
              </button>
            );
          })}
        </div>

        {/* Timer & Controls */}
        <div className="flex items-center gap-3">
          <AutosaveIndicator state={saveState} lastSavedAt={lastSavedTime} />

          <AssessmentCountdown
            deadlineAt={attempt.deadline_at}
            onExpire={handleFinalize}
          />

          <button
            onClick={handleManualSave}
            title="Force immediate save"
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
          >
            <Save className="w-3.5 h-3.5 text-slate-400" />
            <span>Save</span>
          </button>

          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg shadow-md transition-colors"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Finish Assessment</span>
          </button>
        </div>
      </header>

      {/* Main Assessment Split Workspace */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 overflow-hidden">
        {/* Left Column: Question Statement & Specs */}
        <section className="lg:col-span-6 border-r border-slate-800/80 p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-65px)] space-y-6">
          <div className="border-b border-slate-800 pb-4 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-blue-400 uppercase tracking-wider block">
                Question {activeQuestionIndex + 1} of {questions.length} • {currentQuestion?.question_type.replace('_', ' ')}
              </span>
              <h2 className="text-xl font-bold text-white mt-1">{currentQuestion?.title}</h2>
            </div>
            <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono font-bold text-blue-300">
              {currentQuestion?.max_score} pts
            </div>
          </div>

          {/* Statement */}
          <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans">
            {currentQuestion?.statement}
          </div>

          {/* Constraints */}
          {currentQuestion?.constraints && (
            <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-400" /> Constraints & Boundaries
              </h3>
              <p className="text-xs font-mono text-slate-300 whitespace-pre-wrap">
                {currentQuestion.constraints}
              </p>
            </div>
          )}

          {/* Examples */}
          {currentQuestion?.examples && currentQuestion.examples.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5 text-blue-400" /> Examples
              </h3>
              {currentQuestion.examples.map((ex, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2 text-xs">
                  <span className="text-[11px] font-bold text-slate-400 uppercase">Example {idx + 1}</span>
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Input:</span>
                      <pre className="p-2 rounded bg-slate-900 font-mono text-slate-200 overflow-x-auto">
                        {ex.input}
                      </pre>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block mb-0.5">Expected Output:</span>
                      <pre className="p-2 rounded bg-slate-900 font-mono text-slate-200 overflow-x-auto">
                        {ex.output}
                      </pre>
                    </div>
                  </div>
                  {ex.explanation && (
                    <p className="text-[11px] text-slate-400 italic pt-1">{ex.explanation}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right Column: Candidate Answer Editor */}
        <section className="lg:col-span-6 p-6 sm:p-8 overflow-y-auto max-h-[calc(100vh-65px)] flex flex-col justify-between bg-slate-950/30">
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Candidate Response
              </span>
              <span className="text-[11px] text-slate-400">
                Autosaved continuously • Strictly proctored
              </span>
            </div>

            {/* Multiple Choice Question Type */}
            {currentQuestion?.question_type === 'multiple_choice' && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-slate-400">Select one correct option:</p>
                {(currentQuestion.options || []).map((opt) => {
                  const isSelected = currentAnswer.selectedOption === opt.id;
                  return (
                    <label
                      key={opt.id}
                      className={`flex items-start gap-3.5 p-4 rounded-xl border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-blue-500 bg-blue-950/40 text-white'
                          : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`question_${currentQuestion.id}`}
                        checked={isSelected}
                        onChange={() => handleAnswerChange({ selectedOption: opt.id })}
                        className="mt-0.5 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm leading-relaxed">{opt.text}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* C++ Code Submission Type */}
            {currentQuestion?.question_type === 'cpp_code' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Language: C++ (GCC Standard)</span>
                  <span>Monaco Editor Active</span>
                </div>
                <MonacoCodeEditor
                  value={currentAnswer.codeContent || ''}
                  onChange={(val) => handleAnswerChange({ codeContent: val })}
                  preventPaste={false}
                />
              </div>
            )}

            {/* Written Answer Types (Short Answer, Long Answer, Pseudocode) */}
            {(currentQuestion?.question_type === 'short_answer' ||
              currentQuestion?.question_type === 'long_answer' ||
              currentQuestion?.question_type === 'pseudocode') && (
              <div className="space-y-2">
                <textarea
                  value={currentAnswer.answerContent || ''}
                  onChange={(e) => handleAnswerChange({ answerContent: e.target.value })}
                  placeholder={
                    currentQuestion.question_type === 'pseudocode'
                      ? 'Write your algorithm pseudocode here...'
                      : 'Provide your detailed technical explanation, complexity derivation, and proof...'
                  }
                  rows={currentQuestion.question_type === 'short_answer' ? 6 : 14}
                  className="w-full p-4 bg-slate-900 border border-slate-800 rounded-xl text-sm font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 leading-relaxed resize-y"
                />
                <div className="flex items-center justify-between text-[11px] text-slate-500">
                  <span>
                    Words: {(currentAnswer.answerContent || '').trim().split(/\s+/).filter(Boolean).length}
                  </span>
                  <span>Characters: {(currentAnswer.answerContent || '').length}</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-slate-800 pt-5 mt-6">
            <button
              onClick={() => {
                if (activeQuestionIndex > 0) {
                  if (currentQuestion) performSave(currentQuestion.id, currentAnswer);
                  setActiveQuestionIndex(activeQuestionIndex - 1);
                }
              }}
              disabled={activeQuestionIndex === 0}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                activeQuestionIndex === 0
                  ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              ← Previous Question
            </button>

            <span className="text-xs text-slate-400">
              Answered: <strong className="text-emerald-400">{answeredCount}</strong> / {questions.length}
            </span>

            <button
              onClick={() => {
                if (activeQuestionIndex < questions.length - 1) {
                  if (currentQuestion) performSave(currentQuestion.id, currentAnswer);
                  setActiveQuestionIndex(activeQuestionIndex + 1);
                } else {
                  setIsSubmitModalOpen(true);
                }
              }}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
            >
              {activeQuestionIndex < questions.length - 1 ? 'Next Question →' : 'Review & Submit'}
            </button>
          </div>
        </section>
      </main>

      {/* Submit Confirmation Dialog */}
      <SubmitConfirmationModal
        isOpen={isSubmitModalOpen}
        totalQuestions={questions.length}
        answeredCount={answeredCount}
        onConfirm={handleFinalize}
        onCancel={() => setIsSubmitModalOpen(false)}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
