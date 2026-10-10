import { z } from 'zod';

export const CriterionScoreResultSchema = z.object({
  criterion_id: z.string().default(''),
  maximum_points: z.number().min(0).default(0),
  awarded_points: z.number().min(0).default(0),
  evidence: z.string().default(''),
  rationale: z.string().default(''),
  // Optional aliases for flexible parsing
  criterion: z.string().optional(),
  max_score: z.number().optional(),
  awarded_score: z.number().optional(),
});

export const GeminiEvaluationOutputSchema = z.object({
  question_id: z.string(),
  maximum_score: z.number().min(0),
  criterion_scores: z.array(CriterionScoreResultSchema),
  total_score: z.number().min(0),
  confidence: z.enum(['high', 'medium', 'low']).or(z.string()),
  needs_human_review: z.boolean().default(false),
  review_reason: z.string().default(''),
});

export type GeminiEvaluationOutput = z.infer<typeof GeminiEvaluationOutputSchema>;
