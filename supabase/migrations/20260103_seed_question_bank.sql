-- ==============================================================================
-- Migration: 20260103_seed_question_bank.sql
-- Seed INC 2026 Internal Qualification Question Bank (All 3 Divisions: 12 Questions)
-- ==============================================================================

-- 1. Ensure all 3 assessments are published
UPDATE public.assessments 
SET is_published = TRUE 
WHERE division IN ('problem_analysis', 'algorithm_builder', 'programmer');

-- 2. Seed Division A: Problem Analysis Questions
INSERT INTO public.questions (id, assessment_id, division, order_index, title, statement, question_type, max_score, is_enabled, constraints, examples)
VALUES 
(
  'q-pa-1',
  'asmt-problem-analysis',
  'problem_analysis',
  1,
  'Choosing an Approach',
  'For each situation below, recommend a suitable algorithm or technique. Briefly explain why it fits the problem and give its expected time complexity. You do not need to write code.

**Situation A**
You are given an array of `N` integers. The array does not change. There are `Q` queries, and each query asks for the sum of the elements from index `L` through index `R`, inclusive. Both `N` and `Q` can be as large as `200,000`.

**Situation B**
You are given an unweighted graph with `N` vertices and `M` edges. Starting from vertex `S`, you must find the minimum number of edges needed to reach every other vertex.

**Situation C**
You are given a graph whose edges have nonnegative weights. Starting from vertex `S`, you must find the minimum total weight needed to reach vertex `T`.

**Situation D**
You need to count how many different ways there are to reach step `N` if each move advances either one step or two steps. The answer must be computed for `N` as large as `200,000`.

For each situation, provide:
1. The algorithm or technique you recommend.
2. The key reason it is suitable.
3. The expected time complexity.',
  'long_answer',
  20.00,
  TRUE,
  '1 <= N, Q <= 200,000',
  '[]'::jsonb
),
(
  'q-pa-2',
  'asmt-problem-analysis',
  'problem_analysis',
  2,
  'Improving Repeated Range Queries',
  'A program receives an array of `N` integers, followed by `Q` queries. Every query contains two indexes, `L` and `R`, and asks for the sum of all array values from `L` through `R`, inclusive. The array never changes after it is given.

The constraints are `1 ≤ N, Q ≤ 200,000`.

A teammate proposes calculating every query by looping through all elements from `L` to `R` and adding them one at a time.

Answer the following questions:
1. What is the worst-case time complexity of the teammate''s approach, and why could it be too slow for these constraints?
2. Describe a faster approach that preprocesses the array before answering queries.
3. Explain what information the preprocessing step stores and how a query can be answered from it.
4. Give the total time complexity, including preprocessing and all queries.
5. Mention one indexing or boundary case that the implementation must handle carefully.',
  'long_answer',
  20.00,
  TRUE,
  '1 <= N, Q <= 200,000',
  '[]'::jsonb
),
(
  'q-pa-3',
  'asmt-problem-analysis',
  'problem_analysis',
  3,
  'Static Queries Versus Updates',
  'Consider two systems that both maintain an array of `N` integers and answer range-sum queries.

**System A** never changes the array after initialization. It only receives queries asking for the sum of the values in a range `[L, R]`.

**System B** receives two types of operations:
- `UPDATE i x`, which assigns `x` to the value at index `i`.
- `SUM L R`, which asks for the sum of the current values from index `L` through `R`, inclusive.

Both systems may receive up to `200,000` values and `200,000` operations.

Answer the following questions:
1. Recommend a suitable approach for System A and state its preprocessing and query complexity.
2. Recommend a suitable data structure for System B and state the complexity of an update and a range-sum query.
3. Explain why a prefix-sum array works well for System A but becomes inconvenient if used alone for System B.
4. State the main trade-off between the two approaches.

You may recommend either a Fenwick Tree or a Segment Tree for System B if your explanation is correct.',
  'long_answer',
  25.00,
  TRUE,
  '1 <= N, Q <= 200,000',
  '[]'::jsonb
),
(
  'q-pa-4',
  'asmt-problem-analysis',
  'problem_analysis',
  4,
  'Longest Valid Contiguous Segment',
  'You are given an array `A` containing only positive integers and a positive integer `K`. Your task is to find the maximum length of a contiguous segment whose sum is at most `K`.

A contiguous segment consists of consecutive elements from the array. For example, in `[2, 1, 3, 4]`, the segment `[1, 3]` is contiguous, while `[2, 3]` is not.

Constraints are `1 ≤ N ≤ 200,000`, every array value is positive, and `1 ≤ K ≤ 10^18`.

You do not need to write code. Explain a complete approach by answering the following questions:
1. What straightforward approach could solve the problem, and why might it be too slow for the maximum input size?
2. What more efficient technique would you use?
3. Explain the role of the left and right pointers, including when the left pointer must move.
4. Explain why the approach does not need to move the left pointer backwards.
5. Give the time complexity and explain why each pointer only needs to move forward.
6. Identify at least two edge cases that the implementation should handle.',
  'long_answer',
  35.00,
  TRUE,
  '1 <= N <= 200,000, 1 <= K <= 10^18, A[i] > 0',
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  statement = EXCLUDED.statement,
  max_score = EXCLUDED.max_score,
  is_enabled = EXCLUDED.is_enabled;

-- 3. Seed Division B: Algorithm Builder Questions
INSERT INTO public.questions (id, assessment_id, division, order_index, title, statement, question_type, max_score, is_enabled, constraints, examples)
VALUES 
(
  'q-ab-1',
  'asmt-algorithm-builder',
  'algorithm_builder',
  1,
  'Scheduling the Maximum Number of Meetings',
  'A student club has `N` proposed meetings. Meeting `i` starts at time `S[i]` and finishes at time `E[i]`, where `S[i] < E[i]`. A student can attend at most one meeting at a time. A meeting may begin at exactly the time another meeting finishes.

Choose a set of meetings with the maximum possible number of meetings that the student can attend.

Constraints are `1 ≤ N ≤ 200,000`.

Provide the following:
1. Describe your algorithm clearly enough that another programmer could implement it.
2. Explain how the meetings should be ordered and how the next meeting is selected.
3. Give pseudocode for the main procedure.
4. Provide a correctness argument explaining why your choice at each step does not prevent an optimal final answer.
5. State the time and memory complexity.
6. Explain how your algorithm handles meetings that touch at endpoints, such as one meeting ending at time `5` and another beginning at time `5`.',
  'pseudocode',
  25.00,
  TRUE,
  '1 <= N <= 200,000',
  '[]'::jsonb
),
(
  'q-ab-2',
  'asmt-algorithm-builder',
  'algorithm_builder',
  2,
  'Cheapest Route in a Weighted Network',
  'A transport network contains `N` vertices and `M` undirected edges. Each edge connects two vertices and has a nonnegative travel cost. Given a source vertex `S` and a target vertex `T`, find the minimum possible total travel cost from `S` to `T`.

Constraints are `1 ≤ N ≤ 200,000` and `0 ≤ M ≤ 300,000`. Edge weights are nonnegative. If the target cannot be reached, the answer should indicate that no route exists.

Provide the following:
1. Choose an appropriate algorithm and explain why it fits the edge weights.
2. Describe the information stored for each vertex during the algorithm.
3. Give the main relaxation step in pseudocode or precise prose.
4. Explain why ordinary BFS is not sufficient in the general case when edge weights differ.
5. State the time complexity when an adjacency list and a binary heap priority queue are used.
6. Describe how the algorithm identifies an unreachable target.',
  'long_answer',
  25.00,
  TRUE,
  '1 <= N <= 200,000, 0 <= M <= 300,000, weights >= 0',
  '[]'::jsonb
),
(
  'q-ab-3',
  'asmt-algorithm-builder',
  'algorithm_builder',
  3,
  'Maximum Sum Without Adjacent Elements',
  'You are given an array `A` of `N` integers. Select any subset of its elements, but you are not allowed to select two elements whose original indexes are adjacent. The goal is to maximize the sum of the selected values. Selecting no elements is allowed, so the answer is at least zero.

For example, given `[4, 1, 8, 3]`, one valid choice is `4 + 8 = 12`, because the selected elements are not adjacent.

Constraints are `1 ≤ N ≤ 200,000`, and values may be negative, zero, or positive.

Provide the following:
1. Define a dynamic programming state precisely.
2. Derive a recurrence that computes the best answer using smaller states.
3. State the base cases and explain how negative values are handled.
4. Explain why the recurrence considers all necessary possibilities without missing the optimum.
5. State the time and memory complexity.
6. Explain whether the memory usage could be reduced, and how.',
  'pseudocode',
  25.00,
  TRUE,
  '1 <= N <= 200,000',
  '[]'::jsonb
),
(
  'q-ab-4',
  'asmt-algorithm-builder',
  'algorithm_builder',
  4,
  'Handling Dynamic Range-Sum Queries',
  'You receive an array of `N` integers and then `Q` operations. Each operation is one of the following:
- `1 i x`, which assigns `x` to the element at index `i`.
- `2 l r`, which asks for the sum of the current elements from index `l` through index `r`, inclusive.

Both `N` and `Q` can be as large as `200,000`. The array is indexed from `1` to `N`.

Design an approach that handles both operation types efficiently.

Provide the following:
1. Choose a suitable data structure and explain what it stores.
2. Explain how to process an assignment update. If your data structure needs a change value rather than a replacement value, explain how to calculate it.
3. Explain how to calculate a range sum.
4. State the time complexity of each operation and the total memory complexity.
5. Explain why recalculating the entire array''s prefix sums after every update is inefficient for the given constraints.

A Fenwick Tree or Segment Tree is acceptable if the approach is correct.',
  'pseudocode',
  25.00,
  TRUE,
  '1 <= N, Q <= 200,000',
  '[]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  statement = EXCLUDED.statement,
  max_score = EXCLUDED.max_score,
  is_enabled = EXCLUDED.is_enabled;

-- 4. Seed Division C: Programmer Questions
INSERT INTO public.questions (id, assessment_id, division, order_index, title, statement, question_type, max_score, is_enabled, constraints, examples)
VALUES 
(
  'q-pr-1',
  'asmt-programmer',
  'programmer',
  1,
  'Count the Distinct Values',
  'Given an array of `N` integers, determine how many distinct values appear in the array.

### Input
The first line contains an integer `N`.
The second line contains `N` integers `A[1], A[2], ..., A[N]`.

### Output
Print one integer, the number of distinct values in the array.

### Constraints
- `1 ≤ N ≤ 200,000`
- `-10^9 ≤ A[i] ≤ 10^9`

### Sample Input
```text
7
3 1 3 2 5 2 5
```

### Sample Output
```text
4
```

### Explanation
The distinct values are `1`, `2`, `3`, and `5`, so the answer is `4`.',
  'cpp_code',
  15.00,
  TRUE,
  '1 <= N <= 200,000, -10^9 <= A[i] <= 10^9',
  '[{"input": "7\n3 1 3 2 5 2 5", "output": "4", "explanation": "The distinct values are 1, 2, 3, and 5."}]'::jsonb
),
(
  'q-pr-2',
  'asmt-programmer',
  'programmer',
  2,
  'Longest Segment Under a Budget',
  'You are given `N` positive integers and a positive integer budget `K`. Find the maximum length of a contiguous segment whose sum is at most `K`.

A contiguous segment uses consecutive elements from the array. If no nonempty segment has a sum at most `K`, print `0`.

### Input
The first line contains two integers `N` and `K`.
The second line contains `N` positive integers `A[1], A[2], ..., A[N]`.

### Output
Print one integer, the maximum valid segment length.

### Constraints
- `1 ≤ N ≤ 200,000`
- `1 ≤ A[i] ≤ 10^9`
- `1 ≤ K ≤ 10^18`

### Sample Input
```text
5 11
2 1 3 4 2
```

### Sample Output
```text
4
```

### Explanation
The segment `[2, 1, 3, 4]` has sum `10` and length `4`, the segment `[1, 3, 4, 2]` also has sum `10` and length `4`, and the sum of all five elements is `12`, so a segment of length `5` is invalid.',
  'cpp_code',
  20.00,
  TRUE,
  '1 <= N <= 200,000, 1 <= A[i] <= 10^9, 1 <= K <= 10^18',
  '[{"input": "5 11\n2 1 3 4 2", "output": "4", "explanation": "The segment [2, 1, 3, 4] has sum 10 and length 4."}]'::jsonb
),
(
  'q-pr-3',
  'asmt-programmer',
  'programmer',
  3,
  'Shortest Path Through a Grid',
  'You are given a rectangular grid. Each cell is either an open cell, a wall, the starting cell `S`, or the target cell `T`.

You may move one cell at a time in one of four directions, up, down, left, or right. You cannot move outside the grid or enter a wall. Every move costs one step. Find the minimum number of steps required to get from `S` to `T`. If the target cannot be reached, print `-1`.

### Input
The first line contains two integers `N` and `M`, the number of rows and columns.
The next `N` lines each contain a string of length `M` consisting of the characters `.`, `#`, `S`, and `T`.
There is exactly one `S` and exactly one `T` in the grid.

### Output
Print one integer, the minimum number of steps from `S` to `T`, or `-1` if no route exists.

### Constraints
- `1 ≤ N, M ≤ 1,000`
- `N × M ≤ 1,000,000`

### Sample Input
```text
4 5
S....
.#...
.#.#.
...T.
```

### Sample Output
```text
6
```

### Explanation
One shortest route moves down along the first column to the bottom row, then moves right to the target, for a total of six steps.',
  'cpp_code',
  30.00,
  TRUE,
  '1 <= N, M <= 1,000, N * M <= 1,000,000',
  '[{"input": "4 5\nS....\n.#...\n.#.#.\n...T.", "output": "6", "explanation": "One shortest route moves down along the first column to the bottom row, then moves right to the target."}]'::jsonb
),
(
  'q-pr-4',
  'asmt-programmer',
  'programmer',
  4,
  'Minimum Cost Frog Jump',
  'A frog starts on stone `1` and wants to reach stone `N`. Each stone `i` has a height `H[i]`. From stone `i`, the frog may jump to stone `i + 1` or stone `i + 2`, provided that the destination stone exists.

A jump from stone `i` to stone `j` costs `abs(H[i] - H[j])`. Find the minimum total cost needed to reach stone `N`.

If `N = 1`, the frog is already at its destination, so the answer is `0`.

### Input
The first line contains one integer `N`.
The second line contains `N` integers, the heights `H[1], H[2], ..., H[N]`.

### Output
Print one integer, the minimum possible total jumping cost.

### Constraints
- `1 ≤ N ≤ 200,000`
- `0 ≤ H[i] ≤ 10^9`

### Sample Input
```text
4
10 30 40 20
```

### Sample Output
```text
30
```

### Explanation
One optimal route jumps from stone `1` to stone `2`, costing `20`, then from stone `2` to stone `4`, costing `10`, for a total cost of `30`.',
  'cpp_code',
  35.00,
  TRUE,
  '1 <= N <= 200,000, 0 <= H[i] <= 10^9',
  '[{"input": "4\n10 30 40 20", "output": "30", "explanation": "Jump 1->2 (cost 20), jump 2->4 (cost 10), total cost 30."}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  statement = EXCLUDED.statement,
  max_score = EXCLUDED.max_score,
  is_enabled = EXCLUDED.is_enabled;

-- 5. Seed Private Configurations (Keys, Rubrics, Hidden Tests)
INSERT INTO public.private_question_configs (id, question_id, reference_answer, grading_rubric, test_cases)
VALUES
(
  'cfg-pa-1',
  'q-pa-1',
  'Situation A: Prefix sums. Preprocessing O(N), query O(1), total O(N + Q), space O(N).
Situation B: BFS from S. Unweighted graph, explores in nondecreasing edges. Time O(N + M), space O(N + M).
Situation C: Dijkstra. Nonnegative edge weights. Time O((N + M) log N), space O(N + M).
Situation D: Dynamic programming. ways[i] = ways[i - 1] + ways[i - 2], ways[0]=1, ways[1]=1. Time O(N), space O(N) or O(1).',
  '[
    {"id": "pa1-situation-a", "criterion": "Situation A: Algorithm, Complexity & Reason", "max_score": 5, "description": "3 pts for prefix sums, 1 pt for O(N+Q)/O(1) complexity, 1 pt for static array reasoning."},
    {"id": "pa1-situation-b", "criterion": "Situation B: Algorithm, Complexity & Reason", "max_score": 5, "description": "3 pts for BFS from S, 1 pt for O(N+M) complexity, 1 pt for unweighted graph property."},
    {"id": "pa1-situation-c", "criterion": "Situation C: Algorithm, Complexity & Reason", "max_score": 5, "description": "3 pts for Dijkstra, 1 pt for O((N+M) log N) complexity, 1 pt for nonnegative edge weights property."},
    {"id": "pa1-situation-d", "criterion": "Situation D: Algorithm, Complexity & Reason", "max_score": 5, "description": "3 pts for dynamic programming/recurrence, 1 pt for O(N) complexity, 1 pt for subproblems/state reasoning."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-pa-2',
  'q-pa-2',
  '1. Worst-case is O(NQ) taking ~4 x 10^10 operations, causing TLE.
2. Build prefix sums.
3. prefix[i] stores cumulative sum up to i. Query [L, R] = prefix[R] - prefix[L - 1].
4. Total time: Preprocessing O(N), queries O(Q), total O(N + Q) with O(N) space.
5. Boundary cases: L = 1 (requiring prefix[0] = 0 or 1-based indexing), 64-bit integer overflow.',
  '[
    {"id": "pa2-worst-case", "criterion": "Brute force complexity analysis", "max_score": 4, "description": "Identifies O(NQ) and explains repeated additions exceeding standard operation limits (~4 x 10^10 ops)."},
    {"id": "pa2-proposed-solution", "criterion": "Faster preprocessing approach", "max_score": 5, "description": "Proposes prefix sums (or an equally efficient valid data structure)."},
    {"id": "pa2-prefix-formula", "criterion": "Stored information & query formula", "max_score": 5, "description": "Explains cumulative sums prefix[i] and range formula prefix[R] - prefix[L-1]."},
    {"id": "pa2-total-complexity", "criterion": "Total time complexity", "max_score": 4, "description": "States O(N + Q) total time complexity correctly."},
    {"id": "pa2-edge-cases", "criterion": "Boundary and indexing considerations", "max_score": 2, "description": "Identifies genuine indexing (L=1, prefix[0]=0) or 64-bit integer type requirement."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-pa-3',
  'q-pa-3',
  '1. System A: Prefix sums, O(N) preprocessing and O(1) query time.
2. System B: Fenwick Tree or Segment Tree, O(log N) update and query time.
3. Updates invalidate ordinary prefix sums, requiring O(N) recomputation per update.
4. Trade-off: Prefix sums are simpler and faster for static data, while trees handle dynamic updates with O(log N) overhead.',
  '[
    {"id": "pa3-system-a", "criterion": "System A Recommendation & Complexity", "max_score": 6, "description": "Recommends prefix sums for System A with O(N) build and O(1) query time."},
    {"id": "pa3-system-b", "criterion": "System B Recommendation & Complexity", "max_score": 7, "description": "Recommends Fenwick Tree or Segment Tree with O(log N) update and query time."},
    {"id": "pa3-invalidation-reason", "criterion": "Prefix sums staleness on updates", "max_score": 7, "description": "Explains why point updates invalidate prefix sums and require O(N) recomputation."},
    {"id": "pa3-tradeoff", "criterion": "Comparative Trade-off", "max_score": 5, "description": "Meaningful comparison of static O(1) simplicity vs dynamic logarithmic flexibility."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-pa-4',
  'q-pa-4',
  '1. Brute force tests all O(N^2) segments and takes O(N^2) or O(N^3) time.
2. Sliding window / two pointers.
3. Right pointer expands window, left pointer contracts when sum > K.
4. Monotonicity: Since all values are positive, extending window never decreases sum. Left pointer never needs to move backwards.
5. Time O(N) amortized (each pointer advances at most N times), extra space O(1).
6. Edge cases: Every element > K (0), all elements fit (N), N=1, sum exceeds 32-bit int.',
  '[
    {"id": "pa4-brute-force", "criterion": "Brute force baseline & limitations", "max_score": 5, "description": "Recognizes O(N^2) brute force baseline and why it causes TLE."},
    {"id": "pa4-technique", "criterion": "Efficient technique identification", "max_score": 7, "description": "Identifies sliding window or two pointers."},
    {"id": "pa4-pointer-mechanics", "criterion": "Pointer role and maintenance", "max_score": 9, "description": "Explains right pointer expansion, running sum, and left pointer advancement when sum > K."},
    {"id": "pa4-monotonicity", "criterion": "Monotonicity & forward-only movement", "max_score": 6, "description": "Explains that positivity ensures monotonic sums, eliminating the need to move left pointer backward."},
    {"id": "pa4-complexity", "criterion": "Time & memory complexity", "max_score": 4, "description": "States O(N) time and O(1) space with amortized pointer analysis."},
    {"id": "pa4-edge-cases", "criterion": "Edge case identification", "max_score": 4, "description": "Identifies at least two edge cases (all > K, 64-bit overflow, N=1, entire array fits)."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-ab-1',
  'q-ab-1',
  '1. Earliest finish time greedy algorithm.
2. Sort meetings by ascending finish time E[i]. Select if S[i] >= lastFinish.
3. Pseudocode:
sort meetings by finish time
lastFinish = -infinity
count = 0
for each meeting (start, finish):
    if start >= lastFinish:
        select meeting
        count = count + 1
        lastFinish = finish
return count
4. Correctness: Greedy exchange argument shows earliest finish preserves maximum remaining time for subsequent meetings.
5. Time O(N log N), memory O(N) or O(log N).
6. S[i] >= lastFinish handles meetings touching at endpoints.',
  '[
    {"id": "ab1-algorithm-choice", "criterion": "Greedy algorithm strategy", "max_score": 6, "description": "Correct earliest-finish-time greedy strategy."},
    {"id": "ab1-pseudocode", "criterion": "Pseudocode & procedure", "max_score": 4, "description": "Clear pseudocode with sorting and greedy selection."},
    {"id": "ab1-correctness-argument", "criterion": "Exchange / optimality proof", "max_score": 7, "description": "Valid greedy-exchange argument explaining why earliest finish leaves maximum remaining time."},
    {"id": "ab1-complexity", "criterion": "Time & memory complexity", "max_score": 4, "description": "States O(N log N) time and O(N) or O(log N) space."},
    {"id": "ab1-endpoint-handling", "criterion": "Endpoint touching condition", "max_score": 4, "description": "Explains that start >= lastFinish allows meetings that touch at endpoints."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-ab-2',
  'q-ab-2',
  '1. Dijkstra algorithm with min-priority queue, applicable for nonnegative edge weights.
2. Maintain dist[] initialized to infinity (dist[S]=0) and min-priority queue.
3. Relaxation: if dist[u] + w < dist[v], dist[v] = dist[u] + w, push (dist[v], v).
4. BFS minimizes edge count, not total cost.
5. Time O((N + M) log N), space O(N + M).
6. Unreachable target retains infinity distance.',
  '[
    {"id": "ab2-algorithm-choice", "criterion": "Algorithm selection & nonnegative weights", "max_score": 5, "description": "Selects Dijkstra and notes requirement for nonnegative edge weights."},
    {"id": "ab2-data-stored", "criterion": "Vertex state & distance tracking", "max_score": 5, "description": "Explains dist[] array initialized to infinity and min-heap tracking."},
    {"id": "ab2-relaxation-step", "criterion": "Edge relaxation step", "max_score": 5, "description": "Correct edge relaxation logic (dist[u] + w < dist[v])."},
    {"id": "ab2-bfs-insufficiency", "criterion": "BFS insufficiency reasoning", "max_score": 4, "description": "Explains that BFS minimizes edge count, not total weight."},
    {"id": "ab2-complexity", "criterion": "Time & memory complexity", "max_score": 4, "description": "States O((N + M) log N) time and O(N + M) memory."},
    {"id": "ab2-unreachable-target", "criterion": "Unreachable target detection", "max_score": 2, "description": "Explains that unreachable target retains infinity distance."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-ab-3',
  'q-ab-3',
  '1. State: dp[i] = maximum sum from first i elements without selecting adjacent elements.
2. Recurrence: dp[i] = max(dp[i - 1], dp[i - 2] + A[i]).
3. Base cases: dp[0] = 0, dp[1] = max(0, A[1]).
4. Excludes element i (dp[i-1]) or includes element i (dp[i-2] + A[i]).
5. Time O(N), Space O(N) or O(1) keeping 2 variables.',
  '[
    {"id": "ab3-dp-state", "criterion": "State definition", "max_score": 6, "description": "Precise dynamic programming state definition."},
    {"id": "ab3-recurrence-base", "criterion": "Recurrence and base cases", "max_score": 7, "description": "Correct recurrence dp[i] = max(dp[i-1], dp[i-2] + A[i]) and base cases."},
    {"id": "ab3-correctness-reasoning", "criterion": "Correctness reasoning", "max_score": 5, "description": "Explains mutually exclusive and exhaustive skip vs select choices."},
    {"id": "ab3-complexity", "criterion": "Time & memory complexity", "max_score": 4, "description": "States O(N) time and O(N) memory."},
    {"id": "ab3-negative-and-space-opt", "criterion": "Negative values & space optimization", "max_score": 3, "description": "Handles negative values (bounded by 0) and explains O(1) space optimization."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-ab-4',
  'q-ab-4',
  '1. Fenwick Tree or Segment Tree storing partial sums.
2. Assignment update: delta = x - A[i], update tree in O(log N).
3. Range sum: query(r) - query(l - 1) in O(log N).
4. Update O(log N), Query O(log N), Memory O(N).
5. Rebuilding prefix sums takes O(N) per update, causing O(NQ) TLE.',
  '[
    {"id": "ab4-data-structure", "criterion": "Data structure selection & storage", "max_score": 6, "description": "Selects Fenwick Tree or Segment Tree and explains what is stored."},
    {"id": "ab4-update-process", "criterion": "Update handling & delta calculation", "max_score": 5, "description": "Explains assignment update, including delta calculation for Fenwick tree."},
    {"id": "ab4-query-process", "criterion": "Range-sum calculation", "max_score": 5, "description": "Explains range sum via prefix difference or interval aggregation."},
    {"id": "ab4-complexity", "criterion": "Operation & memory complexity", "max_score": 5, "description": "States O(log N) per update and query, with O(N) memory."},
    {"id": "ab4-rebuild-inefficiency", "criterion": "Prefix sum rebuild inefficiency", "max_score": 4, "description": "Explains why rebuilding prefix sums is O(N) per update and O(NQ) overall."}
  ]'::jsonb,
  '[]'::jsonb
),
(
  'cfg-pr-1',
  'q-pr-1',
  '#include <bits/stdc++.h>
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
    cout << values.size() << ''\n'';
    return 0;
}',
  '[
    {"id": "pr1-io", "criterion": "I/O Format", "max_score": 4, "description": "Reads input and prints output integer."},
    {"id": "pr1-logic", "criterion": "Distinct Counting", "max_score": 7, "description": "Correctly counts distinct values."},
    {"id": "pr1-negatives", "criterion": "Edge Values & Negatives", "max_score": 2, "description": "Handles negative and large numbers."},
    {"id": "pr1-complexity", "criterion": "Complexity", "max_score": 2, "description": "O(N log N) time complexity."}
  ]'::jsonb,
  '[
    {"id": "tc-pr1-1", "input": "7\n3 1 3 2 5 2 5", "expected_output": "4", "is_hidden": false},
    {"id": "tc-pr1-2", "input": "5\n10 10 10 10 10", "expected_output": "1", "is_hidden": true},
    {"id": "tc-pr1-3", "input": "1\n42", "expected_output": "1", "is_hidden": true},
    {"id": "tc-pr1-4", "input": "6\n-5 0 5 -5 0 10", "expected_output": "4", "is_hidden": true},
    {"id": "tc-pr1-5", "input": "4\n1000000000 -1000000000 1000000000 0", "expected_output": "3", "is_hidden": true}
  ]'::jsonb
),
(
  'cfg-pr-2',
  'q-pr-2',
  '#include <bits/stdc++.h>
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
    cout << answer << ''\n'';
    return 0;
}',
  '[
    {"id": "pr2-io", "criterion": "I/O Parsing", "max_score": 4, "description": "Reads N, K and array values."},
    {"id": "pr2-sliding-window", "criterion": "Sliding Window Logic", "max_score": 8, "description": "Correct sliding window implementation."},
    {"id": "pr2-shrinking-zero", "criterion": "Zero & Bounds", "max_score": 4, "description": "Handles window shrinking and 0 result when all exceed K."},
    {"id": "pr2-types-complexity", "criterion": "64-bit Types & Complexity", "max_score": 4, "description": "Uses long long for 10^18 budget in O(N) time."}
  ]'::jsonb,
  '[
    {"id": "tc-pr2-1", "input": "5 11\n2 1 3 4 2", "expected_output": "4", "is_hidden": false},
    {"id": "tc-pr2-2", "input": "3 100\n10 20 30", "expected_output": "3", "is_hidden": true},
    {"id": "tc-pr2-3", "input": "3 5\n10 20 30", "expected_output": "0", "is_hidden": true},
    {"id": "tc-pr2-4", "input": "4 10\n15 8 12 20", "expected_output": "1", "is_hidden": true},
    {"id": "tc-pr2-5", "input": "3 20000000000\n10000000000 5000000000 6000000000", "expected_output": "2", "is_hidden": true}
  ]'::jsonb
),
(
  'cfg-pr-3',
  'q-pr-3',
  '#include <bits/stdc++.h>
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
            if (grid[r][c] == ''S'') start = {r, c};
            if (grid[r][c] == ''T'') target = {r, c};
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
            if (grid[nr][nc] == ''#'') continue;
            if (dist[nr][nc] != -1) continue;
            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }
    cout << dist[target.first][target.second] << ''\n'';
    return 0;
}',
  '[
    {"id": "pr3-parsing", "criterion": "Grid Parsing", "max_score": 5, "description": "Parses grid, identifies S and T."},
    {"id": "pr3-bfs-traversal", "criterion": "BFS Traversal", "max_score": 10, "description": "Correct BFS queue traversal and distance maintenance."},
    {"id": "pr3-walls-bounds", "criterion": "Wall and Boundary Checks", "max_score": 5, "description": "Correct collision and grid bounds checking."},
    {"id": "pr3-unreachable", "criterion": "Unreachable Target", "max_score": 5, "description": "Correctly outputs -1 if unreachable."},
    {"id": "pr3-complexity", "criterion": "Complexity", "max_score": 5, "description": "O(NM) time and memory efficiency."}
  ]'::jsonb,
  '[
    {"id": "tc-pr3-1", "input": "4 5\nS....\n.#...\n.#.#.\n...T.", "expected_output": "6", "is_hidden": false},
    {"id": "tc-pr3-2", "input": "3 3\nS#.\n.##\n..T", "expected_output": "-1", "is_hidden": true},
    {"id": "tc-pr3-3", "input": "1 2\nST", "expected_output": "1", "is_hidden": true},
    {"id": "tc-pr3-4", "input": "3 3\nS.#\n#.#\n#.T", "expected_output": "4", "is_hidden": true}
  ]'::jsonb
),
(
  'cfg-pr-4',
  'q-pr-4',
  '#include <bits/stdc++.h>
using namespace std;
using ll = long long;
int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);
    int n;
    if (!(cin >> n)) return 0;
    vector<ll> h(n);
    for (int i = 0; i < n; ++i) cin >> h[i];
    if (n == 1) { cout << 0 << ''\n''; return 0; }
    vector<ll> dp(n, 0);
    dp[1] = llabs(h[1] - h[0]);
    for (int i = 2; i < n; ++i) {
        ll fromPrevious = dp[i - 1] + llabs(h[i] - h[i - 1]);
        ll fromTwoBack = dp[i - 2] + llabs(h[i] - h[i - 2]);
        dp[i] = min(fromPrevious, fromTwoBack);
    }
    cout << dp[n - 1] << ''\n'';
    return 0;
}',
  '[
    {"id": "pr4-parsing-base", "criterion": "Input & N=1 Base Case", "max_score": 5, "description": "Parses input and handles N = 1 base case."},
    {"id": "pr4-dp-state", "criterion": "DP Base Cases", "max_score": 8, "description": "Correct DP state and dp[1] initialization."},
    {"id": "pr4-transitions", "criterion": "Minimum Transitions", "max_score": 10, "description": "Correct transitions from i-1 and i-2."},
    {"id": "pr4-integer-types", "criterion": "64-bit Integer Types", "max_score": 5, "description": "Uses 64-bit integers for cumulative costs."},
    {"id": "pr4-complexity", "criterion": "O(N) Complexity", "max_score": 7, "description": "Passes full constraints in O(N) time."}
  ]'::jsonb,
  '[
    {"id": "tc-pr4-1", "input": "4\n10 30 40 20", "expected_output": "30", "is_hidden": false},
    {"id": "tc-pr4-2", "input": "1\n50", "expected_output": "0", "is_hidden": true},
    {"id": "tc-pr4-3", "input": "2\n10 50", "expected_output": "40", "is_hidden": true},
    {"id": "tc-pr4-4", "input": "4\n10 10 10 10", "expected_output": "0", "is_hidden": true},
    {"id": "tc-pr4-5", "input": "6\n30 10 60 10 60 50", "expected_output": "40", "is_hidden": true}
  ]'::jsonb
)
ON CONFLICT (question_id) DO UPDATE SET
  reference_answer = EXCLUDED.reference_answer,
  grading_rubric = EXCLUDED.grading_rubric,
  test_cases = EXCLUDED.test_cases;
