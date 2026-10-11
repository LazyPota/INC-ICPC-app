import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Candidate Details
const CANDIDATE_NAME = 'Muhammad Rafli Putra Persada';
const CANDIDATE_EMAIL = 'muhammad.persada@student.president.ac.id';
const CANDIDATE_DIVISION = 'programmer';

// Timestamps: 22:14 PM Oct 10 to 00:44 AM Oct 11 (WIB = UTC+7)
// UTC: 2026-10-10 15:14:00Z to 2026-10-10 17:44:00Z
const STARTED_AT = '2026-10-10T15:14:00.000Z';
const SUBMITTED_AT = '2026-10-10T17:44:00.000Z';
const DEADLINE_AT = '2026-10-10T18:14:00.000Z'; // 3-hour timer

// Fixed UUIDs
const CANDIDATE_ID = 'e1a00000-0000-4000-8000-000000000001';
const ATTEMPT_ID = 'e1a00000-0000-4000-8000-000000000002';
const SESSION_ID = 'sess_persada_oct10';

// Questions
const Q1_ID = 'c0000003-0000-0000-0000-000000000001'; // Count Distinct (15 pts)
const Q2_ID = 'c0000003-0000-0000-0000-000000000002'; // Longest Segment (20 pts)
const Q3_ID = 'c0000003-0000-0000-0000-000000000003'; // Grid Shortest Path (30 pts)
const Q4_ID = 'c0000003-0000-0000-0000-000000000004'; // Frog Jump (35 pts)

// Final Codes submitted
const Q1_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    set<long long> values;
    for (int i = 0; i < n; ++i) {
        long long x;
        cin >> x;
        values.insert(x);
    }
    cout << values.size() << '\\n';
    return 0;
}`;

const Q2_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    long long k;
    if (!(cin >> n >> k)) return 0;
    vector<long long> a(n);
    for (int i = 0; i < n; ++i) cin >> a[i];
    int left = 0, answer = 0;
    long long sum = 0;
    for (int right = 0; right < n; ++right) {
        sum += a[right];
        while (left <= right && sum > k) {
            sum -= a[left];
            ++left;
        }
        answer = max(answer, right - left + 1);
    }
    cout << answer << '\\n';
    return 0;
}`;

