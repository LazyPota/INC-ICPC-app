# INC 2026 Candidate Assessment Platform
**President University ICPC Team Qualification System**

A production-minded, high-integrity online assessment platform built for the 4-day internal qualification period for candidates preparing for the ICPC Indonesia National Contest (INC) 2026.

---

## 1. Prerequisites
- **Node.js**: v20+ or v22+ (tested on v26)
- **Package Manager**: `npm`
- **Supabase Account**: (Cloud or Self-Hosted) for PostgreSQL database, authentication, and RLS policies.
- **Google AI Studio Account**: For Gemini Developer API evaluation key (`GEMINI_API_KEY`).
- *(Optional)* **Judge0 Account or Instance**: For C++ sandboxed code execution.

---

## 2. Installation

1. Clone or navigate to the project directory:
   ```bash
   cd INC-ICPC-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

---

## 3. Local Development

Start the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 4. Supabase Project Setup & Database Migrations

1. Create a new project in the [Supabase Dashboard](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase project.
3. Open `supabase/migrations/20260101_init_schema.sql` from this repository.
4. Copy and execute the entire SQL script. It creates:
   - Enums: `division_type`, `question_type_enum`, `attempt_status_enum`, `event_severity_enum`, `eval_status_enum`.
   - Tables: `profiles`, `assessments`, `questions`, `private_question_configs`, `assessment_attempts`, `candidate_answers`, `integrity_events`, `ai_evaluations`, `manual_score_overrides`, `code_executions`, `admin_audit_logs`.
   - Indexes and constraints (including `@student.president.ac.id` regex constraint).
   - Strict Row Level Security (RLS) policies ensuring candidates cannot read other candidates' submissions or private grading rubrics/reference answers.
5. In **Authentication -> URL Configuration**, configure your site URL (e.g. `http://localhost:3000` for development or your Vercel domain for production).

---

## 5. Environment Variable Configuration

Create a `.env.local` file in the root directory (refer to `.env.example`):

```bash
# Supabase Configuration (Settings -> API)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...

# Google Gemini AI Configuration
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-3.8-flash

# Administrator Email Allowlist (Comma-separated)
ADMIN_EMAILS=coach@student.president.ac.id,admin@student.president.ac.id

# App Base URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Judge0 Sandbox
JUDGE0_API_URL=
JUDGE0_API_KEY=
```

> **Zero-Dependency Development Mode**: If you start the app without setting Supabase or Gemini keys, the application automatically uses an internal persistent store (`.data/local_db.json`) and flags AI grading as `needs_review` or pending configuration. All candidate flows, proctoring, and administrative workflows work immediately.

---

## 6. Email & Authentication Policy

- **Institutional Domain Required**: Candidates must register using an official student email matching `@student.president.ac.id`. This is validated both on the client and server using regular expression checks and database constraints.
- **Single Registration**: Enforced via email uniqueness.
- **Division Selection**: Candidates choose one of:
  1. **Problem Analysis**
  2. **Algorithm Builder**
  3. **Programmer**
  Candidates can modify their division from their dashboard before starting. Once the assessment attempt is started, the division choice is locked permanently.

---

## 7. Gemini AI Evaluation Engine

- Model: `gemini-3.8-flash` (configurable via `GEMINI_MODEL`).
- Evaluation occurs **asynchronously after the candidate submits** or the deadline expires. No live hints or coaching are given to candidates.
- **Privacy & Anonymization**: Student names, emails, and personal identifiers are **never** transmitted to the AI provider. Only an anonymized attempt reference, the problem statement, private rubric criteria, and candidate answer text are provided.
- **Prompt Defense**: System instructions explicitly instruct the evaluator to ignore any candidate text attempting to command the judge (e.g., prompt injection).
- **Zod Validation & Score Clamping**: All model outputs are parsed against `GeminiEvaluationOutputSchema` and scores are clamped strictly to configured rubric limits.

---

## 8. Sandboxed Code Execution (Judge0)

- If Judge0 is configured (`JUDGE0_API_URL` and `JUDGE0_API_KEY`), C++ code submissions are evaluated against hidden test cases in a sandboxed container.
- If unconfigured, code submissions are securely stored in the database and marked as `Sandbox Unavailable`, preserving the source code for manual review without fabricating results.

---

## 9. Administrator Dashboard

Access the administrative interface at `/admin`.
- Accessible only to authenticated emails listed in `ADMIN_EMAILS`.
- Candidates attempting to access `/admin` or administrative API routes receive an HTTP 403 Forbidden.
- Capabilities:
  - **Overview**: Real-time registration metrics, active attempts, submission counts, and audit logs.
  - **Candidates**: Search, filter, view attempt timelines, examine answers, and override scores.
  - **Assessments**: Manage question banks, set 3–5 question limits, configure private rubrics, and toggle publication.
  - **AI Grading**: Inspect criterion breakdown, confidence ratings, and trigger re-evaluation.
  - **Integrity Logs**: View browser visibility, blur, duplicate tab detection, and clipboard events.
  - **Export CSV**: One-click export of candidate results with WIB formatted timestamps.

---

## 10. Automated Testing

Run the automated test suite using Vitest:
```bash
npm test
```

The test suite covers:
- Institutional email regex and Zod schemas
- Authoritative 180-minute countdown calculation and expiration
- Atomic attempt creation and version-incremented answer saving
- Post-deadline modification prevention
- AI structured output validation and score clamping
- Prompt injection defense
- Admin email allowlist verification
- Proctor event sanitization and administrative audit logs

---

## 11. Production Build & Deployment

To verify and build for production:
```bash
npm run build
npm start
```

### Deploying to Vercel:
1. Push repository to GitHub.
2. Import project into Vercel.
3. Configure the environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, `ADMIN_EMAILS`).
4. Deploy!

---

## 12. Security Limitations and Operational Notes

- **Browser Integrity Scope**: This platform runs in a standard browser. While it monitors and logs tab visibility, window blur, multiple active tabs, and clipboard attempts, it is not a locked-down operating-system browser.
- **Authoritative Server Timer**: All countdowns are derived from the persisted server deadline (`deadline_at`). Client clocks cannot alter the time limit.
- **Zero Question Bank Pre-seeding**: The question bank starts strictly empty. Questions and private rubrics must be configured by administrators via `/admin/assessments`.
