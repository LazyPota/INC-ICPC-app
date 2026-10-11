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

export const LEGACY_QUESTION_MAP: Record<string, string> = {
  // Division A: Problem Analysis
  'q-pa-1': 'a0000001-0000-0000-0000-000000000001',
  'q-pa-2': 'a0000001-0000-0000-0000-000000000002',
  'q-pa-3': 'a0000001-0000-0000-0000-000000000003',
  'q-pa-4': 'a0000001-0000-0000-0000-000000000004',
  // Division B: Algorithm Builder
  'q-ab-1': 'b0000002-0000-0000-0000-000000000001',
  'q-ab-2': 'b0000002-0000-0000-0000-000000000002',
  'q-ab-3': 'b0000002-0000-0000-0000-000000000003',
  'q-ab-4': 'b0000002-0000-0000-0000-000000000004',
  // Division C: Programmer
  'q-pr-1': 'c0000003-0000-0000-0000-000000000001',
  'q-pr-2': 'c0000003-0000-0000-0000-000000000002',
  'q-pr-3': 'c0000003-0000-0000-0000-000000000003',
  'q-pr-4': 'c0000003-0000-0000-0000-000000000004',
};

export const SaveAnswerSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
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
  attemptId: z.string().min(1, 'Attempt ID is required'),
});

export const ProctorEventSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  sessionId: z.string().min(1),
  eventType: z.enum([
    'page_hidden',
    'page_visible',
    'window_blur',
    'window_focus',
    'paste_blocked',
    'copy_blocked',
    'paste_detected',
    'copy_detected',
    'context_menu',
    'duplicate_tab',
    'fullscreen_exit',
    'repeated_save_failure',
  ]),
  severity: z.enum(['low', 'medium', 'high']),
  metadata: z.record(z.string(), z.unknown()).default({}),
  questionId: z.string().nullable().optional(),
});

export const AdminScoreOverrideSchema = z.object({
  attemptId: z.string().min(1, 'Attempt ID is required'),
  questionId: z.string().min(1, 'Question ID is required'),
  overrideScore: z.number().min(0, 'Score cannot be negative'),
  reason: z.string().min(5, 'Reason must be at least 5 characters long'),
});
