import { NextResponse } from 'next/server';
import { getCurrentSession } from '@/lib/auth/session';
import { dataStore } from '@/lib/data/store';
import { evaluateCandidateAnswer } from '@/lib/gemini/evaluator';

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session || !session.isAdmin) {
    return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 });
  }

  try {
    const { attemptId, questionId } = await request.json();
    if (!attemptId) {
      return NextResponse.json({ error: 'Missing attemptId' }, { status: 400 });
    }

    const attempt = await dataStore.getAttemptById(attemptId);
    if (!attempt) {
      return NextResponse.json({ error: 'Attempt not found' }, { status: 404 });
    }

    const questions = await dataStore.getQuestionsForAssessment(attempt.assessment_id, true);
    const answers = await dataStore.getAnswersForAttempt(attemptId);

    const targetAnswers = questionId
      ? answers.filter((a) => a.question_id === questionId)
      : answers;

    const evaluatedResults = [];

    for (const ans of targetAnswers) {
      const q = questions.find((item) => item.id === ans.question_id);
      if (!q) continue;

      if (q.question_type === 'short_answer' || q.question_type === 'long_answer' || q.question_type === 'pseudocode') {
        const rubric = q.privateConfig?.grading_rubric || [
          { id: '1', criterion: 'Core Logic & Correctness', max_score: q.max_score, description: 'Evaluation of algorithm and reasoning' },
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

        const savedEval = await dataStore.saveEvaluation({
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

        evaluatedResults.push(savedEval);
      } else if (q.question_type === 'cpp_code') {
        const testCases = q.privateConfig?.test_cases || [];
        const { executeCppCode } = await import('@/lib/judge0/executor');
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

        const savedEval = await dataStore.saveEvaluation({
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

        evaluatedResults.push(savedEval);
      }
    }

    await dataStore.logAdminAudit({
      admin_email: session.email,
      action: 'RUN_AI_EVALUATION',
      target_type: 'attempt',
      target_id: attemptId,
      details: { questionId: questionId || 'all', evaluatedCount: evaluatedResults.length },
    });

    return NextResponse.json({ success: true, evaluated: evaluatedResults });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Evaluation trigger failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
