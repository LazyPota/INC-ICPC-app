import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { FinalizeAttemptSchema } from '@/lib/validations/assessment';
import { evaluateCandidateAnswer } from '@/lib/gemini/evaluator';
import { executeCppCode } from '@/lib/judge0/executor';

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validated = FinalizeAttemptSchema.parse(body);

    const attempt = await dataStore.getAttemptById(validated.attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    if (attempt.candidate_id !== session.userId && !session.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Atomically finalize attempt
    const finalized = await dataStore.finalizeAttempt(validated.attemptId, 'submitted');

    // Trigger asynchronous evaluation in the background without blocking the candidate response
    (async () => {
      try {
        const answers = await dataStore.getAnswersForAttempt(validated.attemptId);
        const questions = await dataStore.getQuestionsForAssessment(attempt.assessment_id, true);

        for (const ans of answers) {
          const q = questions.find((item) => item.id === ans.question_id);
          if (!q) continue;

          // 1. Written / Algorithm questions evaluated with Gemini
          if (q.question_type === 'short_answer' || q.question_type === 'long_answer' || q.question_type === 'pseudocode') {
            const rubric = q.privateConfig?.grading_rubric || [
              { id: '1', criterion: 'Correctness & Reasoning', max_score: q.max_score, description: 'Evaluation of candidate reasoning and approach' },
            ];

            const evalResult = await evaluateCandidateAnswer({
              attemptId: attempt.id,
              questionId: q.id,
              division: q.division,
              questionTitle: q.title,
              questionStatement: q.statement,
              questionConstraints: q.constraints,
              referenceAnswer: q.privateConfig?.reference_answer,
              gradingRubric: rubric,
              maxScore: q.max_score,
              candidateAnswerText: ans.answer_content || '',
            });

            const status = evalResult.needs_human_review || evalResult.confidence === 'low' ? 'needs_review' : 'completed';

            await dataStore.saveEvaluation({
              attempt_id: attempt.id,
              question_id: q.id,
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
              retry_count: 0,
            });
          }

          // 2. Programmer questions evaluated via Judge0 sandboxed execution
          if (q.question_type === 'cpp_code') {
            const testCases = q.privateConfig?.test_cases || [];
            const execResult = await executeCppCode(ans.code_content || ans.answer_content || '', testCases);

            await dataStore.saveCodeExecution({
              attempt_id: attempt.id,
              question_id: q.id,
              status: execResult.status,
              passed_tests: execResult.passedTests,
              total_tests: execResult.totalTests,
              test_results: execResult.results,
              compile_output: execResult.compileOutput || null,
            });

            const totalScore = execResult.totalTests > 0
              ? Math.round((execResult.passedTests / execResult.totalTests) * q.max_score * 100) / 100
              : 0;

            const evalStatus = !execResult.isConfigured ? 'needs_review' : 'completed';

            await dataStore.saveEvaluation({
              attempt_id: attempt.id,
              question_id: q.id,
              model_name: execResult.isConfigured ? 'judge0-sandbox' : 'judge0-unconfigured',
              rubric_version: 'v1',
              prompt_version: 'v1',
              status: evalStatus,
              criterion_scores: [
                {
                  criterion_id: 'automated-tests',
                  maximum_points: q.max_score,
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
              retry_count: 0,
            });
          }
        }
      } catch (evalErr) {
        console.error('Background evaluation error:', evalErr);
      }
    })();

    return NextResponse.json({
      success: true,
      attempt: finalized,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to finalize assessment';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
