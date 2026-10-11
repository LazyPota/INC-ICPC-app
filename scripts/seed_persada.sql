-- ==============================================================================
-- SQL Seed: Muhammad Rafli Putra Persada
-- Division: Programmer (3/4 Solved, Retries: Q1=2, Q2=2, Q3=5, Q4=4)
-- Window: Oct 10 22:14 WIB to Oct 11 00:44 WIB (2h 30m)
-- ==============================================================================

DO $$
DECLARE
    v_user_id UUID := 'e1a00000-0000-4000-8000-000000000001';
    v_attempt_id UUID := 'e1a00000-0000-4000-8000-000000000002';
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
            'muhammad.persada@student.president.ac.id',
            crypt('TemporaryPassword2026!', gen_salt('bf')),
            '2026-10-10T15:14:00.000Z',
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"full_name":"Muhammad Rafli Putra Persada","intended_division":"programmer"}'::jsonb,
            '2026-10-10T15:14:00.000Z',
            '2026-10-10T17:44:00.000Z'
        );
    END IF;

    -- 3. Create Profile
    INSERT INTO public.profiles (id, full_name, student_email, intended_division, created_at, updated_at)
    VALUES (
        v_user_id,
        'Muhammad Rafli Putra Persada',
        'muhammad.persada@student.president.ac.id',
        'programmer',
        '2026-10-10T15:14:00.000Z',
        '2026-10-10T17:44:00.000Z'
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
        '2026-10-10T15:14:00.000Z',
        '2026-10-10T18:14:00.000Z',
        '2026-10-10T17:44:00.000Z',
        'submitted',
        'sess_persada_oct10',
        '2026-10-10T17:44:00.000Z',
        '2026-10-10T15:14:00.000Z',
        '2026-10-10T17:44:00.000Z'
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
        'c0000003-0000-0000-0000-000000000001',
        $code1$#include <bits/stdc++.h>
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
    cout << values.size() << '\n';
    return 0;
}$code1$,
        2,
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
        'c0000003-0000-0000-0000-000000000002',
        $code2$#include <bits/stdc++.h>
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
    cout << answer << '\n';
    return 0;
}$code2$,
        2,
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
        'c0000003-0000-0000-0000-000000000003',
        $code3$#include <bits/stdc++.h>
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
    cout << dist[target.first][target.second] << '\n';
    return 0;
}$code3$,
        5,
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
        'c0000003-0000-0000-0000-000000000004',
        $code4$#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<long long> h(n);
    for (int i = 0; i < n; ++i) cin >> h[i];
    if (n <= 1) { cout << 0 << '\n'; return 0; }
    
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
    cout << cost << '\n';
    return 0;
}$code4$,
        4,
        '2026-10-10T17:43:00.000Z',
        TRUE
    ) ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        code_content = EXCLUDED.code_content,
        version = EXCLUDED.version,
        is_final = TRUE;

    -- 6. Code Execution Runs (Simulating Tries & Retries)
    DELETE FROM public.code_executions WHERE attempt_id = v_attempt_id;
    
    -- Q1 Executions (2 tries)
    FOR i IN 1..2 LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            'c0000003-0000-0000-0000-000000000001',
            CASE WHEN i = 2 THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = 2 THEN 5 ELSE (i - 1) END,
            5,
            CASE WHEN i = 2 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"},{"id":"tc5","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '2026-10-10T15:14:00.000Z'::timestamptz + (i * INTERVAL '8 minutes')
        );
    END LOOP;

    -- Q2 Executions (2 tries)
    FOR i IN 1..2 LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            'c0000003-0000-0000-0000-000000000002',
            CASE WHEN i = 2 THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = 2 THEN 5 ELSE (i - 1) END,
            5,
            CASE WHEN i = 2 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"},{"id":"tc5","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '2026-10-10T15:50:00.000Z'::timestamptz + (i * INTERVAL '10 minutes')
        );
    END LOOP;

    -- Q3 Executions (5 tries)
    FOR i IN 1..5 LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            'c0000003-0000-0000-0000-000000000003',
            CASE WHEN i = 5 THEN 'completed' ELSE 'failed' END,
            CASE WHEN i = 5 THEN 4 ELSE (i - 1) END,
            4,
            CASE WHEN i = 5 
                THEN '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"passed"},{"id":"tc3","status":"passed"},{"id":"tc4","status":"passed"}]'::jsonb
                ELSE '[{"id":"tc1","status":"passed"},{"id":"tc2","status":"failed"}]'::jsonb
            END,
            '2026-10-10T16:45:00.000Z'::timestamptz + (i * INTERVAL '12 minutes')
        );
    END LOOP;

    -- Q4 Executions (4 tries - Failed on hidden tests)
    FOR i IN 1..4 LOOP
        INSERT INTO public.code_executions (
            attempt_id, question_id, status, passed_tests, total_tests, test_results, created_at
        ) VALUES (
            v_attempt_id,
            'c0000003-0000-0000-0000-000000000004',
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
        v_attempt_id, 'c0000003-0000-0000-0000-000000000001', 'gemini-2.5-flash', 'v1', 'completed',
        15.00, 1.00, 'Passes all 5 test cases with O(N log N) std::set distinct elements.',
        'Clean, optimal C++ implementation adhering to constraints.', TRUE, '2026-10-10T17:44:00.000Z'
    ),
    (
        v_attempt_id, 'c0000003-0000-0000-0000-000000000002', 'gemini-2.5-flash', 'v1', 'completed',
        20.00, 1.00, 'Sliding window implementation passes all 5 test cases including 10^18 budget with 64-bit types.',
        'Correct O(N) two pointers technique.', TRUE, '2026-10-10T17:44:00.000Z'
    ),
    (
        v_attempt_id, 'c0000003-0000-0000-0000-000000000003', 'gemini-2.5-flash', 'v1', 'completed',
        30.00, 1.00, 'Optimal BFS traversal with grid collision and boundary checks. Passes 4/4 test cases.',
        'Correct BFS queue logic for unweighted shortest path.', TRUE, '2026-10-10T17:44:00.000Z'
    ),
    (
        v_attempt_id, 'c0000003-0000-0000-0000-000000000004', 'gemini-2.5-flash', 'v1', 'completed',
        0.00, 0.95, 'Greedy choice fails to account for 2-step DP transitions. Failed hidden test cases.',
        'Candidate attempted greedy strategy which misses optimal jump sequences.', FALSE, '2026-10-10T17:44:00.000Z'
    )
    ON CONFLICT (attempt_id, question_id) DO UPDATE SET
        total_score = EXCLUDED.total_score,
        status = EXCLUDED.status,
        is_approved = EXCLUDED.is_approved;

    RAISE NOTICE 'Candidate Muhammad Rafli Putra Persada successfully inserted with 3/4 questions solved!';
END $$;
