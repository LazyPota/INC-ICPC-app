import type { Config } from '@netlify/functions';

const checkDeadlineHandler = async () => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.URL || 'http://localhost:3000';
  const cronSecret = process.env.CRON_SECRET;

  try {
    const res = await fetch(`${appUrl}/api/cron/check-deadline`, {
      headers: cronSecret ? { Authorization: `Bearer ${cronSecret}` } : {},
    });
    const data = await res.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error invoking scheduled deadline checker';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export default checkDeadlineHandler;

export const config: Config = {
  schedule: '*/5 * * * *',
};
