import { z } from 'zod';

export const QuestionTypeSchema = z.enum([
  'multiple_choice',
  'short_answer',
  'long_answer',
  'pseudocode',
  'cpp_code',
]);

export const RubricCriterionSchema = z.object({
  id: z.string(),
  criterion: z.string().min(1, 'Criterion name is required.'),
  max_score: z.number().positive('Max score must be greater than 0.'),
  description: z.string().min(1, 'Description is required.'),
});

export const TestCaseSchema = z.object({
  id: z.string(),
  input: z.string(),
  expected_output: z.string(),
  is_hidden: z.boolean().default(false),
});

export const SaveAnswerSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  answerContent: z.string().nullable().optional(),
  selectedOption: z.string().nullable().optional(),
  codeContent: z.string().nullable().optional(),
  version: z.number().int().nonnegative().optional(),
});

export const StartAttemptSchema = z.object({
  division: z.enum(['problem_analysis', 'algorithm_builder', 'programmer']),
  sessionId: z.string().min(1),
});

export const FinalizeAttemptSchema = z.object({
  attemptId: z.string().uuid(),
});

export const ProctorEventSchema = z.object({
  attemptId: z.string().uuid(),
  sessionId: z.string().min(1),
  eventType: z.enum([
    'page_hidden',
    'page_visible',
    'window_blur',
    'window_focus',
    'paste_blocked',
    'copy_blocked',
    'context_menu',
    'duplicate_tab',
    'fullscreen_exit',
    'repeated_save_failure',
  ]),
  severity: z.enum(['low', 'medium', 'high']),
  metadata: z.record(z.string(), z.unknown()).default({}),
  questionId: z.string().uuid().nullable().optional(),
});

export const AdminScoreOverrideSchema = z.object({
  attemptId: z.string().uuid(),
  questionId: z.string().uuid(),
  overrideScore: z.number().min(0, 'Score cannot be negative'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});
