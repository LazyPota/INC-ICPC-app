import { dataStore } from '@/lib/data/store';
import { evaluateCandidateAnswer } from '@/lib/gemini/evaluator';
import { executeCppCode } from '@/lib/judge0/executor';
import type { EvaluationJob } from '@/types/database';

export const MAX_EVALUATION_RETRIES = 3;

/**
 * Enqueues evaluation jobs for all questions in an attempt.
 */
export async function enqueueAttemptEvaluations(attemptId: string): Promise<EvaluationJob[]> {
  const attempt = await dataStore.getAttemptById(attemptId);
  if (!attempt) throw new Error('Attempt not found');

  const questions = await dataStore.getQuestionsForAssessment(attempt.assessment_id, false);
  const questionIds = questions.map((q) => q.id);

  return await dataStore.enqueueEvaluationJobsForAttempt(attemptId, questionIds);
}

/**
 * Process a single evaluation job idempotently with retry support.
 */
export async function processEvaluationJob(job: EvaluationJob): Promise<EvaluationJob> {
  // Update status to processing
  await dataStore.updateEvaluationJob(job.id, {
    status: 'processing',
  });

  const currentAttemptId = job.attempt_id;

  try {
    const attempt = await dataStore.getAttemptById(job.attempt_id);
    if (!attempt) {
      throw new Error(`Attempt ${job.attempt_id} not found`);
    }

    const question = await dataStore.getQuestionById(job.question_id, true);
    if (!question) {
      throw new Error(`Question ${job.question_id} not found`);
    }

    const answers = await dataStore.getAnswersForAttempt(job.attempt_id);
    const ans = answers.find((a) => a.question_id === job.question_id);

    // 1. Written, Algorithmic, and Multiple Choice
    if (
      question.question_type === 'short_answer' ||
      question.question_type === 'long_answer' ||
      question.question_type === 'pseudocode' ||
      question.question_type === 'multiple_choice'
    ) {
      if (question.question_type === 'multiple_choice') {
        const refAnswer = question.privateConfig?.reference_answer?.trim();
        const selected = ans?.selected_option?.trim();
        const isCorrect = Boolean(refAnswer && selected && refAnswer.toLowerCase() === selected.toLowerCase());
        const score = isCorrect ? question.max_score : 0;

        await dataStore.saveEvaluation({
          attempt_id: attempt.id,
          question_id: question.id,
          model_name: 'deterministic-mcq',
          rubric_version: 'v1',
          prompt_version: 'v1',
          status: 'completed',
          criterion_scores: [
            {
              criterion_id: 'mcq-correctness',
              maximum_points: question.max_score,
              awarded_points: score,
              evidence: `Selected option: ${selected || 'None'}. Reference answer: ${refAnswer || 'Not configured'}.`,
              rationale: isCorrect ? 'Selected option matches reference answer.' : 'Selected option does not match reference answer.',
            },
          ],
          total_score: score,
          confidence: 1.0,
          evidence: `Selected: ${selected || 'None'}`,
          rationale: isCorrect ? 'Correct option selected' : 'Incorrect option selected',
          flags: [],
          retry_count: job.retry_count,
        });
      } else {
        // Written / Pseudocode evaluated with Gemini (candidate identity omitted)
        const rubric = question.privateConfig?.grading_rubric || [
          {
            id: '1',
            criterion: 'Correctness & Reasoning',
            max_score: question.max_score,
            description: 'Evaluation of candidate reasoning and approach',
          },
        ];

        const evalResult = await evaluateCandidateAnswer({
          attemptId: attempt.id,
          questionId: question.id,
          division: question.division,
          questionTitle: question.title,
          questionStatement: question.statement,
          questionConstraints: question.constraints,
          referenceAnswer: question.privateConfig?.reference_answer,
          gradingRubric: rubric,
          maxScore: question.max_score,
          candidateAnswerText: ans?.answer_content || '',
        });

        const status = evalResult.needs_human_review || evalResult.confidence === 'low' ? 'needs_review' : 'completed';

        await dataStore.saveEvaluation({
          attempt_id: attempt.id,
          question_id: question.id,
          model_name: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
          rubric_version: 'v1',
          prompt_version: 'v1',
          status,
          criterion_scores: evalResult.criterion_scores,
          total_score: evalResult.total_score,
          confidence: evalResult.confidence === 'high' ? 1.0 : evalResult.confidence === 'medium' ? 0.7 : 0.3,
          evidence: evalResult.criterion_scores.map((c) => `${c.criterion_id}: ${c.evidence}`).join('\n'),
          rationale: evalResult.review_reason || 'AI Rubric evaluation completed.',
          flags: evalResult.needs_human_review ? ['NEEDS_HUMAN_REVIEW'] : [],
          retry_count: job.retry_count,
        });
      }
    } else if (question.question_type === 'cpp_code') {
      // 2. Programmer questions evaluated via Judge0 sandboxed execution
      const testCases = question.privateConfig?.test_cases || [];
      const execResult = await executeCppCode(ans?.code_content || ans?.answer_content || '', testCases);

      await dataStore.saveCodeExecution({
        attempt_id: attempt.id,
        question_id: question.id,
        status: execResult.status,
        passed_tests: execResult.passedTests,
        total_tests: execResult.totalTests,
        test_results: execResult.results,
        compile_output: execResult.compileOutput || null,
      });

      const totalScore =
        execResult.totalTests > 0
          ? Math.round((execResult.passedTests / execResult.totalTests) * question.max_score * 100) / 100
          : 0;

      const evalStatus = !execResult.isConfigured ? 'needs_review' : 'completed';

      await dataStore.saveEvaluation({
        attempt_id: attempt.id,
        question_id: question.id,
        model_name: execResult.isConfigured ? 'judge0-sandbox' : 'judge0-unconfigured',
        rubric_version: 'v1',
        prompt_version: 'v1',
        status: evalStatus,
        criterion_scores: [
          {
            criterion_id: 'automated-tests',
            maximum_points: question.max_score,
            awarded_points: totalScore,
            evidence: `Passed ${execResult.passedTests}/${execResult.totalTests} tests. Status: ${execResult.status}`,
            rationale: execResult.compileOutput || `Automated sandbox execution: ${execResult.passedTests}/${execResult.totalTests} passed`,
          },
        ],
        total_score: totalScore,
        confidence: execResult.isConfigured ? 1.0 : 0.0,
        evidence: `Passed ${execResult.passedTests}/${execResult.totalTests} tests.`,
        rationale: execResult.compileOutput || 'Sandboxed code execution',
        flags: execResult.isConfigured ? [] : ['JUDGE0_NOT_CONFIGURED', 'MANUAL_REVIEW_REQUIRED'],
        retry_count: job.retry_count,
      });
    }

    return await dataStore.updateEvaluationJob(job.id, {
      status: 'completed',
      last_error: null,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Evaluation failed';
    const nextRetry = job.retry_count + 1;

    if (nextRetry >= MAX_EVALUATION_RETRIES) {
      // Exhausted retries -> transition to requires_review without fabricating scores
      await dataStore.saveEvaluation({
        attempt_id: currentAttemptId,
        question_id: job.question_id,
        model_name: 'evaluation-failed',
        rubric_version: 'v1',
        prompt_version: 'v1',
        status: 'needs_review',
        criterion_scores: [],
        total_score: 0,
        confidence: 0,
        evidence: 'Evaluation failed after retries',
        rationale: `Automatic evaluation failed: ${errorMsg}. Requires manual administrator review.`,
        flags: ['EVALUATION_ERROR', 'MANUAL_REVIEW_REQUIRED'],
        error_message: errorMsg,
        retry_count: nextRetry,
      });

      return await dataStore.updateEvaluationJob(job.id, {
        status: 'requires_review',
        retry_count: nextRetry,
        last_error: errorMsg,
      });
    } else {
      // Retry pending
      return await dataStore.updateEvaluationJob(job.id, {
        status: 'pending',
        retry_count: nextRetry,
        last_error: errorMsg,
      });
    }
  }
}

/**
 * Runs all evaluation jobs for an attempt.
 */
export async function runEvaluationJobsForAttempt(attemptId: string): Promise<EvaluationJob[]> {
  const jobs = await dataStore.getEvaluationJobsForAttempt(attemptId);
  const results: EvaluationJob[] = [];
  for (const job of jobs) {
    if (job.status === 'pending' || job.status === 'processing') {
      const res = await processEvaluationJob(job);
      results.push(res);
    } else {
      results.push(job);
    }
  }
  return results;
}

/**
 * Process a batch of pending evaluation jobs across attempts.
 */
export async function processEvaluationQueue(limit = 10): Promise<EvaluationJob[]> {
  const pendingJobs = await dataStore.getPendingEvaluationJobs(limit);
  const results: EvaluationJob[] = [];
  for (const job of pendingJobs) {
    const processed = await processEvaluationJob(job);
    results.push(processed);
  }
  return results;
}