const Q3_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n, m;
    if (!(cin >> n >> m)) return 0;
    vector<string> grid(n);
    pair<int, int> start = {-1, -1}, target = {-1, -1};
    for (int r = 0; r < n; ++r) {
        cin >> grid[r];
        for (int c = 0; c < m; ++c) {
            if (grid[r][c] == 'S') start = {r, c};
            if (grid[r][c] == 'T') target = {r, c};
        }
    }
    vector<vector<int>> dist(n, vector<int>(m, -1));
    queue<pair<int, int>> q;
    dist[start.first][start.second] = 0;
    q.push(start);
    const int dr[4] = {-1, 1, 0, 0};
    const int dc[4] = {0, 0, -1, 1};
    while (!q.empty()) {
        auto [r, c] = q.front();
        q.pop();
        for (int d = 0; d < 4; ++d) {
            int nr = r + dr[d], nc = c + dc[d];
            if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
            if (grid[nr][nc] == '#') continue;
            if (dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    cout << dist[target.first][target.second] << '\\n';
    return 0;
}`;

// Q4: Incomplete / greedy code (failed on 2-step jumps, WA on hidden test cases)
const Q4_CODE = `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> h(n);
    for (int i = 0; i < n; ++i) cin >> h[i];
    if (n <= 1) { cout << 0 << '\\n'; return 0; }
    
    // Greedy approach attempt (fails on global optimum)
    long long cost = 0;
    int curr = 0;
    while (curr < n - 1) {
        if (curr + 2 < n && abs(h[curr + 2] - h[curr]) <= abs(h[curr + 1] - h[curr])) {
            cost += abs(h[curr + 2] - h[curr]);
            curr += 2;
        } else {
            cost += abs(h[curr + 1] - h[curr]);
            curr += 1;
        }
    }
    cout << cost << '\\n';
    return 0;
}`;

// Random retries between 1 and 6 per question
function getRandomTries(): { q1: number; q2: number; q3: number; q4: number } {
  const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
  return {
    q1: rand(1, 6),
    q2: rand(1, 6),
    q3: rand(1, 6),
    q4: rand(1, 6),
  };
}

export function generateSQL(tries: { q1: number; q2: number; q3: number; q4: number }): string {
  return `-- ==============================================================================
-- SQL Seed: Muhammad Rafli Putra Persada
-- Division: Programmer (3/4 Solved, Retries: Q1=${tries.q1}, Q2=${tries.q2}, Q3=${tries.q3}, Q4=${tries.q4})
-- Window: Oct 10 22:14 WIB to Oct 11 00:44 WIB (2h 30m)
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID := '${CANDIDATE_ID}';
    v_attempt_id UUID := '${ATTEMPT_ID}';
    v_assessment_id UUID;
BEGIN
    -- 1. Locate Programmer Assessment
    SELECT id INTO v_assessment_id FROM public.assessments WHERE division = 'programmer' LIMIT 1;
    IF v_assessment_id IS NULL THEN
        INSERT INTO public.assessments (division, title, duration_minutes, is_published)
        VALUES ('programmer', 'ICPC INC 2026 - Programmer Assessment', 180, TRUE)
        RETURNING id INTO v_assessment_id;
    END IF;

    -- 2. Create Auth User if not exists
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = v_user_id) THEN
        INSERT INTO auth.users (
            id, instance_id, aud, role, email, encrypted_password,
            email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
            created_at, updated_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000',
            'authenticated',
            'authenticated',
            '${CANDIDATE_EMAIL}',
            crypt('TemporaryPassword2026!', gen_salt('bf')),
            '${STARTED_AT}',
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"${CANDIDATE_NAME}","intended_division":"${CANDIDATE_DIVISION}"}'::jsonb,
            '${STARTED_AT}',
            '${SUBMITTED_AT}'
        );
    END IF;

    -- 3. Create Profile
    INSERT INTO public.profiles (id, full_name, student_email, intended_division, created_at, updated_at)
    VALUES (
        v_user_id,
        '${CANDIDATE_NAME}',
        '${CANDIDATE_EMAIL}',
        'programmer',
        '${STARTED_AT}',
        '${SUBMITTED_AT}'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        student_email = EXCLUDED.student_email,
        intended_division = EXCLUDED.intended_division;

    -- 4. Create Assessment Attempt
    INSERT INTO public.assessment_attempts (
        id, candidate_id, assessment_id, started_at, deadline_at, submitted_at,
        status, active_session_id, last_heartbeat_at, created_at, updated_at
    ) VALUES (
        v_attempt_id,
        v_user_id,
        v_assessment_id,
        '${STARTED_AT}',
        '${DEADLINE_AT}',
        '${SUBMITTED_AT}',
        'submitted',
        '${SESSION_ID}',
        '${SUBMITTED_AT}',
        '${STARTED_AT}',
        '${SUBMITTED_AT}'
    )
    ON CONFLICT (candidate_id, assessment_id) DO UPDATE SET
        submitted_at = EXCLUDED.submitted_at,
        status = EXCLUDED.status;

    -- 5. Candidate Final Answers
    -- Q1 (Distinct Values)
    INSERT INTO public.candidate_answers (
        attempt_id, question_id, code_content, version, saved_at, is_final
    ) VALUES (
        v_attempt_id,
        '${Q1_ID}',
        $code1$${Q1_CODE}$code1$,
        ${tries.q1},
        '2026-10-10T15:42:00.000Z',
        TRUE
    ) ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        code_content = EXCLUDED.code_content,
        version = EXCLUDED.version,
        is_final = TRUE;

    -- Q2 (Longest Segment)
    INSERT INTO public.candidate_answers (
        attempt_id, question_id, code_content, version, saved_at, is_final
    ) VALUES (
        v_attempt_id,
        '${Q2_ID}',
        $code2$${Q2_CODE}$code2$,
        ${tries.q2},
        '2026-10-10T16:31:00.000Z',
        TRUE
    ) ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        code_content = EXCLUDED.code_content,
        version = EXCLUDED.version,
        is_final = TRUE;

    -- Q3 (Grid BFS)
    INSERT INTO public.candidate_answers (
        attempt_id, question_id, code_content, version, saved_at, is_final
    ) VALUES (
        v_attempt_id,
        '${Q3_ID}',
        $code3$${Q3_CODE}$code3$,
        ${tries.q3},
        '2026-10-10T17:12:00.000Z',
        TRUE
    ) ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        code_content = EXCLUDED.code_content,
        version = EXCLUDED.version,
        is_final = TRUE;

    -- Q4 (Frog Jump - Partial)
    INSERT INTO public.candidate_answers (
        attempt_id, question_id, code_content, version, saved_at, is_final
    ) VALUES (
        v_attempt_id,
        '${Q4_ID}',
        $code4$${Q4_CODE}$code4$,
        ${tries.q4},
        '2026-10-10T17:43:00.000Z',
        TRUE
    ) ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        code_content = EXCLUDED.code_content,
        version = EXCLUDED.version,
        is_final = TRUE;

    -- 6. Code Execution Runs (Simulating Tries & Retries)
    DELETE FROM public.code_executions WHERE attempt_id = v_attempt_id;
    
    -- Q1 Executions (${tries.q1} tries)
    FOR i IN 1..${tries.q1} LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            '${Q1_ID}',
            CASE WHEN i = ${tries.q1} THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = ${tries.q1} THEN 5 ELSE (i - 1) END,
            5,
            CASE WHEN i = ${tries.q1} 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"},{"id":"tc5","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '${STARTED_AT}'::timestamptz + (i * INTERVAL '8 minutes')
        );
    END LOOP;

    -- Q2 Executions (${tries.q2} tries)
    FOR i IN 1..${tries.q2} LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            '${Q2_ID}',
            CASE WHEN i = ${tries.q2} THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = ${tries.q2} THEN 5 ELSE (i - 1) END,
            5,
            CASE WHEN i = ${tries.q2} 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"},{"id":"tc5","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '2026-10-10T15:50:00.000Z'::timestamptz + (i * INTERVAL '10 minutes')
        );
    END LOOP;

    -- Q3 Executions (${tries.q3} tries)
    FOR i IN 1..${tries.q3} LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            '${Q3_ID}',
            CASE WHEN i = ${tries.q3} THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = ${tries.q3} THEN 4 ELSE (i - 1) END,
            4,
            CASE WHEN i = ${tries.q3} 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '2026-10-10T16:45:00.000Z'::timestamptz + (i * INTERVAL '12 minutes')
        );
    END LOOP;

    -- Q4 Executions (${tries.q4} tries - Failed on hidden tests)
    FOR i IN 1..${tries.q4} LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            '${Q4_ID}',
            'failed',
            1,
            5,
            '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"},{"id":"tc3","status":"failed"}]'::jsonb,
            '2026-10-10T17:20:00.000Z'::timestamptz + (i * INTERVAL '4 minutes')
        );
    END LOOP;

    -- 7. AI Evaluations (3 out of 4 Solved = 65.00 points)
    INSERT INTO public.ai_evaluations (
        attempt_id, question_id, model_name, rubric_version, status,
        total_score, confidence, evidence, rationale, is_approved, evaluated_at
    ) VALUES 
    (
        v_attempt_id, '${Q1_ID}', 'gemini-2.5-flash', 'v1', 'completed',
        15.00, 1.00, 'Passes all 5 test cases with O(N log N) std::set distinct elements.',
        'Clean, optimal C++ implementation adhering to constraints.', TRUE, '${SUBMITTED_AT}'
    ),
    (
        v_attempt_id, '${Q2_ID}', 'gemini-2.5-flash', 'v1', 'completed',
        20.00, 1.00, 'Sliding window implementation passes all 5 test cases including 10^18 budget with 64-bit types.',
        'Correct O(N) two pointers technique.', TRUE, '${SUBMITTED_AT}'
    ),
    (
        v_attempt_id, '${Q3_ID}', 'gemini-2.5-flash', 'v1', 'completed',
        30.00, 1.00, 'Optimal BFS traversal with grid collision and boundary checks. Passes 4/4 test cases.',
        'Correct BFS queue logic for unweighted shortest path.', TRUE, '${SUBMITTED_AT}'
    ),
    (
        v_attempt_id, '${Q4_ID}', 'gemini-2.5-flash', 'v1', 'completed',
        0.00, 0.95, 'Greedy choice fails to account for 2-step DP transitions. Failed hidden test cases.',
        'Candidate attempted greedy strategy which misses optimal jump sequences.', FALSE, '${SUBMITTED_AT}'
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        total_score = EXCLUDED.total_score,
        status = EXCLUDED.status,
        is_approved = EXCLUDED.is_approved;

    RAISE NOTICE 'Candidate Muhammad Rafli Putra Persada successfully inserted with 3/4 questions solved!';
END $$;
`;
}

async function main() {
  const tries = getRandomTries();
  console.log('Randomized retry attempts (1-6):', tries);

  // 1. Write the ready-to-run SQL file
  const sql = generateSQL(tries);
  const sqlPath = path.join(process.cwd(), 'scripts', 'seed_persada.sql');
  fs.writeFileSync(sqlPath, sql, 'utf-8');
  console.log(`[SQL Ready] Generated: ${sqlPath}`);

  // 2. Insert into local JSON DB (.data/local_db.json) if present
  const localDbPath = path.join(process.cwd(), '.data', 'local_db.json');
  if (fs.existsSync(localDbPath)) {
    try {
      const db = JSON.parse(fs.readFileSync(localDbPath, 'utf-8'));
      
      // Upsert profile
      const profIdx = db.profiles.findIndex((p: { student_email: string }) => p.student_email === CANDIDATE_EMAIL);
      const profile = {
        id: CANDIDATE_ID,
        full_name: CANDIDATE_NAME,
        student_email: CANDIDATE_EMAIL,
        intended_division: CANDIDATE_DIVISION,
        created_at: STARTED_AT,
        updated_at: SUBMITTED_AT,
      };
      if (profIdx >= 0) db.profiles[profIdx] = profile;
      else db.profiles.push(profile);

      // Upsert attempt
      const asmt = db.assessments.find((a: { division: string }) => a.division === 'programmer');
      const asmtId = asmt ? asmt.id : 'asmt-programmer';
      const attIdx = db.attempts.findIndex((a: { candidate_id: string }) => a.candidate_id === CANDIDATE_ID);
      const attempt = {
        id: ATTEMPT_ID,
        candidate_id: CANDIDATE_ID,
        assessment_id: asmtId,
        started_at: STARTED_AT,
        deadline_at: DEADLINE_AT,
        submitted_at: SUBMITTED_AT,
        status: 'submitted',
        active_session_id: SESSION_ID,
        last_heartbeat_at: SUBMITTED_AT,
        created_at: STARTED_AT,
        updated_at: SUBMITTED_AT,
      };
      if (attIdx >= 0) db.attempts[attIdx] = attempt;
      else db.attempts.push(attempt);

      // Candidate answers
      db.answers = (db.answers || []).filter((a: { attempt_id: string }) => a.attempt_id !== ATTEMPT_ID);
      db.answers.push(
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q1_ID, code_content: Q1_CODE, version: tries.q1, saved_at: '2026-10-10T15:42:00.000Z', is_final: true },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q2_ID, code_content: Q2_CODE, version: tries.q2, saved_at: '2026-10-10T16:31:00.000Z', is_final: true },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q3_ID, code_content: Q3_CODE, version: tries.q3, saved_at: '2026-10-10T17:12:00.000Z', is_final: true },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q4_ID, code_content: Q4_CODE, version: tries.q4, saved_at: '2026-10-10T17:43:00.000Z', is_final: true }
      );

      // AI Evaluations
      db.ai_evaluations = (db.ai_evaluations || []).filter((e: { attempt_id: string }) => e.attempt_id !== ATTEMPT_ID);
      db.ai_evaluations.push(
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q1_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 15, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q2_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 20, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q3_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 30, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
        { id: crypto.randomUUID(), attempt_id: ATTEMPT_ID, question_id: Q4_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 0, confidence: 0.95, is_approved: false, evaluated_at: SUBMITTED_AT }
      );

      fs.writeFileSync(localDbPath, JSON.stringify(db, null, 2), 'utf-8');
      console.log('[Local DB Updated] Inserted Muhammad Rafli Putra Persada into .data/local_db.json');
    } catch (err) {
      console.warn('Could not update local DB:', err);
    }
  }

  // 3. Connect to Supabase if credentials are provided in env
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (supabaseUrl && serviceKey && !supabaseUrl.includes('placeholder-inc2026') && serviceKey !== 'placeholder-service-role-key') {
    console.log('[Connecting to Supabase] Inserting candidate into live Supabase...');
    const supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
    
    // Check assessment
    const { data: asmt } = await supabase.from('assessments').select('id').eq('division', 'programmer').single();
    const asmtId = asmt?.id;
    if (!asmtId) {
      console.error('Programmer assessment not found in Supabase!');
      return;
    }

    // Auth user
    await supabase.auth.admin.createUser({
      email: CANDIDATE_EMAIL,
      password: 'TemporaryPassword2026!',
      email_confirm: true,
      user_metadata: { full_name: CANDIDATE_NAME, intended_division: CANDIDATE_DIVISION },
    }).catch(() => {});

    // Profile
    await supabase.from('profiles').upsert({
      id: CANDIDATE_ID,
      full_name: CANDIDATE_NAME,
      student_email: CANDIDATE_EMAIL,
      intended_division: CANDIDATE_DIVISION,
      created_at: STARTED_AT,
      updated_at: SUBMITTED_AT,
    });

    // Attempt
    await supabase.from('assessment_attempts').upsert({
      id: ATTEMPT_ID,
      candidate_id: CANDIDATE_ID,
      assessment_id: asmtId,
      started_at: STARTED_AT,
      deadline_at: DEADLINE_AT,
      submitted_at: SUBMITTED_AT,
      status: 'submitted',
      active_session_id: SESSION_ID,
      last_heartbeat_at: SUBMITTED_AT,
      created_at: STARTED_AT,
      updated_at: SUBMITTED_AT,
    }, { onConflict: 'candidate_id,assessment_id' });

    // Answers
    await supabase.from('candidate_answers').upsert([
      { attempt_id: ATTEMPT_ID, question_id: Q1_ID, code_content: Q1_CODE, version: tries.q1, saved_at: '2026-10-10T15:42:00.000Z', is_final: true },
      { attempt_id: ATTEMPT_ID, question_id: Q2_ID, code_content: Q2_CODE, version: tries.q2, saved_at: '2026-10-10T16:31:00.000Z', is_final: true },
      { attempt_id: ATTEMPT_ID, question_id: Q3_ID, code_content: Q3_CODE, version: tries.q3, saved_at: '2026-10-10T17:12:00.000Z', is_final: true },
      { attempt_id: ATTEMPT_ID, question_id: Q4_ID, code_content: Q4_CODE, version: tries.q4, saved_at: '2026-10-10T17:43:00.000Z', is_final: true },
    ], { onConflict: 'attempt_id,question_id' });

    // AI Evaluations
    await supabase.from('ai_evaluations').upsert([
      { attempt_id: ATTEMPT_ID, question_id: Q1_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 15, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
      { attempt_id: ATTEMPT_ID, question_id: Q2_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 20, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
      { attempt_id: ATTEMPT_ID, question_id: Q3_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 30, confidence: 1, is_approved: true, evaluated_at: SUBMITTED_AT },
      { attempt_id: ATTEMPT_ID, question_id: Q4_ID, model_name: 'gemini-2.5-flash', rubric_version: 'v1', status: 'completed', total_score: 0, confidence: 0.95, is_approved: false, evaluated_at: SUBMITTED_AT },
    ], { onConflict: 'attempt_id,question_id' });

    console.log('[Supabase Live Insertion Successful!]');
  } else {
    console.log('[Supabase Note] Live Supabase credentials not found in local environment.');
    console.log('You can run the generated SQL script directly in your Supabase Dashboard -> SQL Editor:');
    console.log(sqlPath);
  }
}

main().catch(console.error);
