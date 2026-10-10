import type { Question, PrivateQuestionConfig, Assessment } from '@/types/database';

export const defaultAssessments: Assessment[] = [
  {
    id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    title: 'ICPC INC 2026 - Problem Analysis Assessment',
    duration_minutes: 180,
    is_published: true,
    min_questions: 3,
    max_questions: 5,
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    title: 'ICPC INC 2026 - Algorithm Builder Assessment',
    duration_minutes: 180,
    is_published: true,
    min_questions: 3,
    max_questions: 5,
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'asmt-programmer',
    division: 'programmer',
    title: 'ICPC INC 2026 - Programmer Assessment',
    duration_minutes: 180,
    is_published: true,
    min_questions: 3,
    max_questions: 5,
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
];

export const seedQuestions: Question[] = [
  // ==========================================
  // DIVISION A: PROBLEM ANALYSIS
  // ==========================================
  {
    id: 'q-pa-1',
    assessment_id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    order_index: 1,
    title: 'Choosing an Approach',
    statement: `For each situation below, recommend a suitable algorithm or technique. Briefly explain why it fits the problem and give its expected time complexity. You do not need to write code.

**Situation A**
You are given an array of \`N\` integers. The array does not change. There are \`Q\` queries, and each query asks for the sum of the elements from index \`L\` through index \`R\`, inclusive. Both \`N\` and \`Q\` can be as large as \`200,000\`.

**Situation B**
You are given an unweighted graph with \`N\` vertices and \`M\` edges. Starting from vertex \`S\`, you must find the minimum number of edges needed to reach every other vertex.

**Situation C**
You are given a graph whose edges have nonnegative weights. Starting from vertex \`S\`, you must find the minimum total weight needed to reach vertex \`T\`.

**Situation D**
You need to count how many different ways there are to reach step \`N\` if each move advances either one step or two steps. The answer must be computed for \`N\` as large as \`200,000\`.

For each situation, provide:
1. The algorithm or technique you recommend.
2. The key reason it is suitable.
3. The expected time complexity.`,
    question_type: 'long_answer',
    max_score: 20,
    is_enabled: true,
    constraints: '1 <= N, Q <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pa-2',
    assessment_id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    order_index: 2,
    title: 'Improving Repeated Range Queries',
    statement: `A program receives an array of \`N\` integers, followed by \`Q\` queries. Every query contains two indexes, \`L\` and \`R\`, and asks for the sum of all array values from \`L\` through \`R\`, inclusive. The array never changes after it is given.

The constraints are \`1 ≤ N, Q ≤ 200,000\`.

A teammate proposes calculating every query by looping through all elements from \`L\` to \`R\` and adding them one at a time.

Answer the following questions:
1. What is the worst-case time complexity of the teammate's approach, and why could it be too slow for these constraints?
2. Describe a faster approach that preprocesses the array before answering queries.
3. Explain what information the preprocessing step stores and how a query can be answered from it.
4. Give the total time complexity, including preprocessing and all queries.
5. Mention one indexing or boundary case that the implementation must handle carefully.`,
    question_type: 'long_answer',
    max_score: 20,
    is_enabled: true,
    constraints: '1 <= N, Q <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pa-3',
    assessment_id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    order_index: 3,
    title: 'Static Queries Versus Updates',
    statement: `Consider two systems that both maintain an array of \`N\` integers and answer range-sum queries.

**System A** never changes the array after initialization. It only receives queries asking for the sum of the values in a range \`[L, R]\`.

**System B** receives two types of operations:
- \`UPDATE i x\`, which assigns \`x\` to the value at index \`i\`.
- \`SUM L R\`, which asks for the sum of the current values from index \`L\` through \`R\`, inclusive.

Both systems may receive up to \`200,000\` values and \`200,000\` operations.

Answer the following questions:
1. Recommend a suitable approach for System A and state its preprocessing and query complexity.
2. Recommend a suitable data structure for System B and state the complexity of an update and a range-sum query.
3. Explain why a prefix-sum array works well for System A but becomes inconvenient if used alone for System B.
4. State the main trade-off between the two approaches.

You may recommend either a Fenwick Tree or a Segment Tree for System B if your explanation is correct.`,
    question_type: 'long_answer',
    max_score: 25,
    is_enabled: true,
    constraints: '1 <= N, Q <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pa-4',
    assessment_id: 'asmt-problem-analysis',
    division: 'problem_analysis',
    order_index: 4,
    title: 'Longest Valid Contiguous Segment',
    statement: `You are given an array \`A\` containing only positive integers and a positive integer \`K\`. Your task is to find the maximum length of a contiguous segment whose sum is at most \`K\`.

A contiguous segment consists of consecutive elements from the array. For example, in \`[2, 1, 3, 4]\`, the segment \`[1, 3]\` is contiguous, while \`[2, 3]\` is not.

Constraints are \`1 ≤ N ≤ 200,000\`, every array value is positive, and \`1 ≤ K ≤ 10^18\`.

You do not need to write code. Explain a complete approach by answering the following questions:
1. What straightforward approach could solve the problem, and why might it be too slow for the maximum input size?
2. What more efficient technique would you use?
3. Explain the role of the left and right pointers, including when the left pointer must move.
4. Explain why the approach does not need to move the left pointer backwards.
5. Give the time complexity and explain why each pointer only needs to move forward.
6. Identify at least two edge cases that the implementation should handle.`,
    question_type: 'long_answer',
    max_score: 35,
    is_enabled: true,
    constraints: '1 <= N <= 200,000, 1 <= K <= 10^18, A[i] > 0',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },

  // ==========================================
  // DIVISION B: ALGORITHM BUILDER
  // ==========================================
  {
    id: 'q-ab-1',
    assessment_id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    order_index: 1,
    title: 'Scheduling the Maximum Number of Meetings',
    statement: `A student club has \`N\` proposed meetings. Meeting \`i\` starts at time \`S[i]\` and finishes at time \`E[i]\`, where \`S[i] < E[i]\`. A student can attend at most one meeting at a time. A meeting may begin at exactly the time another meeting finishes.

Choose a set of meetings with the maximum possible number of meetings that the student can attend.

Constraints are \`1 ≤ N ≤ 200,000\`.

Provide the following:
1. Describe your algorithm clearly enough that another programmer could implement it.
2. Explain how the meetings should be ordered and how the next meeting is selected.
3. Give pseudocode for the main procedure.
4. Provide a correctness argument explaining why your choice at each step does not prevent an optimal final answer.
5. State the time and memory complexity.
6. Explain how your algorithm handles meetings that touch at endpoints, such as one meeting ending at time \`5\` and another beginning at time \`5\`.`,
    question_type: 'pseudocode',
    max_score: 25,
    is_enabled: true,
    constraints: '1 <= N <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-ab-2',
    assessment_id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    order_index: 2,
    title: 'Cheapest Route in a Weighted Network',
    statement: `A transport network contains \`N\` vertices and \`M\` undirected edges. Each edge connects two vertices and has a nonnegative travel cost. Given a source vertex \`S\` and a target vertex \`T\`, find the minimum possible total travel cost from \`S\` to \`T\`.

Constraints are \`1 ≤ N ≤ 200,000\` and \`0 ≤ M ≤ 300,000\`. Edge weights are nonnegative. If the target cannot be reached, the answer should indicate that no route exists.

Provide the following:
1. Choose an appropriate algorithm and explain why it fits the edge weights.
2. Describe the information stored for each vertex during the algorithm.
3. Give the main relaxation step in pseudocode or precise prose.
4. Explain why ordinary BFS is not sufficient in the general case when edge weights differ.
5. State the time complexity when an adjacency list and a binary heap priority queue are used.
6. Describe how the algorithm identifies an unreachable target.`,
    question_type: 'long_answer',
    max_score: 25,
    is_enabled: true,
    constraints: '1 <= N <= 200,000, 0 <= M <= 300,000, weights >= 0',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-ab-3',
    assessment_id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    order_index: 3,
    title: 'Maximum Sum Without Adjacent Elements',
    statement: `You are given an array \`A\` of \`N\` integers. Select any subset of its elements, but you are not allowed to select two elements whose original indexes are adjacent. The goal is to maximize the sum of the selected values. Selecting no elements is allowed, so the answer is at least zero.

For example, given \`[4, 1, 8, 3]\`, one valid choice is \`4 + 8 = 12\`, because the selected elements are not adjacent.

Constraints are \`1 ≤ N ≤ 200,000\`, and values may be negative, zero, or positive.

Provide the following:
1. Define a dynamic programming state precisely.
2. Derive a recurrence that computes the best answer using smaller states.
3. State the base cases and explain how negative values are handled.
4. Explain why the recurrence considers all necessary possibilities without missing the optimum.
5. State the time and memory complexity.
6. Explain whether the memory usage could be reduced, and how.`,
    question_type: 'pseudocode',
    max_score: 25,
    is_enabled: true,
    constraints: '1 <= N <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-ab-4',
    assessment_id: 'asmt-algorithm-builder',
    division: 'algorithm_builder',
    order_index: 4,
    title: 'Handling Dynamic Range-Sum Queries',
    statement: `You receive an array of \`N\` integers and then \`Q\` operations. Each operation is one of the following:
- \`1 i x\`, which assigns \`x\` to the element at index \`i\`.
- \`2 l r\`, which asks for the sum of the current elements from index \`l\` through index \`r\`, inclusive.

Both \`N\` and \`Q\` can be as large as \`200,000\`. The array is indexed from \`1\` to \`N\`.

Design an approach that handles both operation types efficiently.

Provide the following:
1. Choose a suitable data structure and explain what it stores.
2. Explain how to process an assignment update. If your data structure needs a change value rather than a replacement value, explain how to calculate it.
3. Explain how to calculate a range sum.
4. State the time complexity of each operation and the total memory complexity.
5. Explain why recalculating the entire array's prefix sums after every update is inefficient for the given constraints.

A Fenwick Tree or Segment Tree is acceptable if the approach is correct.`,
    question_type: 'pseudocode',
    max_score: 25,
    is_enabled: true,
    constraints: '1 <= N, Q <= 200,000',
    examples: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },

  // ==========================================
  // DIVISION C: PROGRAMMER
  // ==========================================
  {
    id: 'q-pr-1',
    assessment_id: 'asmt-programmer',
    division: 'programmer',
    order_index: 1,
    title: 'Count the Distinct Values',
    statement: `Given an array of \`N\` integers, determine how many distinct values appear in the array.

### Input
The first line contains an integer \`N\`.
The second line contains \`N\` integers \`A[1], A[2], ..., A[N]\`.

### Output
Print one integer, the number of distinct values in the array.

### Constraints
- \`1 ≤ N ≤ 200,000\`
- \`-10^9 ≤ A[i] ≤ 10^9\`

### Sample Input
\`\`\`text
7
3 1 3 2 5 2 5
\`\`\`

### Sample Output
\`\`\`text
4
\`\`\`

### Explanation
The distinct values are \`1\`, \`2\`, \`3\`, and \`5\`, so the answer is \`4\`.`,
    question_type: 'cpp_code',
    max_score: 15,
    is_enabled: true,
    constraints: '1 <= N <= 200,000, -10^9 <= A[i] <= 10^9',
    examples: [
      {
        input: '7\n3 1 3 2 5 2 5',
        output: '4',
        explanation: 'The distinct values are 1, 2, 3, and 5.',
      },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pr-2',
    assessment_id: 'asmt-programmer',
    division: 'programmer',
    order_index: 2,
    title: 'Longest Segment Under a Budget',
    statement: `You are given \`N\` positive integers and a positive integer budget \`K\`. Find the maximum length of a contiguous segment whose sum is at most \`K\`.

A contiguous segment uses consecutive elements from the array. If no nonempty segment has a sum at most \`K\`, print \`0\`.

### Input
The first line contains two integers \`N\` and \`K\`.
The second line contains \`N\` positive integers \`A[1], A[2], ..., A[N]\`.

### Output
Print one integer, the maximum valid segment length.

### Constraints
- \`1 ≤ N ≤ 200,000\`
- \`1 ≤ A[i] ≤ 10^9\`
- \`1 ≤ K ≤ 10^18\`

### Sample Input
\`\`\`text
5 11
2 1 3 4 2
\`\`\`

### Sample Output
\`\`\`text
4
\`\`\`

### Explanation
The segment \`[2, 1, 3, 4]\` has sum \`10\` and length \`4\`, the segment \`[1, 3, 4, 2]\` also has sum \`10\` and length \`4\`, and the sum of all five elements is \`12\`, so a segment of length \`5\` is invalid.`,
    question_type: 'cpp_code',
    max_score: 20,
    is_enabled: true,
    constraints: '1 <= N <= 200,000, 1 <= A[i] <= 10^9, 1 <= K <= 10^18',
    examples: [
      {
        input: '5 11\n2 1 3 4 2',
        output: '4',
        explanation: 'The segment [2, 1, 3, 4] has sum 10 and length 4.',
      },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pr-3',
    assessment_id: 'asmt-programmer',
    division: 'programmer',
    order_index: 3,
    title: 'Shortest Path Through a Grid',
    statement: `You are given a rectangular grid. Each cell is either an open cell, a wall, the starting cell \`S\`, or the target cell \`T\`.

You may move one cell at a time in one of four directions, up, down, left, or right. You cannot move outside the grid or enter a wall. Every move costs one step. Find the minimum number of steps required to get from \`S\` to \`T\`. If the target cannot be reached, print \`-1\`.

### Input
The first line contains two integers \`N\` and \`M\`, the number of rows and columns.
The next \`N\` lines each contain a string of length \`M\` consisting of the characters \`.\`, \`#\`, \`S\`, and \`T\`.
There is exactly one \`S\` and exactly one \`T\` in the grid.

### Output
Print one integer, the minimum number of steps from \`S\` to \`T\`, or \`-1\` if no route exists.

### Constraints
- \`1 ≤ N, M ≤ 1,000\`
- \`N × M ≤ 1,000,000\`

### Sample Input
\`\`\`text
4 5
S....
.#...
.#.#.
...T.
\`\`\`

### Sample Output
\`\`\`text
6
\`\`\`

### Explanation
One shortest route moves down along the first column to the bottom row, then moves right to the target, for a total of six steps.`,
    question_type: 'cpp_code',
    max_score: 30,
    is_enabled: true,
    constraints: '1 <= N, M <= 1,000, N * M <= 1,000,000',
    examples: [
      {
        input: '4 5\nS....\n.#...\n.#.#.\n...T.',
        output: '6',
        explanation: 'One shortest route moves down along the first column to the bottom row, then moves right to the target.',
      },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'q-pr-4',
    assessment_id: 'asmt-programmer',
    division: 'programmer',
    order_index: 4,
    title: 'Minimum Cost Frog Jump',
    statement: `A frog starts on stone \`1\` and wants to reach stone \`N\`. Each stone \`i\` has a height \`H[i]\`. From stone \`i\`, the frog may jump to stone \`i + 1\` or stone \`i + 2\`, provided that the destination stone exists.

A jump from stone \`i\` to stone \`j\` costs \`abs(H[i] - H[j])\`. Find the minimum total cost needed to reach stone \`N\`.

If \`N = 1\`, the frog is already at its destination, so the answer is \`0\`.

### Input
The first line contains one integer \`N\`.
The second line contains \`N\` integers, the heights \`H[1], H[2], ..., H[N]\`.

### Output
Print one integer, the minimum possible total jumping cost.

### Constraints
- \`1 ≤ N ≤ 200,000\`
- \`0 ≤ H[i] ≤ 10^9\`

### Sample Input
\`\`\`text
4
10 30 40 20
\`\`\`

### Sample Output
\`\`\`text
30
\`\`\`

### Explanation
One optimal route jumps from stone \`1\` to stone \`2\`, costing \`20\`, then from stone \`2\` to stone \`4\`, costing \`10\`, for a total cost of \`30\`.`,
    question_type: 'cpp_code',
    max_score: 35,
    is_enabled: true,
    constraints: '1 <= N <= 200,000, 0 <= H[i] <= 10^9',
    examples: [
      {
        input: '4\n10 30 40 20',
        output: '30',
        explanation: 'Jump 1->2 (cost 20), jump 2->4 (cost 10), total cost 30.',
      },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
];

export const seedPrivateConfigs: PrivateQuestionConfig[] = [
  // ==========================================
  // DIVISION A PRIVATE CONFIGS
  // ==========================================
  {
    id: 'cfg-pa-1',
    question_id: 'q-pa-1',
    reference_answer: `Situation A: Prefix sums. Let prefix[i] be the sum of the first i elements. Query [L, R] = prefix[R] - prefix[L - 1]. Preprocessing O(N), query O(1), total O(N + Q), space O(N).
Situation B: BFS from S. Unweighted graph, explores in nondecreasing edges from source. Time O(N + M), space O(N + M).
Situation C: Dijkstra's algorithm. All edge weights are nonnegative. Binary heap gives O((N + M) log N) time, space O(N + M).
Situation D: Dynamic programming. ways[i] = ways[i - 1] + ways[i - 2], with ways[0] = 1, ways[1] = 1. Time O(N), space O(N) or O(1).`,
    grading_rubric: [
      {
        id: 'pa1-situation-a',
        criterion: 'Situation A: Algorithm, Complexity & Reason',
        max_score: 5,
        description: '3 pts for prefix sums (or justified static tree), 1 pt for O(N+Q)/O(1) complexity, 1 pt for static array reasoning.',
      },
      {
        id: 'pa1-situation-b',
        criterion: 'Situation B: Algorithm, Complexity & Reason',
        max_score: 5,
        description: '3 pts for BFS from S, 1 pt for O(N+M) complexity, 1 pt for unweighted graph property.',
      },
      {
        id: 'pa1-situation-c',
        criterion: 'Situation C: Algorithm, Complexity & Reason',
        max_score: 5,
        description: '3 pts for Dijkstra, 1 pt for O((N+M) log N) complexity, 1 pt for nonnegative edge weights property.',
      },
      {
        id: 'pa1-situation-d',
        criterion: 'Situation D: Algorithm, Complexity & Reason',
        max_score: 5,
        description: '3 pts for dynamic programming/recurrence, 1 pt for O(N) complexity, 1 pt for subproblems/state reasoning.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pa-2',
    question_id: 'q-pa-2',
    reference_answer: `1. Direct approach worst-case is O(NQ). With N = Q = 200,000, that can take ~4 x 10^10 operations, far exceeding the 1-second time limit (~10^8 ops) and resulting in Time Limit Exceeded (TLE).
2. Build a prefix-sum array.
3. Preprocessing stores cumulative sums where prefix[i] = sum(A[1..i]). Any query [L, R] is answered in O(1) via prefix[R] - prefix[L - 1].
4. Total time complexity: Preprocessing O(N), queries O(Q), total O(N + Q) with O(N) auxiliary space.
5. Boundary cases: L = 1 (requiring prefix[0] = 0 or 1-based indexing), inclusive boundaries, or 64-bit integer overflow if cumulative sums exceed 2^31 - 1.`,
    grading_rubric: [
      {
        id: 'pa2-worst-case',
        criterion: 'Brute force complexity analysis',
        max_score: 4,
        description: 'Identifies O(NQ) and explains repeated additions exceeding standard operation limits (~4 x 10^10 ops).',
      },
      {
        id: 'pa2-proposed-solution',
        criterion: 'Faster preprocessing approach',
        max_score: 5,
        description: 'Proposes prefix sums (or an equally efficient valid data structure).',
      },
      {
        id: 'pa2-prefix-formula',
        criterion: 'Stored information & query formula',
        max_score: 5,
        description: 'Explains cumulative sums prefix[i] and range formula prefix[R] - prefix[L-1].',
      },
      {
        id: 'pa2-total-complexity',
        criterion: 'Total time complexity',
        max_score: 4,
        description: 'States O(N + Q) total time complexity correctly.',
      },
      {
        id: 'pa2-edge-cases',
        criterion: 'Boundary and indexing considerations',
        max_score: 2,
        description: 'Identifies genuine indexing (L=1, prefix[0]=0) or 64-bit integer type requirement.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pa-3',
    question_id: 'q-pa-3',
    reference_answer: `1. System A: Prefix sums. Preprocessing O(N), range-sum query O(1), memory O(N).
2. System B: Fenwick Tree (Binary Indexed Tree) or Segment Tree. Update O(log N), range-sum query O(log N), memory O(N).
3. A prefix-sum array becomes stale after an element update; updating all subsequent prefix sums requires O(N) operations per update, degenerating to O(N * Q) for Q updates.
4. Trade-off: Prefix sums provide O(1) query simplicity for static data, whereas tree structures handle dynamic modifications in O(log N) at the cost of logarithmic query overhead and greater implementation complexity.`,
    grading_rubric: [
      {
        id: 'pa3-system-a',
        criterion: 'System A Recommendation & Complexity',
        max_score: 6,
        description: 'Recommends prefix sums for System A with O(N) build and O(1) query time.',
      },
      {
        id: 'pa3-system-b',
        criterion: 'System B Recommendation & Complexity',
        max_score: 7,
        description: 'Recommends Fenwick Tree or Segment Tree with O(log N) update and query time.',
      },
      {
        id: 'pa3-invalidation-reason',
        criterion: 'Prefix sums staleness on updates',
        max_score: 7,
        description: 'Explains why point updates invalidate prefix sums and require O(N) recomputation.',
      },
      {
        id: 'pa3-tradeoff',
        criterion: 'Comparative Trade-off',
        max_score: 5,
        description: 'Meaningful comparison of static O(1) simplicity vs dynamic logarithmic flexibility.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pa-4',
    question_id: 'q-pa-4',
    reference_answer: `1. Brute force enumerates all O(N^2) contiguous segments and computes their sums, taking O(N^2) or O(N^3) time, which times out for N = 200,000.
2. Two pointers / sliding window technique.
3. The right pointer advances to expand the window, adding A[right] to running sum. When sum > K, advance the left pointer and subtract A[left] until sum <= K.
4. Monotonicity: Since all values are strictly positive, extending a window strictly increases its sum. Once left pointer advances because sum > K, moving it backwards would only reintroduce positive values, never helping at the current right endpoint.
5. Time complexity is O(N) because each pointer advances at most N times forward (amortized O(1) per step). Extra space is O(1).
6. Edge cases: Every single element > K (answer 0), entire array sum <= K (answer N), N = 1, cumulative sum exceeding 32-bit integer range (requires 64-bit int for K up to 10^18).`,
    grading_rubric: [
      {
        id: 'pa4-brute-force',
        criterion: 'Brute force baseline & limitations',
        max_score: 5,
        description: 'Recognizes O(N^2) brute force baseline and why it causes TLE.',
      },
      {
        id: 'pa4-technique',
        criterion: 'Efficient technique identification',
        max_score: 7,
        description: 'Identifies sliding window or two pointers.',
      },
      {
        id: 'pa4-pointer-mechanics',
        criterion: 'Pointer role and maintenance',
        max_score: 9,
        description: 'Explains right pointer expansion, running sum, and left pointer advancement when sum > K.',
      },
      {
        id: 'pa4-monotonicity',
        criterion: 'Monotonicity & forward-only movement',
        max_score: 6,
        description: 'Explains that positivity ensures monotonic sums, eliminating the need to move left pointer backward.',
      },
      {
        id: 'pa4-complexity',
        criterion: 'Time & memory complexity',
        max_score: 4,
        description: 'States O(N) time and O(1) space with amortized pointer analysis.',
      },
      {
        id: 'pa4-edge-cases',
        criterion: 'Edge case identification',
        max_score: 4,
        description: 'Identifies at least two edge cases (all > K, 64-bit overflow, N=1, entire array fits).',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },

  // ==========================================
  // DIVISION B PRIVATE CONFIGS
  // ==========================================
  {
    id: 'cfg-ab-1',
    question_id: 'q-ab-1',
    reference_answer: `1. Earliest Finish Time Greedy Algorithm (Interval Scheduling).
2. Sort meetings by ascending finish time E[i]. Scan in sorted order and select a meeting if S[i] >= lastFinish.
3. Pseudocode:
sort meetings by ascending finish time
lastFinish = -infinity
count = 0
for each meeting (start, finish) in sorted:
    if start >= lastFinish:
        select meeting
        count = count + 1
        lastFinish = finish
return count
4. Correctness: The meeting finishing earliest leaves the maximum remaining time available for subsequent compatible meetings. By greedy exchange argument, replacing the first meeting in any optimal schedule with the earliest-finishing meeting preserves feasibility and optimality.
5. Complexity: Sorting takes O(N log N), scanning takes O(N), total time O(N log N). Memory is O(N) or O(log N) sorting stack space.
6. Endpoint touching: The condition S[i] >= lastFinish correctly allows a meeting starting at 5 when another ends at 5.`,
    grading_rubric: [
      {
        id: 'ab1-algorithm-choice',
        criterion: 'Greedy algorithm strategy',
        max_score: 6,
        description: 'Correct earliest-finish-time greedy strategy.',
      },
      {
        id: 'ab1-pseudocode',
        criterion: 'Pseudocode & procedure',
        max_score: 4,
        description: 'Clear pseudocode with sorting and greedy selection.',
      },
      {
        id: 'ab1-correctness-argument',
        criterion: 'Exchange / optimality proof',
        max_score: 7,
        description: 'Valid greedy-exchange argument explaining why earliest finish leaves maximum remaining time.',
      },
      {
        id: 'ab1-complexity',
        criterion: 'Time & memory complexity',
        max_score: 4,
        description: 'States O(N log N) time and O(N) or O(log N) space.',
      },
      {
        id: 'ab1-endpoint-handling',
        criterion: 'Endpoint touching condition',
        max_score: 4,
        description: 'Explains that start >= lastFinish allows meetings that touch at endpoints.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-ab-2',
    question_id: 'q-ab-2',
    reference_answer: `1. Dijkstra's Algorithm with a min-priority queue, appropriate because all edge weights are nonnegative.
2. Information stored: dist[v] initialized to infinity (dist[S] = 0), and a min-heap priority queue storing (distance, vertex) pairs.
3. Relaxation step:
for each edge (u, v, w) from u:
    if dist[u] + w < dist[v]:
        dist[v] = dist[u] + w
        priority_queue.push((dist[v], v))
4. BFS minimizes the number of edges, not the sum of edge weights. A path with fewer edges could have significantly larger total weight than a path with more edges of small weight.
5. Complexity: O((N + M) log N) time with adjacency list and binary heap. Space: O(N + M) for graph and dist array.
6. Unreachable target: dist[T] remains infinity when the priority queue empties.`,
    grading_rubric: [
      {
        id: 'ab2-algorithm-choice',
        criterion: 'Algorithm selection & nonnegative weights',
        max_score: 5,
        description: 'Selects Dijkstra and notes requirement for nonnegative edge weights.',
      },
      {
        id: 'ab2-data-stored',
        criterion: 'Vertex state & distance tracking',
        max_score: 5,
        description: 'Explains dist[] array initialized to infinity and min-heap tracking.',
      },
      {
        id: 'ab2-relaxation-step',
        criterion: 'Edge relaxation step',
        max_score: 5,
        description: 'Correct edge relaxation logic (dist[u] + w < dist[v]).',
      },
      {
        id: 'ab2-bfs-insufficiency',
        criterion: 'BFS insufficiency reasoning',
        max_score: 4,
        description: 'Explains that BFS minimizes edge count, not total weight.',
      },
      {
        id: 'ab2-complexity',
        criterion: 'Time & memory complexity',
        max_score: 4,
        description: 'States O((N + M) log N) time and O(N + M) memory.',
      },
      {
        id: 'ab2-unreachable-target',
        criterion: 'Unreachable target detection',
        max_score: 2,
        description: 'Explains that unreachable target retains infinity distance.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-ab-3',
    question_id: 'q-ab-3',
    reference_answer: `1. DP State: dp[i] = maximum subset sum obtainable from the first i elements without selecting adjacent elements.
2. Recurrence:
dp[0] = 0
dp[1] = max(0, A[1])
For i >= 2:
dp[i] = max(dp[i - 1], dp[i - 2] + A[i])
3. Base cases: dp[0] = 0, dp[1] = max(0, A[1]). Negative values are handled because selecting nothing is permitted, so the maximum sum is always at least 0.
4. Correctness: At element i, we either exclude element i (optimal choice is dp[i-1]) or include element i (which prohibits element i-1, leaving optimal choice dp[i-2] plus A[i]). Taking the maximum covers all possibilities.
5. Complexity: Time O(N), Space O(N).
6. Memory reduction: Since dp[i] depends only on dp[i-1] and dp[i-2], we only need two variables (prev1, prev2), reducing space complexity to O(1).`,
    grading_rubric: [
      {
        id: 'ab3-dp-state',
        criterion: 'State definition',
        max_score: 6,
        description: 'Precise dynamic programming state definition.',
      },
      {
        id: 'ab3-recurrence-base',
        criterion: 'Recurrence and base cases',
        max_score: 7,
        description: 'Correct recurrence dp[i] = max(dp[i-1], dp[i-2] + A[i]) and base cases.',
      },
      {
        id: 'ab3-correctness-reasoning',
        criterion: 'Correctness reasoning',
        max_score: 5,
        description: 'Explains mutually exclusive and exhaustive skip vs select choices.',
      },
      {
        id: 'ab3-complexity',
        criterion: 'Time & memory complexity',
        max_score: 4,
        description: 'States O(N) time and O(N) memory.',
      },
      {
        id: 'ab3-negative-and-space-opt',
        criterion: 'Negative values & space optimization',
        max_score: 3,
        description: 'Handles negative values (bounded by 0) and explains O(1) space optimization.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-ab-4',
    question_id: 'q-ab-4',
    reference_answer: `1. Data structure: Fenwick Tree (Binary Indexed Tree) or Segment Tree storing cumulative sums.
2. Assignment update:
- Fenwick Tree: Compute delta = x - A[i], add delta to index i by advancing index (i += i & (-i)), and set A[i] = x. Takes O(log N).
- Segment Tree: Update leaf at index i with x and recalculate parent node sums up to root. Takes O(log N).
3. Range sum query:
- Fenwick Tree: query(l, r) = prefixSum(r) - prefixSum(l - 1). Takes O(log N).
- Segment Tree: Recursively query intersecting canonical intervals covering [l, r]. Takes O(log N).
4. Complexity: Update O(log N), Query O(log N), Total time O((N + Q) log N), Total memory O(N).
5. Inefficiency: Recomputing all prefix sums after each update costs O(N) per update, degenerating to O(N * Q) = ~4 x 10^10 operations, causing TLE.`,
    grading_rubric: [
      {
        id: 'ab4-data-structure',
        criterion: 'Data structure selection & storage',
        max_score: 6,
        description: 'Selects Fenwick Tree or Segment Tree and explains what is stored.',
      },
      {
        id: 'ab4-update-process',
        criterion: 'Update handling & delta calculation',
        max_score: 5,
        description: 'Explains assignment update, including delta calculation for Fenwick tree.',
      },
      {
        id: 'ab4-query-process',
        criterion: 'Range-sum calculation',
        max_score: 5,
        description: 'Explains range sum via prefix difference or interval aggregation.',
      },
      {
        id: 'ab4-complexity',
        criterion: 'Operation & memory complexity',
        max_score: 5,
        description: 'States O(log N) per update and query, with O(N) memory.',
      },
      {
        id: 'ab4-rebuild-inefficiency',
        criterion: 'Prefix sum rebuild inefficiency',
        max_score: 4,
        description: 'Explains why rebuilding prefix sums is O(N) per update and O(NQ) overall.',
      },
    ],
    test_cases: [],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },

  // ==========================================
  // DIVISION C PRIVATE CONFIGS
  // ==========================================
  {
    id: 'cfg-pr-1',
    question_id: 'q-pr-1',
    reference_answer: `#include <bits/stdc++.h>
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
}`,
    grading_rubric: [
      { id: 'pr1-io', criterion: 'I/O Format', max_score: 4, description: 'Reads input and prints output integer.' },
      { id: 'pr1-logic', criterion: 'Distinct Counting', max_score: 7, description: 'Correctly counts distinct values.' },
      { id: 'pr1-negatives', criterion: 'Edge Values & Negatives', max_score: 2, description: 'Handles negative and large numbers.' },
      { id: 'pr1-complexity', criterion: 'Complexity', max_score: 2, description: 'O(N log N) time complexity.' },
    ],
    test_cases: [
      { id: 'tc-pr1-1', input: '7\n3 1 3 2 5 2 5', expected_output: '4', is_hidden: false },
      { id: 'tc-pr1-2', input: '5\n10 10 10 10 10', expected_output: '1', is_hidden: true },
      { id: 'tc-pr1-3', input: '1\n42', expected_output: '1', is_hidden: true },
      { id: 'tc-pr1-4', input: '6\n-5 0 5 -5 0 10', expected_output: '4', is_hidden: true },
      { id: 'tc-pr1-5', input: '4\n1000000000 -1000000000 1000000000 0', expected_output: '3', is_hidden: true },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pr-2',
    question_id: 'q-pr-2',
    reference_answer: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    long long k;
    if (!(cin >> n >> k)) return 0;

    vector<long long> a(n);
    for (int i = 0; i < n; ++i) {
        cin >> a[i];
    }

    int left = 0;
    int answer = 0;
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
}`,
    grading_rubric: [
      { id: 'pr2-io', criterion: 'I/O Parsing', max_score: 4, description: 'Reads N, K and array values.' },
      { id: 'pr2-sliding-window', criterion: 'Sliding Window Logic', max_score: 8, description: 'Correct sliding window implementation.' },
      { id: 'pr2-shrinking-zero', criterion: 'Zero & Bounds', max_score: 4, description: 'Handles window shrinking and 0 result when all exceed K.' },
      { id: 'pr2-types-complexity', criterion: '64-bit Types & Complexity', max_score: 4, description: 'Uses long long for 10^18 budget in O(N) time.' },
    ],
    test_cases: [
      { id: 'tc-pr2-1', input: '5 11\n2 1 3 4 2', expected_output: '4', is_hidden: false },
      { id: 'tc-pr2-2', input: '3 100\n10 20 30', expected_output: '3', is_hidden: true },
      { id: 'tc-pr2-3', input: '3 5\n10 20 30', expected_output: '0', is_hidden: true },
      { id: 'tc-pr2-4', input: '4 10\n15 8 12 20', expected_output: '1', is_hidden: true },
      { id: 'tc-pr2-5', input: '3 20000000000\n10000000000 5000000000 6000000000', expected_output: '2', is_hidden: true },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pr-3',
    question_id: 'q-pr-3',
    reference_answer: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n, m;
    if (!(cin >> n >> m)) return 0;

    vector<string> grid(n);
    pair<int, int> start = {-1, -1};
    pair<int, int> target = {-1, -1};

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
            int nr = r + dr[d];
            int nc = c + dc[d];

            if (nr < 0 || nr >= n || nc < 0 || nc >= m) continue;
            if (grid[nr][nc] == '#') continue;
            if (dist[nr][nc] != -1) continue;

            dist[nr][nc] = dist[r][c] + 1;
            q.push({nr, nc});
        }
    }

    cout << dist[target.first][target.second] << '\\n';
    return 0;
}`,
    grading_rubric: [
      { id: 'pr3-parsing', criterion: 'Grid Parsing', max_score: 5, description: 'Parses grid, identifies S and T.' },
      { id: 'pr3-bfs-traversal', criterion: 'BFS Traversal', max_score: 10, description: 'Correct BFS queue traversal and distance maintenance.' },
      { id: 'pr3-walls-bounds', criterion: 'Wall and Boundary Checks', max_score: 5, description: 'Correct collision and grid bounds checking.' },
      { id: 'pr3-unreachable', criterion: 'Unreachable Target', max_score: 5, description: 'Correctly outputs -1 if unreachable.' },
      { id: 'pr3-complexity', criterion: 'Complexity', max_score: 5, description: 'O(NM) time and memory efficiency.' },
    ],
    test_cases: [
      { id: 'tc-pr3-1', input: '4 5\nS....\n.#...\n.#.#.\n...T.', expected_output: '6', is_hidden: false },
      { id: 'tc-pr3-2', input: '3 3\nS#.\n.##\n..T', expected_output: '-1', is_hidden: true },
      { id: 'tc-pr3-3', input: '1 2\nST', expected_output: '1', is_hidden: true },
      { id: 'tc-pr3-4', input: '3 3\nS.#\n#.#\n#.T', expected_output: '4', is_hidden: true },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
  {
    id: 'cfg-pr-4',
    question_id: 'q-pr-4',
    reference_answer: `#include <bits/stdc++.h>
using namespace std;

using ll = long long;

int main() {
    ios::sync_with_stdio(false);
    cin.tie(nullptr);

    int n;
    if (!(cin >> n)) return 0;

    vector<ll> h(n);
    for (int i = 0; i < n; ++i) {
        cin >> h[i];
    }

    if (n == 1) {
        cout << 0 << '\\n';
        return 0;
    }

    vector<ll> dp(n, 0);
    dp[1] = llabs(h[1] - h[0]);

    for (int i = 2; i < n; ++i) {
        ll fromPrevious = dp[i - 1] + llabs(h[i] - h[i - 1]);
        ll fromTwoBack = dp[i - 2] + llabs(h[i] - h[i - 2]);
        dp[i] = min(fromPrevious, fromTwoBack);
    }

    cout << dp[n - 1] << '\\n';
    return 0;
}`,
    grading_rubric: [
      { id: 'pr4-parsing-base', criterion: 'Input & N=1 Base Case', max_score: 5, description: 'Parses input and handles N = 1 base case.' },
      { id: 'pr4-dp-state', criterion: 'DP Base Cases', max_score: 8, description: 'Correct DP state and dp[1] initialization.' },
      { id: 'pr4-transitions', criterion: 'Minimum Transitions', max_score: 10, description: 'Correct transitions from i-1 and i-2.' },
      { id: 'pr4-integer-types', criterion: '64-bit Integer Types', max_score: 5, description: 'Uses 64-bit integers for cumulative costs.' },
      { id: 'pr4-complexity', criterion: 'O(N) Complexity', max_score: 7, description: 'Passes full constraints in O(N) time.' },
    ],
    test_cases: [
      { id: 'tc-pr4-1', input: '4\n10 30 40 20', expected_output: '30', is_hidden: false },
      { id: 'tc-pr4-2', input: '1\n50', expected_output: '0', is_hidden: true },
      { id: 'tc-pr4-3', input: '2\n10 50', expected_output: '40', is_hidden: true },
      { id: 'tc-pr4-4', input: '4\n10 10 10 10', expected_output: '0', is_hidden: true },
      { id: 'tc-pr4-5', input: '6\n30 10 60 10 60 50', expected_output: '40', is_hidden: true },
    ],
    created_at: '2026-10-10T00:00:00.000Z',
    updated_at: '2026-10-10T00:00:00.000Z',
  },
];
