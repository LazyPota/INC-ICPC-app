import crypto from 'crypto';
import {
  readLocalDB,
  writeLocalDB,
  DatabaseConfigurationError,
  isProductionEnvironment,
  assertPersistenceConfigured,
} from './localStore';
import { createAdminClient, isSupabaseConfigured } from '@/lib/supabase/admin';
import { LEGACY_QUESTION_MAP } from '@/lib/validations/assessment';
import type {
  Profile,
  Assessment,
  Question,
  PrivateQuestionConfig,
  AssessmentAttempt,
  CandidateAnswer,
  IntegrityEvent,
  AiEvaluation,
  ManualScoreOverride,
  AdminAuditLog,
  DivisionType,
  CodeExecution,
  EvaluationJob,
  ConfidentialReport,
  CandidateFacingStatus,
} from '@/types/database';

export { DatabaseConfigurationError, isProductionEnvironment, assertPersistenceConfigured };

export const dataStore = {
  // ==========================================
  // Profiles
  // ==========================================
  async getProfile(userId: string): Promise<Profile | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.profiles.find((p) => p.id === userId) || null;
  },

  async getProfileByEmail(email: string): Promise<Profile | null> {
    const normalized = email.trim().toLowerCase();
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('profiles').select('*').eq('student_email', normalized).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.profiles.find((p) => p.student_email.toLowerCase() === normalized) || null;
  },

  async createProfile(profile: Profile): Promise<Profile> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('profiles').upsert(profile).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const db = readLocalDB();
    const existingIndex = db.profiles.findIndex((p) => p.id === profile.id || p.student_email.toLowerCase() === profile.student_email.toLowerCase());
    if (existingIndex >= 0) {
      db.profiles[existingIndex] = profile;
    } else {
      db.profiles.push(profile);
    }
    writeLocalDB(db);
    return profile;
  },

  // ==========================================
  // Assessments
  // ==========================================
  async getAllAssessments(): Promise<Assessment[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('assessments').select('*').order('created_at');
      return data || [];
    }
    const db = readLocalDB();
    return db.assessments;
  },

  async getAssessmentByDivision(division: DivisionType): Promise<Assessment | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('assessments').select('*').eq('division', division).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.assessments.find((a) => a.division === division) || null;
  },

  async getAssessmentById(id: string): Promise<Assessment | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('assessments').select('*').eq('id', id).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.assessments.find((a) => a.id === id) || null;
  },

  async updateAssessment(assessment: Partial<Assessment> & { id: string }): Promise<Assessment> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('assessments').update(assessment).eq('id', assessment.id).select().single();
      if (error) throw new Error(error.message);
      return data;
    }
    const db = readLocalDB();
    const index = db.assessments.findIndex((a) => a.id === assessment.id);
    if (index === -1) throw new Error('Assessment not found');
    db.assessments[index] = { ...db.assessments[index], ...assessment, updated_at: new Date().toISOString() };
    writeLocalDB(db);
    return db.assessments[index];
  },

  async publishAssessmentResults(assessmentId: string, adminEmail: string): Promise<Assessment> {
    const publishedAt = new Date().toISOString();
    const updated = await this.updateAssessment({
      id: assessmentId,
      is_results_published: true,
      results_published_at: publishedAt,
    });

    await this.logAdminAudit({
      admin_email: adminEmail,
      action: 'PUBLISH_RESULTS',
      target_type: 'ASSESSMENT',
      target_id: assessmentId,
      details: { publishedAt, division: updated.division },
    });

    return updated;
  },


  // ==========================================
  // Questions & Private Configs
  // ==========================================
  async getQuestionsForAssessment(assessmentId: string, includePrivate = false): Promise<Array<Question & { privateConfig?: PrivateQuestionConfig }>> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: questions } = await supabase
        .from('questions')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('order_index');

      if (!questions) return [];

      if (!includePrivate) {
        return questions;
      }

      const qIds = questions.map((q) => q.id);
      const { data: configs } = await supabase
        .from('private_question_configs')
        .select('*')
        .in('question_id', qIds);

      return questions.map((q) => ({
        ...q,
        privateConfig: configs?.find((c) => c.question_id === q.id),
      }));
    }

    const db = readLocalDB();
    const filtered = db.questions
      .filter((q) => q.assessment_id === assessmentId)
      .sort((a, b) => a.order_index - b.order_index);

    if (!includePrivate) return filtered;

    return filtered.map((q) => ({
      ...q,
      privateConfig: db.private_configs.find((c) => c.question_id === q.id),
    }));
  },

  async getQuestionById(questionId: string, includePrivate = false): Promise<(Question & { privateConfig?: PrivateQuestionConfig }) | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: question } = await supabase.from('questions').select('*').eq('id', questionId).single();
      if (!question) return null;

      if (!includePrivate) return question;

      const { data: config } = await supabase.from('private_question_configs').select('*').eq('question_id', questionId).single();
      return { ...question, privateConfig: config || undefined };
    }

    const db = readLocalDB();
    const question = db.questions.find((q) => q.id === questionId);
    if (!question) return null;

    if (!includePrivate) return question;

    const config = db.private_configs.find((c) => c.question_id === questionId);
    return { ...question, privateConfig: config };
  },

  async saveQuestion(
    question: Omit<Question, 'created_at' | 'updated_at'> & { id?: string },
    privateConfig?: { reference_answer?: string | null; grading_rubric: PrivateQuestionConfig['grading_rubric']; test_cases?: PrivateQuestionConfig['test_cases'] }
  ): Promise<Question> {
    const qId = question.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const fullQuestion: Question = {
      ...question,
      id: qId,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: savedQ, error: qErr } = await supabase.from('questions').upsert(fullQuestion).select().single();
      if (qErr) throw new Error(qErr.message);

      if (privateConfig) {
        const fullConfig = {
          question_id: qId,
          reference_answer: privateConfig.reference_answer || null,
          grading_rubric: privateConfig.grading_rubric || [],
          test_cases: privateConfig.test_cases || [],
          updated_at: now,
        };
        await supabase.from('private_question_configs').upsert(fullConfig, { onConflict: 'question_id' });
      }
      return savedQ;
    }

    const db = readLocalDB();
    const qIndex = db.questions.findIndex((q) => q.id === qId);
    if (qIndex >= 0) {
      db.questions[qIndex] = { ...db.questions[qIndex], ...fullQuestion, updated_at: now };
    } else {
      db.questions.push(fullQuestion);
    }

    if (privateConfig) {
      const cIndex = db.private_configs.findIndex((c) => c.question_id === qId);
      const confRecord: PrivateQuestionConfig = {
        id: cIndex >= 0 ? db.private_configs[cIndex].id : crypto.randomUUID(),
        question_id: qId,
        reference_answer: privateConfig.reference_answer || null,
        grading_rubric: privateConfig.grading_rubric || [],
        test_cases: privateConfig.test_cases || [],
        created_at: cIndex >= 0 ? db.private_configs[cIndex].created_at : now,
        updated_at: now,
      };
      if (cIndex >= 0) {
        db.private_configs[cIndex] = confRecord;
      } else {
        db.private_configs.push(confRecord);
      }
    }

    writeLocalDB(db);
    return fullQuestion;
  },

  async deleteQuestion(questionId: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from('questions').delete().eq('id', questionId);
      return;
    }
    const db = readLocalDB();
    db.questions = db.questions.filter((q) => q.id !== questionId);
    db.private_configs = db.private_configs.filter((c) => c.question_id !== questionId);
    writeLocalDB(db);
  },

  // ==========================================
  // Assessment Attempts & Authoritative Timer
  // ==========================================
  async getAttemptByCandidateAndAssessment(candidateId: string, assessmentId: string): Promise<AssessmentAttempt | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('candidate_id', candidateId)
        .eq('assessment_id', assessmentId)
        .single();
      return data || null;
    }
    const db = readLocalDB();
    return db.attempts.find((a) => a.candidate_id === candidateId && a.assessment_id === assessmentId) || null;
  },

  async getAttemptById(attemptId: string): Promise<AssessmentAttempt | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('assessment_attempts').select('*').eq('id', attemptId).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.attempts.find((a) => a.id === attemptId) || null;
  },

  /**
   * Atomic start: calculates authoritative deadline as min(individual 180m, global_closing_at)
   */
  async startAttempt(candidateId: string, assessmentId: string, sessionId: string): Promise<AssessmentAttempt> {
    const existing = await this.getAttemptByCandidateAndAssessment(candidateId, assessmentId);
    if (existing) {
      // Update session if needed
      return existing;
    }

    const assessment = await this.getAssessmentById(assessmentId);
    const now = new Date();
    const durationMinutes = assessment?.duration_minutes || 180;
    const individualDeadline = new Date(now.getTime() + durationMinutes * 60 * 1000);
    let effectiveDeadline = individualDeadline;
    if (assessment?.global_closing_at) {
      const globalDeadline = new Date(assessment.global_closing_at);
      if (globalDeadline.getTime() < individualDeadline.getTime()) {
        effectiveDeadline = globalDeadline;
      }
    }

    const newAttempt: AssessmentAttempt = {
      id: crypto.randomUUID(),
      candidate_id: candidateId,
      assessment_id: assessmentId,
      started_at: now.toISOString(),
      deadline_at: effectiveDeadline.toISOString(),
      submitted_at: null,
      status: 'in_progress',
      active_session_id: sessionId,
      last_heartbeat_at: now.toISOString(),
      created_at: now.toISOString(),
      updated_at: now.toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('assessment_attempts').insert(newAttempt).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    db.attempts.push(newAttempt);
    writeLocalDB(db);
    return newAttempt;
  },

  async recordHeartbeat(attemptId: string, sessionId: string): Promise<{ valid: boolean; activeSessionId: string }> {
    const attempt = await this.getAttemptById(attemptId);
    if (!attempt) return { valid: false, activeSessionId: '' };

    const now = new Date().toISOString();
    const isSameSession = attempt.active_session_id === sessionId;

    // Check expiration against individual deadline and global closing deadline
    const nowMs = Date.now();
    let isExpired = new Date(attempt.deadline_at).getTime() <= nowMs;
    if (!isExpired) {
      const assessment = await this.getAssessmentById(attempt.assessment_id);
      if (assessment?.global_closing_at && new Date(assessment.global_closing_at).getTime() <= nowMs) {
        isExpired = true;
      }
    }

    if (isExpired && attempt.status === 'in_progress') {
      await this.finalizeAttempt(attemptId, 'expired');
    }

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase
        .from('assessment_attempts')
        .update({ last_heartbeat_at: now })
        .eq('id', attemptId);
    } else {
      const db = readLocalDB();
      const idx = db.attempts.findIndex((a) => a.id === attemptId);
      if (idx >= 0) {
        db.attempts[idx].last_heartbeat_at = now;
        writeLocalDB(db);
      }
    }

    return { valid: isSameSession, activeSessionId: attempt.active_session_id };
  },

  async finalizeExpiredAttemptsAtGlobalDeadline(assessmentId: string): Promise<AssessmentAttempt[]> {
    const assessment = await this.getAssessmentById(assessmentId);
    if (!assessment || !assessment.global_closing_at) {
      return [];
    }
    const globalDeadline = new Date(assessment.global_closing_at).getTime();
    if (Date.now() < globalDeadline) {
      return [];
    }

    let attemptsToFinalize: AssessmentAttempt[] = [];
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('assessment_attempts')
        .select('*')
        .eq('assessment_id', assessmentId)
        .eq('status', 'in_progress');
      attemptsToFinalize = data || [];
    } else {
      const db = readLocalDB();
      attemptsToFinalize = db.attempts.filter((a) => a.assessment_id === assessmentId && a.status === 'in_progress');
    }

    const finalizedAttempts: AssessmentAttempt[] = [];
    for (const att of attemptsToFinalize) {
      const fin = await this.finalizeAttempt(att.id, 'expired');
      finalizedAttempts.push(fin);
    }
    return finalizedAttempts;
  },

  async finalizeAttempt(attemptId: string, finalStatus: 'submitted' | 'expired' = 'submitted'): Promise<AssessmentAttempt> {
    const attempt = await this.getAttemptById(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    if (attempt.submitted_at) {
      return attempt; // Idempotent finalization
    }

    const now = new Date().toISOString();
    const updated: AssessmentAttempt = {
      ...attempt,
      submitted_at: now,
      status: finalStatus,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('assessment_attempts')
        .update({ submitted_at: now, status: finalStatus, updated_at: now })
        .eq('id', attemptId)
        .select()
        .single();
      if (error) throw new Error(error.message);

      // Lock all answers
      await supabase.from('candidate_answers').update({ is_final: true }).eq('attempt_id', attemptId);
      return data;
    }

    const db = readLocalDB();
    const idx = db.attempts.findIndex((a) => a.id === attemptId);
    if (idx >= 0) {
      db.attempts[idx] = updated;
      // Mark all answers as final
      db.answers.forEach((ans) => {
        if (ans.attempt_id === attemptId) {
          ans.is_final = true;
        }
      });
      writeLocalDB(db);
    }
    return updated;
  },

  async resetAttempt(attemptId: string, adminEmail: string): Promise<void> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from('assessment_attempts').delete().eq('id', attemptId);
      await this.logAdminAudit({
        admin_email: adminEmail,
        action: 'RESET_ATTEMPT',
        target_type: 'attempt',
        target_id: attemptId,
        details: { reset_at: new Date().toISOString() },
      });
      return;
    }
    const db = readLocalDB();
    db.attempts = db.attempts.filter((a) => a.id !== attemptId);
    db.answers = db.answers.filter((ans) => ans.attempt_id !== attemptId);
    db.integrity_events = db.integrity_events.filter((e) => e.attempt_id !== attemptId);
    db.ai_evaluations = db.ai_evaluations.filter((ev) => ev.attempt_id !== attemptId);
    writeLocalDB(db);

    await this.logAdminAudit({
      admin_email: adminEmail,
      action: 'RESET_ATTEMPT',
      target_type: 'attempt',
      target_id: attemptId,
      details: { reset_at: new Date().toISOString() },
    });
  },

  // ==========================================
  // Candidate Answers
  // ==========================================
  async getAnswersForAttempt(attemptId: string): Promise<CandidateAnswer[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('candidate_answers').select('*').eq('attempt_id', attemptId);
      return data || [];
    }
    const db = readLocalDB();
    return db.answers.filter((a) => a.attempt_id === attemptId);
  },

  async saveAnswer(
    attemptId: string,
    questionId: string,
    content: { answerContent?: string | null; selectedOption?: string | null; codeContent?: string | null; version?: number }
  ): Promise<CandidateAnswer> {
    const attempt = await this.getAttemptById(attemptId);
    if (!attempt) throw new Error('Attempt not found');

    // Deadline check (both individual deadline and global closing deadline)
    const nowMs = Date.now();
    let isPastDeadline = new Date(attempt.deadline_at).getTime() <= nowMs;
    if (!isPastDeadline) {
      const assessment = await this.getAssessmentById(attempt.assessment_id);
      if (assessment?.global_closing_at && new Date(assessment.global_closing_at).getTime() <= nowMs) {
        isPastDeadline = true;
      }
    }

    if (attempt.status !== 'in_progress' || isPastDeadline || attempt.submitted_at) {
      if (attempt.status === 'in_progress' && isPastDeadline) {
        await this.finalizeAttempt(attemptId, 'expired');
      }
      throw new Error('Assessment deadline has expired or has already been submitted');
    }

    // Resolve legacy question ID to standard RFC-4122 UUID if applicable
    const resolvedQuestionId = LEGACY_QUESTION_MAP[questionId] || questionId;
    const now = new Date().toISOString();

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: existing } = await supabase
        .from('candidate_answers')
        .select('*')
        .eq('attempt_id', attemptId)
        .eq('question_id', resolvedQuestionId)
        .maybeSingle();

      const newVersion = (existing?.version || 0) + 1;
      const payload: Partial<CandidateAnswer> = {
        attempt_id: attemptId,
        question_id: resolvedQuestionId,
        answer_content: content.answerContent !== undefined ? content.answerContent : existing?.answer_content,
        selected_option: content.selectedOption !== undefined ? content.selectedOption : existing?.selected_option,
        code_content: content.codeContent !== undefined ? content.codeContent : existing?.code_content,
        version: newVersion,
        saved_at: now,
        is_final: false,
      };

      const { data, error } = await supabase
        .from('candidate_answers')
        .upsert(payload, { onConflict: 'attempt_id,question_id' })
        .select()
        .single();

      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    const idx = db.answers.findIndex(
      (a) => a.attempt_id === attemptId && (a.question_id === resolvedQuestionId || a.question_id === questionId)
    );
    const existing = idx >= 0 ? db.answers[idx] : null;
    const answerRecord: CandidateAnswer = {
      id: existing ? existing.id : crypto.randomUUID(),
      attempt_id: attemptId,
      question_id: resolvedQuestionId,
      answer_content: content.answerContent !== undefined ? content.answerContent : existing?.answer_content,
      selected_option: content.selectedOption !== undefined ? content.selectedOption : existing?.selected_option,
      code_content: content.codeContent !== undefined ? content.codeContent : existing?.code_content,
      version: (existing?.version || 0) + 1,
      saved_at: now,
      is_final: false,
    };

    if (idx >= 0) {
      db.answers[idx] = answerRecord;
    } else {
      db.answers.push(answerRecord);
    }
    writeLocalDB(db);
    return answerRecord;
  },

  // ==========================================
  // Integrity Events
  // ==========================================
  async logIntegrityEvent(event: Omit<IntegrityEvent, 'id' | 'created_at'>): Promise<IntegrityEvent> {
    const isUuid = (str?: string | null) =>
      Boolean(str && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str));

    const resolvedQuestionId = event.question_id
      ? (LEGACY_QUESTION_MAP[event.question_id] || event.question_id)
      : null;

    const safeQuestionId = isSupabaseConfigured() && resolvedQuestionId && !isUuid(resolvedQuestionId)
      ? null
      : resolvedQuestionId;

    const fullEvent: IntegrityEvent = {
      ...event,
      question_id: safeQuestionId,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { error } = await supabase.from('integrity_events').insert(fullEvent);
      if (error) {
        console.warn('Failed to insert integrity event into Supabase:', error.message);
      }
      return fullEvent;
    }

    const db = readLocalDB();
    db.integrity_events.push(fullEvent);
    writeLocalDB(db);
    return fullEvent;
  },

  async getIntegrityEventsForAttempt(attemptId: string): Promise<IntegrityEvent[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('integrity_events')
        .select('*')
        .eq('attempt_id', attemptId)
        .order('created_at', { ascending: false });
      return data || [];
    }
    const db = readLocalDB();
    return db.integrity_events
      .filter((e) => e.attempt_id === attemptId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAllIntegrityEvents(): Promise<IntegrityEvent[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('integrity_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      return data || [];
    }
    const db = readLocalDB();
    return [...db.integrity_events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  // ==========================================
  // AI Evaluations & Score Overrides
  // ==========================================
  async getEvaluationsForAttempt(attemptId: string): Promise<AiEvaluation[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('ai_evaluations').select('*').eq('attempt_id', attemptId);
      return data || [];
    }
    const db = readLocalDB();
    return db.ai_evaluations.filter((ev) => ev.attempt_id === attemptId);
  },

  async saveEvaluation(evaluation: Omit<AiEvaluation, 'id' | 'evaluated_at'> & { id?: string }): Promise<AiEvaluation> {
    const full: AiEvaluation = {
      ...evaluation,
      id: evaluation.id || crypto.randomUUID(),
      evaluated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('ai_evaluations')
        .upsert(full, { onConflict: 'attempt_id,question_id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    const idx = db.ai_evaluations.findIndex((e) => e.attempt_id === full.attempt_id && e.question_id === full.question_id);
    if (idx >= 0) {
      db.ai_evaluations[idx] = full;
    } else {
      db.ai_evaluations.push(full);
    }
    writeLocalDB(db);
    return full;
  },

  async saveScoreOverride(override: Omit<ManualScoreOverride, 'id' | 'created_at'>): Promise<ManualScoreOverride> {
    const full: ManualScoreOverride = {
      ...override,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('manual_score_overrides').insert(full).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    db.score_overrides.push(full);
    writeLocalDB(db);
    return full;
  },

  async getScoreOverridesForAttempt(attemptId: string): Promise<ManualScoreOverride[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('manual_score_overrides').select('*').eq('attempt_id', attemptId);
      return data || [];
    }
    const db = readLocalDB();
    return db.score_overrides.filter((o) => o.attempt_id === attemptId);
  },

  // ==========================================
  // Code Sandbox Executions
  // ==========================================
  async saveCodeExecution(execution: Omit<CodeExecution, 'id' | 'created_at'> & { id?: string }): Promise<CodeExecution> {
    const full: CodeExecution = {
      ...execution,
      id: execution.id || crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase.from('code_executions').insert(full).select().single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    if (!db.code_executions) db.code_executions = [];
    db.code_executions.push(full);
    writeLocalDB(db);
    return full;
  },

  async getCodeExecutionsForAttempt(attemptId: string): Promise<CodeExecution[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('code_executions').select('*').eq('attempt_id', attemptId);
      return data || [];
    }
    const db = readLocalDB();
    return (db.code_executions || []).filter((e) => e.attempt_id === attemptId);
  },

  // ==========================================
  // Admin Audit Logs & Candidate Aggregates
  // ==========================================
  async logAdminAudit(log: Omit<AdminAuditLog, 'id' | 'created_at'>): Promise<void> {
    const full: AdminAuditLog = {
      ...log,
      id: crypto.randomUUID(),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      await supabase.from('admin_audit_logs').insert(full);
      return;
    }
    const db = readLocalDB();
    db.audit_logs.push(full);
    writeLocalDB(db);
  },

  async getAdminAuditLogs(): Promise<AdminAuditLog[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('admin_audit_logs').select('*').order('created_at', { ascending: false }).limit(200);
      return data || [];
    }
    assertPersistenceConfigured();
    const db = readLocalDB();
    return [...db.audit_logs].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async getAllEvaluations(): Promise<AiEvaluation[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('ai_evaluations').select('*').order('evaluated_at', { ascending: false });
      return data || [];
    }
    assertPersistenceConfigured();
    const db = readLocalDB();
    return db.ai_evaluations;
  },

  async getAllQuestions(): Promise<Question[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('questions').select('*').order('order_index');
      return data || [];
    }
    assertPersistenceConfigured();
    const db = readLocalDB();
    return db.questions;
  },

  async getAllCandidatesWithAttempts(): Promise<Array<{
    profile: Profile;
    attempt: AssessmentAttempt | null;
    answersCount: number;
    integrityEventCount: number;
    totalScore: number;
    evalStatus: string;
  }>> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data: profiles, error: pErr } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
      if (pErr) throw new Error(pErr.message);

      const { data: attempts } = await supabase.from('assessment_attempts').select('*');
      const { data: answers } = await supabase.from('candidate_answers').select('*');
      const { data: events } = await supabase.from('integrity_events').select('*');
      const { data: evals } = await supabase.from('ai_evaluations').select('*');
      const { data: overrides } = await supabase.from('manual_score_overrides').select('*');

      return (profiles || []).map((p) => {
        const attempt = attempts?.find((a) => a.candidate_id === p.id) || null;
        const candidateAnswers = attempt ? (answers?.filter((ans) => ans.attempt_id === attempt.id) || []) : [];
        const candidateEvents = attempt ? (events?.filter((e) => e.attempt_id === attempt.id) || []) : [];
        const candidateEvals = attempt ? (evals?.filter((ev) => ev.attempt_id === attempt.id) || []) : [];
        const candidateOverrides = attempt ? (overrides?.filter((o) => o.attempt_id === attempt.id) || []) : [];

        let totalScore = 0;
        candidateEvals.forEach((ev) => {
          const override = candidateOverrides.find((o) => o.question_id === ev.question_id);
          totalScore += override ? override.override_score : ev.total_score;
        });

        let evalStatus = 'Not Started';
        if (attempt) {
          if (attempt.status === 'in_progress') evalStatus = 'In Progress';
          else if (candidateEvals.length === 0) evalStatus = 'Pending Evaluation';
          else if (candidateEvals.some((e) => e.status === 'failed')) evalStatus = 'Evaluation Failed';
          else if (candidateEvals.some((e) => e.status === 'needs_review')) evalStatus = 'Needs Review';
          else evalStatus = 'Completed';
        }

        return {
          profile: p,
          attempt,
          answersCount: candidateAnswers.length,
          integrityEventCount: candidateEvents.length,
          totalScore: Math.round(totalScore * 100) / 100,
          evalStatus,
        };
      });
    }

    assertPersistenceConfigured();
    const db = readLocalDB();
    const profiles = db.profiles;

    return profiles.map((p) => {
      const attempt = db.attempts.find((a) => a.candidate_id === p.id) || null;
      const answers = attempt ? db.answers.filter((ans) => ans.attempt_id === attempt.id) : [];
      const events = attempt ? db.integrity_events.filter((e) => e.attempt_id === attempt.id) : [];
      const evals = attempt ? db.ai_evaluations.filter((ev) => ev.attempt_id === attempt.id) : [];
      const overrides = attempt ? db.score_overrides.filter((o) => o.attempt_id === attempt.id) : [];

      let totalScore = 0;
      evals.forEach((ev) => {
        const override = overrides.find((o) => o.question_id === ev.question_id);
        totalScore += override ? override.override_score : ev.total_score;
      });

      let evalStatus = 'Not Started';
      if (attempt) {
        if (attempt.status === 'in_progress') evalStatus = 'In Progress';
        else if (evals.length === 0) evalStatus = 'Pending Evaluation';
        else if (evals.some((e) => e.status === 'failed')) evalStatus = 'Evaluation Failed';
        else if (evals.some((e) => e.status === 'needs_review')) evalStatus = 'Needs Review';
        else evalStatus = 'Completed';
      }

      return {
        profile: p,
        attempt,
        answersCount: answers.length,
        integrityEventCount: events.length,
        totalScore: Math.round(totalScore * 100) / 100,
        evalStatus,
      };
    });
  },

  // ==========================================
  // Evaluation Jobs Queue
  // ==========================================
  async enqueueEvaluationJob(attemptId: string, questionId: string): Promise<EvaluationJob> {
    const now = new Date().toISOString();
    const job: EvaluationJob = {
      id: crypto.randomUUID(),
      attempt_id: attemptId,
      question_id: questionId,
      status: 'pending',
      retry_count: 0,
      last_error: null,
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('evaluation_jobs')
        .upsert(job, { onConflict: 'attempt_id,question_id' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    const idx = db.evaluation_jobs.findIndex((j) => j.attempt_id === attemptId && j.question_id === questionId);
    if (idx >= 0) {
      db.evaluation_jobs[idx] = { ...db.evaluation_jobs[idx], status: 'pending', updated_at: now };
      writeLocalDB(db);
      return db.evaluation_jobs[idx];
    } else {
      db.evaluation_jobs.push(job);
      writeLocalDB(db);
      return job;
    }
  },

  async enqueueEvaluationJobsForAttempt(attemptId: string, questionIds: string[]): Promise<EvaluationJob[]> {
    const jobs: EvaluationJob[] = [];
    for (const qId of questionIds) {
      const job = await this.enqueueEvaluationJob(attemptId, qId);
      jobs.push(job);
    }
    return jobs;
  },

  async getEvaluationJobsForAttempt(attemptId: string): Promise<EvaluationJob[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('evaluation_jobs').select('*').eq('attempt_id', attemptId);
      return data || [];
    }
    const db = readLocalDB();
    return db.evaluation_jobs.filter((j) => j.attempt_id === attemptId);
  },

  async updateEvaluationJob(id: string, updates: Partial<EvaluationJob>): Promise<EvaluationJob> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('evaluation_jobs')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    const db = readLocalDB();
    const idx = db.evaluation_jobs.findIndex((j) => j.id === id);
    if (idx === -1) throw new Error('Evaluation job not found');
    db.evaluation_jobs[idx] = { ...db.evaluation_jobs[idx], ...updates, updated_at: now };
    writeLocalDB(db);
    return db.evaluation_jobs[idx];
  },

  async getPendingEvaluationJobs(limit = 10): Promise<EvaluationJob[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('evaluation_jobs')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(limit);
      return data || [];
    }
    const db = readLocalDB();
    return db.evaluation_jobs.filter((j) => j.status === 'pending').slice(0, limit);
  },

  async approveEvaluation(
    evaluationId: string,
    adminEmail: string,
    approvedScore?: number,
    reviewNotes?: string
  ): Promise<AiEvaluation> {
    const now = new Date().toISOString();
    let existing: AiEvaluation | null = null;
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('ai_evaluations').select('*').eq('id', evaluationId).single();
      existing = data || null;
    } else {
      const db = readLocalDB();
      existing = db.ai_evaluations.find((e) => e.id === evaluationId) || null;
    }

    if (!existing) throw new Error('Evaluation not found');
    const finalScore = approvedScore !== undefined ? approvedScore : (existing.approved_score ?? existing.total_score);

    const updates: Partial<AiEvaluation> = {
      is_approved: true,
      approved_by: adminEmail,
      approved_at: now,
      approved_score: finalScore,
      review_notes: reviewNotes !== undefined ? reviewNotes : existing.review_notes,
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('ai_evaluations')
        .update(updates)
        .eq('id', evaluationId)
        .select()
        .single();
      if (error) throw new Error(error.message);
      existing = data;
    } else {
      const db = readLocalDB();
      const idx = db.ai_evaluations.findIndex((e) => e.id === evaluationId);
      if (idx >= 0) {
        db.ai_evaluations[idx] = { ...db.ai_evaluations[idx], ...updates };
        writeLocalDB(db);
        existing = db.ai_evaluations[idx];
      }
    }

    await this.logAdminAudit({
      admin_email: adminEmail,
      action: 'APPROVE_EVALUATION',
      target_type: 'AI_EVALUATION',
      target_id: evaluationId,
      details: { approvedScore: finalScore, reviewNotes },
    });

    return existing!;
  },

  // ==========================================
  // Confidential Reports
  // ==========================================
  async createConfidentialReport(report: Omit<ConfidentialReport, 'id' | 'created_at' | 'updated_at'>): Promise<ConfidentialReport> {
    const now = new Date().toISOString();
    const newReport: ConfidentialReport = {
      ...report,
      id: crypto.randomUUID(),
      created_at: now,
      updated_at: now,
    };

    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('confidential_reports')
        .upsert(newReport, { onConflict: 'assessment_id,version' })
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }

    const db = readLocalDB();
    const existingIdx = db.confidential_reports.findIndex(
      (r) => r.assessment_id === report.assessment_id && r.version === report.version
    );
    if (existingIdx >= 0) {
      db.confidential_reports[existingIdx] = { ...db.confidential_reports[existingIdx], ...newReport };
      writeLocalDB(db);
      return db.confidential_reports[existingIdx];
    } else {
      db.confidential_reports.push(newReport);
      writeLocalDB(db);
      return newReport;
    }
  },

  async getConfidentialReportById(id: string): Promise<ConfidentialReport | null> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase.from('confidential_reports').select('*').eq('id', id).single();
      return data || null;
    }
    const db = readLocalDB();
    return db.confidential_reports.find((r) => r.id === id) || null;
  },

  async getConfidentialReportsForAssessment(assessmentId: string): Promise<ConfidentialReport[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('confidential_reports')
        .select('*')
        .eq('assessment_id', assessmentId)
        .order('version', { ascending: false });
      return data || [];
    }
    const db = readLocalDB();
    return db.confidential_reports
      .filter((r) => r.assessment_id === assessmentId)
      .sort((a, b) => b.version - a.version);
  },

  async getAllConfidentialReports(): Promise<ConfidentialReport[]> {
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from('confidential_reports')
        .select('*')
        .order('created_at', { ascending: false });
      return data || [];
    }
    const db = readLocalDB();
    return [...db.confidential_reports].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  async updateConfidentialReport(id: string, updates: Partial<ConfidentialReport>): Promise<ConfidentialReport> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured()) {
      const supabase = createAdminClient();
      const { data, error } = await supabase
        .from('confidential_reports')
        .update({ ...updates, updated_at: now })
        .eq('id', id)
        .select()
        .single();
      if (error) throw new Error(error.message);
      return data;
    }
    const db = readLocalDB();
    const idx = db.confidential_reports.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Report not found');
    db.confidential_reports[idx] = { ...db.confidential_reports[idx], ...updates, updated_at: now };
    writeLocalDB(db);
    return db.confidential_reports[idx];
  },

  async getLatestConfidentialReport(assessmentId: string): Promise<ConfidentialReport | null> {
    const reports = await this.getConfidentialReportsForAssessment(assessmentId);
    return reports[0] || null;
  },

  // ==========================================
  // Candidate Facing Status Helper
  // ==========================================
  async getCandidateFacingStatus(candidateId: string, assessmentId: string): Promise<{
    status: CandidateFacingStatus;
    attempt: AssessmentAttempt | null;
    approvedScore: number | null;
    maxScore: number | null;
    feedback: string | null;
  }> {
    const attempt = await this.getAttemptByCandidateAndAssessment(candidateId, assessmentId);
    if (!attempt) {
      return {
        status: 'Not Started',
        attempt: null,
        approvedScore: null,
        maxScore: null,
        feedback: null,
      };
    }

    if (attempt.status === 'in_progress') {
      return {
        status: 'In Progress',
        attempt,
        approvedScore: null,
        maxScore: null,
        feedback: null,
      };
    }

    const assessment = await this.getAssessmentById(assessmentId);
    const questions = await this.getQuestionsForAssessment(assessmentId, false);
    const totalMaxScore = questions.reduce((sum, q) => sum + Number(q.max_score || 0), 0);

    // If results published, return approved results
    if (assessment?.is_results_published) {
      const evals = await this.getEvaluationsForAttempt(attempt.id);
      const overrides = await this.getScoreOverridesForAttempt(attempt.id);

      let totalScore = 0;
      evals.forEach((ev) => {
        const ov = overrides.find((o) => o.question_id === ev.question_id);
        if (ov) {
          totalScore += ov.override_score;
        } else if (ev.approved_score !== undefined && ev.approved_score !== null) {
          totalScore += ev.approved_score;
        } else {
          totalScore += ev.total_score;
        }
      });

      const feedbackNotes = evals
        .map((e) => e.review_notes)
        .filter(Boolean)
        .join('\n\n');

      return {
        status: 'Results Published',
        attempt,
        approvedScore: Math.round(totalScore * 100) / 100,
        maxScore: totalMaxScore,
        feedback: feedbackNotes || 'Assessment review completed by the qualification committee.',
      };
    }

    // Results NOT published: strictly confidential!
    const jobs = await this.getEvaluationJobsForAttempt(attempt.id);
    const evals = await this.getEvaluationsForAttempt(attempt.id);

    let status: CandidateFacingStatus = 'Submitted, Evaluation Pending';
    if (jobs.some((j) => j.status === 'processing')) {
      status = 'Evaluation in Progress';
    } else if (
      jobs.some((j) => j.status === 'failed' || j.status === 'requires_review') ||
      evals.some((e) => e.status === 'failed' || e.status === 'needs_review')
    ) {
      status = 'Evaluation Requires Review';
    } else if (
      (jobs.length > 0 && jobs.every((j) => j.status === 'completed')) ||
      (jobs.length === 0 && evals.length > 0 && evals.every((e) => e.status === 'completed'))
    ) {
      status = 'Awaiting Administrator Review';
    } else {
      status = 'Submitted, Evaluation Pending';
    }

    return {
      status,
      attempt,
      approvedScore: null,
      maxScore: null,
      feedback: null,
    };
  },
};

