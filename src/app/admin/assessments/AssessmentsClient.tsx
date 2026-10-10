'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Assessment, Question, PrivateQuestionConfig, DivisionType, QuestionType, RubricCriterion } from '@/types/database';
import { formatToWIB } from '@/lib/utils/time';
import {
  FileQuestion,
  Plus,
  Eye,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Sparkles,
  Shield,
  X,
  Calendar,
  Clock,
} from 'lucide-react';

interface AssessmentWithQuestions extends Assessment {
  questions: Array<Question & { privateConfig?: PrivateQuestionConfig }>;
}

export function AssessmentsClient({
  initialAssessments,
}: {
  initialAssessments: AssessmentWithQuestions[];
}) {
  const router = useRouter();
  const [activeDivision, setActiveDivision] = useState<DivisionType>('problem_analysis');
  const [editingQuestion, setEditingQuestion] = useState<{
    question: Partial<Question>;
    privateConfig: { reference_answer?: string; grading_rubric: RubricCriterion[] };
  } | null>(null);
  const [previewQuestion, setPreviewQuestion] = useState<Question | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isUpdatingPublish, setIsUpdatingPublish] = useState(false);
  const [isUpdatingDeadline, setIsUpdatingDeadline] = useState(false);
  const [deadlineInput, setDeadlineInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const currentAssessment =
    initialAssessments.find((a) => a.division === activeDivision) || initialAssessments[0];

  const handleUpdateDeadline = async (val: string | null) => {
    if (!currentAssessment) return;
    setIsUpdatingDeadline(true);
    setErrorMessage(null);
    try {
      let isoString: string | null = null;
      if (val) {
        const parsed = new Date(val);
        if (isNaN(parsed.getTime())) throw new Error('Invalid deadline format');
        isoString = parsed.toISOString();
      }
      const res = await fetch('/api/admin/assessments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentAssessment.id,
          global_closing_at: isoString,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update global closing deadline');
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating deadline');
    } finally {
      setIsUpdatingDeadline(false);
    }
  };

  const handleTogglePublish = async () => {
    if (!currentAssessment) return;
    setIsUpdatingPublish(true);
    setErrorMessage(null);
    try {
      const nextStatus = !currentAssessment.is_published;
      const res = await fetch('/api/admin/assessments', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: currentAssessment.id,
          is_published: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update publication status');
      }
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error updating publication status');
    } finally {
      setIsUpdatingPublish(false);
    }
  };

  const handleDeleteQuestion = async (qId: string) => {
    const confirm = window.confirm('Are you sure you want to delete this question?');
    if (!confirm) return;

    try {
      const res = await fetch(`/api/admin/questions?id=${qId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete question');
      router.refresh();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error deleting question');
    }
  };

  const handleSaveQuestion = async () => {
    if (!editingQuestion || !currentAssessment) return;
    setIsSaving(true);
    setErrorMessage(null);
    try {
      const payload = {
        question: {
          ...editingQuestion.question,
          assessment_id: currentAssessment.id,
          division: activeDivision,
          order_index: editingQuestion.question.order_index || (currentAssessment.questions.length + 1),
          max_score: Number(editingQuestion.question.max_score) || 100,
          is_enabled: editingQuestion.question.is_enabled !== undefined ? editingQuestion.question.is_enabled : true,
        },
        privateConfig: editingQuestion.privateConfig,
      };

      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save question');

      setEditingQuestion(null);
      router.refresh();
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Error saving question');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="p-8 space-y-8 max-w-6xl mx-auto">
      {/* Title */}
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">
          Assessment & Question Management
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure assessments for each division, enforce 3 to 5 question limits, and manage question rubrics
        </p>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/80 border border-red-800 text-red-200 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Division Selector Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        {[
          { id: 'problem_analysis', label: 'Problem Analysis' },
          { id: 'algorithm_builder', label: 'Algorithm Builder' },
          { id: 'programmer', label: 'Programmer' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveDivision(tab.id as DivisionType);
              setErrorMessage(null);
            }}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              activeDivision === tab.id
                ? 'border-blue-500 text-blue-400 bg-slate-900/40'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Assessment Controls Card */}
      {currentAssessment && (
        <section className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider block">
                {currentAssessment.division.replace('_', ' ')} Assessment
              </span>
              <h3 className="text-lg font-bold text-white mt-0.5">{currentAssessment.title}</h3>
            </div>

            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                currentAssessment.is_published
                  ? 'bg-emerald-950 border border-emerald-800 text-emerald-300'
                  : 'bg-slate-800 text-slate-400'
              }`}>
                {currentAssessment.is_published ? 'Published (Live)' : 'Draft (Unpublished)'}
              </span>

              <button
                onClick={handleTogglePublish}
                disabled={isUpdatingPublish}
                className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                  currentAssessment.is_published
                    ? 'bg-amber-950/80 hover:bg-amber-900 border border-amber-800 text-amber-300'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {isUpdatingPublish
                  ? 'Updating...'
                  : currentAssessment.is_published
                  ? 'Unpublish Assessment'
                  : 'Publish Assessment'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Time Limit</span>
              <span className="font-bold text-white">{currentAssessment.duration_minutes} Minutes (3 Hours)</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Required Question Count</span>
              <span className="font-bold text-white">{currentAssessment.min_questions} to {currentAssessment.max_questions} Questions</span>
            </div>

            <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl">
              <span className="text-slate-400 block mb-1">Current Enabled Questions</span>
              <span className={`font-bold ${
                currentAssessment.questions.filter((q) => q.is_enabled).length < 3
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}>
                {currentAssessment.questions.filter((q) => q.is_enabled).length} Questions
              </span>
            </div>
          </div>

          {/* Global Closing Deadline Panel */}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  Cohort Global Closing Deadline (WIB)
                </span>
                <p className="text-[11px] text-slate-400 mt-0.5 max-w-xl">
                  Determines when the assessment window closes for the entire cohort and when the consolidated PDF report can be prepared. Candidates who reach this deadline will be finalized with their latest saved answers.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold ${
                  currentAssessment.global_closing_at
                    ? 'bg-blue-950/70 text-blue-300 border border-blue-800'
                    : 'bg-amber-950/70 text-amber-300 border border-amber-800'
                }`}>
                  {currentAssessment.global_closing_at
                    ? formatToWIB(currentAssessment.global_closing_at)
                    : 'Deadline Not Configured'}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <input
                type="datetime-local"
                value={deadlineInput}
                onChange={(e) => setDeadlineInput(e.target.value)}
                className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-white font-mono focus:border-blue-500 focus:outline-none"
              />
              <button
                onClick={() => handleUpdateDeadline(deadlineInput)}
                disabled={isUpdatingDeadline || !deadlineInput}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg transition-colors"
              >
                {isUpdatingDeadline ? 'Saving...' : 'Set Closing Deadline'}
              </button>
              {currentAssessment.global_closing_at && (
                <button
                  onClick={() => {
                    if (window.confirm('Clear global closing deadline? The final consolidated report will NOT be generated until a deadline is set.')) {
                      handleUpdateDeadline(null);
                    }
                  }}
                  disabled={isUpdatingDeadline}
                  className="px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
                >
                  Clear Deadline
                </button>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Question Bank Header & Add Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <FileQuestion className="w-5 h-5 text-blue-400" /> Question Bank
        </h3>

        <button
          onClick={() =>
            setEditingQuestion({
              question: {
                title: '',
                statement: '',
                question_type: 'long_answer',
                order_index: (currentAssessment?.questions.length || 0) + 1,
                max_score: 100,
                is_enabled: true,
              },
              privateConfig: {
                reference_answer: '',
                grading_rubric: [
                  { id: '1', criterion: 'Algorithmic Correctness', max_score: 50, description: 'Correctness of the proposed approach' },
                  { id: '2', criterion: 'Complexity & Bounds', max_score: 30, description: 'Asymptotic time and memory analysis' },
                  { id: '3', criterion: 'Edge Cases Handling', max_score: 20, description: 'Handling boundary inputs' },
                ],
              },
            })
          }
          className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Question</span>
        </button>
      </div>

      {/* Questions List or Empty State */}
      {currentAssessment && currentAssessment.questions.length === 0 ? (
        <div className="p-12 rounded-2xl bg-slate-900/60 border border-dashed border-slate-800 text-center space-y-3">
          <HelpCircle className="w-12 h-12 text-slate-500 mx-auto" />
          <h4 className="text-base font-bold text-white">Empty Question Bank</h4>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            As requested, no questions have been seeded yet. You can create questions now using &quot;Add New Question&quot;, or populate them when the official contest materials are provided.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentAssessment?.questions.map((q, idx) => (
            <div
              key={q.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-750 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-blue-400">Q{idx + 1}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 uppercase">
                    {q.question_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-bold text-white">{q.title}</span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-1">{q.statement}</p>
                <div className="text-[11px] text-slate-500 pt-0.5">
                  Max Points: <strong className="text-slate-300">{q.max_score}</strong> • Rubric Criteria: <strong className="text-slate-300">{q.privateConfig?.grading_rubric?.length || 0}</strong>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => setPreviewQuestion(q)}
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Preview as candidate"
                >
                  <Eye className="w-4 h-4" />
                </button>

                <button
                  onClick={() =>
                    setEditingQuestion({
                      question: q,
                      privateConfig: {
                        reference_answer: q.privateConfig?.reference_answer || '',
                        grading_rubric: q.privateConfig?.grading_rubric || [],
                      },
                    })
                  }
                  className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                  title="Edit question"
                >
                  <Edit2 className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleDeleteQuestion(q.id)}
                  className="p-2 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Question Edit / Create Modal */}
      {editingQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-white">
                {editingQuestion.question.id ? 'Edit Question' : 'Create Question'}
              </h3>
              <button
                onClick={() => setEditingQuestion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Title</label>
                <input
                  type="text"
                  value={editingQuestion.question.title || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, title: e.target.value },
                    })
                  }
                  placeholder="e.g. Range Minimum Query with Updates"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Question Type</label>
                  <select
                    value={editingQuestion.question.question_type || 'long_answer'}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, question_type: e.target.value as QuestionType },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="long_answer">Long Written Answer</option>
                    <option value="short_answer">Short Answer</option>
                    <option value="pseudocode">Pseudocode</option>
                    <option value="cpp_code">C++ Code Submission</option>
                    <option value="multiple_choice">Multiple Choice</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Max Score (Points)</label>
                  <input
                    type="number"
                    value={editingQuestion.question.max_score || 100}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        question: { ...editingQuestion.question, max_score: parseFloat(e.target.value) },
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Question Statement</label>
                <textarea
                  rows={5}
                  value={editingQuestion.question.statement || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, statement: e.target.value },
                    })
                  }
                  placeholder="Describe the formal problem statement, rules, and expectations..."
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Constraints & Boundaries</label>
                <textarea
                  rows={2}
                  value={editingQuestion.question.constraints || ''}
                  onChange={(e) =>
                    setEditingQuestion({
                      ...editingQuestion,
                      question: { ...editingQuestion.question, constraints: e.target.value },
                    })
                  }
                  placeholder="e.g. 1 <= N <= 10^5, Time limit: 2.0s"
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                />
              </div>

              {/* Private Rubric & Answer Key */}
              <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-900/60 space-y-3">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Shield className="w-4 h-4" />
                  <span>Private Grading Config (Hidden from Candidates)</span>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Reference Answer / Model Solution</label>
                  <textarea
                    rows={3}
                    value={editingQuestion.privateConfig.reference_answer || ''}
                    onChange={(e) =>
                      setEditingQuestion({
                        ...editingQuestion,
                        privateConfig: { ...editingQuestion.privateConfig, reference_answer: e.target.value },
                      })
                    }
                    placeholder="Reference optimal algorithm, key observations, or model implementation..."
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setEditingQuestion(null)}
                className="px-4 py-2 text-xs text-slate-400 hover:text-white bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSaving || !editingQuestion.question.title || !editingQuestion.question.statement}
                onClick={handleSaveQuestion}
                className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-md disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Question'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Candidate Preview Modal */}
      {previewQuestion && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold text-blue-400 uppercase tracking-wide">
                Candidate Preview • {previewQuestion.question_type.replace('_', ' ')}
              </span>
              <button
                onClick={() => setPreviewQuestion(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <h3 className="text-lg font-bold text-white">{previewQuestion.title}</h3>
            <p className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
              {previewQuestion.statement}
            </p>

            {previewQuestion.constraints && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg font-mono text-xs text-slate-300">
                {previewQuestion.constraints}
              </div>
            )}

            <div className="border-t border-slate-800 pt-3 text-right">
              <button
                onClick={() => setPreviewQuestion(null)}
                className="px-4 py-1.5 text-xs font-semibold bg-slate-800 text-slate-300 hover:text-white rounded-lg"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default AssessmentsClient;
