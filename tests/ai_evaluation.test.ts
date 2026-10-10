import { describe, it, expect } from 'vitest';
import { GeminiEvaluationOutputSchema } from '@/lib/validations/evaluation';
import { evaluateCandidateAnswer } from '@/lib/gemini/evaluator';

describe('AI Evaluation System & Schema Validation', () => {
  it('should validate conforming structured Gemini evaluation output matching Part III specification', () => {
    const rawOutput = {
      question_id: 'q-101',
      maximum_score: 100,
      criterion_scores: [
        {
          criterion_id: 'c-1',
          maximum_points: 50,
          awarded_points: 45,
          evidence: 'Candidate notes that the graph is a directed acyclic graph (DAG).',
          rationale: 'Correctly identified the graph structure and edge constraints.',
        },
        {
          criterion_id: 'c-2',
          maximum_points: 50,
          awarded_points: 40,
          evidence: 'Candidate states O(V + E) topological sort complexity.',
          rationale: 'Derived correct O(V + E) time bound.',
        },
      ],
      total_score: 85,
      confidence: 'high' as const,
      needs_human_review: false,
      review_reason: '',
    };

    const validated = GeminiEvaluationOutputSchema.parse(rawOutput);
    expect(validated.total_score).toBe(85);
    expect(validated.criterion_scores.length).toBe(2);
    expect(validated.confidence).toBe('high');
    expect(validated.needs_human_review).toBe(false);
  });

  it('should reject invalid or negative scores in AI output schema', () => {
    const invalidOutput = {
      question_id: 'q-101',
      maximum_score: 100,
      criterion_scores: [],
      total_score: -10, // Invalid negative score
      confidence: 'invalid_confidence',
      needs_human_review: false,
      review_reason: '',
    };

    expect(() => {
      GeminiEvaluationOutputSchema.parse(invalidOutput);
    }).toThrow();
  });

  it('should handle unconfigured Gemini API key gracefully with structured review status without fabricating scores', async () => {
    const result = await evaluateCandidateAnswer({
      attemptId: 'att-1',
      questionId: 'q-1',
      division: 'problem_analysis',
      questionTitle: 'Two Sum Variant',
      questionStatement: 'Find pairs that sum to target',
      maxScore: 100,
      candidateAnswerText: 'Use hash map with O(N) complexity',
      gradingRubric: [
        { id: '1', criterion: 'Approach', max_score: 100, description: 'Evaluation of candidate approach' },
      ],
    });

    expect(result).toBeDefined();
    expect(result.total_score).toBe(0);
    expect(result.confidence).toBe('low');
    expect(result.needs_human_review).toBe(true);
    expect(result.review_reason).toContain('Gemini API key is not configured');
  });
});
