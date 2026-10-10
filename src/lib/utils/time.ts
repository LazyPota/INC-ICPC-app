/**
 * Authoritative time and formatting utilities
 * All DB timestamps are UTC ISO strings. All display timestamps are presented in WIB (Asia/Jakarta, UTC+7).
 */

export function formatToWIB(
  dateInput: string | Date | number,
  options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }
): string {
  try {
    const date = typeof dateInput === 'string' || typeof dateInput === 'number' ? new Date(dateInput) : dateInput;
    if (isNaN(date.getTime())) return '-';

    return new Intl.DateTimeFormat('id-ID', {
      ...options,
      timeZone: 'Asia/Jakarta',
    }).format(date) + ' WIB';
  } catch {
    return '-';
  }
}

export function calculateRemainingSeconds(deadlineAt: string | Date): number {
  const deadline = typeof deadlineAt === 'string' ? new Date(deadlineAt).getTime() : deadlineAt.getTime();
  const now = Date.now();
  const diffSec = Math.floor((deadline - now) / 1000);
  return Math.max(0, diffSec);
}

export function formatCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;
}

export function isDeadlineExpired(deadlineAt: string | Date): boolean {
  return calculateRemainingSeconds(deadlineAt) <= 0;
}
