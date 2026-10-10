import { z } from 'zod';

export const INSTITUTIONAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@student\.president\.ac\.id$/;

export const DivisionSchema = z.enum(['problem_analysis', 'algorithm_builder', 'programmer'], {
  message: 'Please select a valid division.',
});

export const RegisterCandidateSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Full name must be at least 2 characters.')
    .max(150, 'Full name cannot exceed 150 characters.'),
  studentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .regex(INSTITUTIONAL_EMAIL_REGEX, 'Must use an official student email ending in @student.president.ac.id'),
  password: z
    .string()
    .min(6, 'Password must be at least 6 characters.'),
  intendedDivision: DivisionSchema,
});

export const LoginCandidateSchema = z.object({
  studentEmail: z
    .string()
    .trim()
    .toLowerCase()
    .regex(INSTITUTIONAL_EMAIL_REGEX, 'Must use an official student email ending in @student.president.ac.id'),
  password: z
    .string()
    .min(1, 'Password is required.'),
});

export type RegisterCandidateInput = z.infer<typeof RegisterCandidateSchema>;
export type LoginCandidateInput = z.infer<typeof LoginCandidateSchema>;
