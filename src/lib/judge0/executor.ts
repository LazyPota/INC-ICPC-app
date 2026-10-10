import type { TestCase } from '@/types/database';

export interface CodeExecutionOutcome {
  testId: string;
  isPassed: boolean;
  statusDescription: string;
  timeMs?: number;
  memoryKb?: number;
  stdout?: string;
  stderr?: string;
  compileOutput?: string;
}

export interface BatchExecutionResult {
  isConfigured: boolean;
  status: 'completed' | 'compile_error' | 'unavailable' | 'runtime_error';
  passedTests: number;
  totalTests: number;
  compileOutput?: string;
  results: CodeExecutionOutcome[];
}

export function isJudge0Configured(): boolean {
  return Boolean(process.env.JUDGE0_API_URL && process.env.JUDGE0_API_URL.trim() !== '');
}

/**
 * Executes C++ code in sandboxed Judge0 environment.
 * If Judge0 is not configured, marks status as 'unavailable' safely without fabricating results.
 */
export async function executeCppCode(
  sourceCode: string,
  testCases: TestCase[]
): Promise<BatchExecutionResult> {
  const apiUrl = process.env.JUDGE0_API_URL?.replace(/\/$/, '');
  const apiKey = process.env.JUDGE0_API_KEY;

  if (!isJudge0Configured() || !apiUrl) {
    return {
      isConfigured: false,
      status: 'unavailable',
      passedTests: 0,
      totalTests: testCases.length,
      compileOutput: 'Judge0 sandboxed execution environment is not configured. Code is securely stored for manual grading.',
      results: testCases.map((tc) => ({
        testId: tc.id,
        isPassed: false,
        statusDescription: 'Sandbox Unavailable',
      })),
    };
  }

  // Judge0 C++ (GCC 14 or latest, Language ID 54 or 105)
  const LANGUAGE_ID_CPP = 54;
  const outcomes: CodeExecutionOutcome[] = [];
  let passedCount = 0;
  let overallCompileOutput = '';

  for (const tc of testCases) {
    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headers['X-Auth-Token'] = apiKey;
        headers['X-RapidAPI-Key'] = apiKey;
      }

      const submissionRes = await fetch(`${apiUrl}/submissions?wait=true`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          source_code: sourceCode,
          language_id: LANGUAGE_ID_CPP,
          stdin: tc.input,
          expected_output: tc.expected_output,
          cpu_time_limit: 2.0,
          memory_limit: 128000,
        }),
      });

      if (!submissionRes.ok) {
        throw new Error(`Judge0 responded with HTTP ${submissionRes.status}`);
      }

      const data = await submissionRes.json();
      const statusId = data.status?.id; // 3 = Accepted, 4 = Wrong Answer, 5 = Time Limit, 6 = Compilation Error, etc.
      const isAccepted = statusId === 3;
      if (isAccepted) passedCount++;

      if (data.compile_output) {
        overallCompileOutput = data.compile_output;
      }

      outcomes.push({
        testId: tc.id,
        isPassed: isAccepted,
        statusDescription: data.status?.description || 'Executed',
        timeMs: data.time ? Math.round(parseFloat(data.time) * 1000) : undefined,
        memoryKb: data.memory,
        stdout: tc.is_hidden ? undefined : data.stdout, // Never leak hidden stdout
        stderr: data.stderr,
        compileOutput: data.compile_output,
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Execution error';
      outcomes.push({
        testId: tc.id,
        isPassed: false,
        statusDescription: `Judge0 Error: ${errMsg}`,
      });
    }
  }

  const hasCompileError = outcomes.some((o) => o.statusDescription.includes('Compilation'));

  return {
    isConfigured: true,
    status: hasCompileError ? 'compile_error' : 'completed',
    passedTests: passedCount,
    totalTests: testCases.length,
    compileOutput: overallCompileOutput,
    results: outcomes,
  };
}
