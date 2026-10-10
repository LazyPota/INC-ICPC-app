import { describe, it, expect } from 'vitest';
import { RegisterCandidateSchema, LoginCandidateSchema, INSTITUTIONAL_EMAIL_REGEX } from '@/lib/validations/auth';

describe('Institutional Email Validation', () => {
  it('should accept valid @student.president.ac.id emails', () => {
    const validEmails = [
      'alex.pratama@student.president.ac.id',
      'candidate123@student.president.ac.id',
      'john_doe@student.president.ac.id',
      'user.test+icpc@student.president.ac.id',
    ];

    for (const email of validEmails) {
      expect(INSTITUTIONAL_EMAIL_REGEX.test(email)).toBe(true);
    }
  });

  it('should reject non-institutional emails', () => {
    const invalidEmails = [
      'user@gmail.com',
      'user@yahoo.com',
      'user@president.ac.id', // Lecturer / staff email, not student
      'user@student.president.ac.com',
      'user@student.otheruniv.ac.id',
      'student.president.ac.id',
      '@student.president.ac.id',
    ];

    for (const email of invalidEmails) {
      expect(INSTITUTIONAL_EMAIL_REGEX.test(email)).toBe(false);
    }
  });

  it('should validate complete candidate registration input with Zod', () => {
    const validCandidate = {
      fullName: 'Budi Santoso',
      studentEmail: 'budi.santoso@student.president.ac.id',
      password: 'securePassword123',
      intendedDivision: 'programmer' as const,
    };

    const parsed = RegisterCandidateSchema.parse(validCandidate);
    expect(parsed.fullName).toBe('Budi Santoso');
    expect(parsed.intendedDivision).toBe('programmer');
  });

  it('should fail registration if division is invalid or email is missing', () => {
    expect(() => {
      RegisterCandidateSchema.parse({
        fullName: 'Budi',
        studentEmail: 'invalid@gmail.com',
        password: '123',
        intendedDivision: 'invalid_division',
      });
    }).toThrow();
  });
});
