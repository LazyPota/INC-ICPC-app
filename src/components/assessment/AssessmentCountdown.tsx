'use client';

import React, { useEffect, useState } from 'react';
import { calculateRemainingSeconds, formatCountdown } from '@/lib/utils/time';
import { Clock, AlertTriangle } from 'lucide-react';

interface Props {
  deadlineAt: string;
  onExpire?: () => void;
}

export function AssessmentCountdown({ deadlineAt, onExpire }: Props) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() =>
    calculateRemainingSeconds(deadlineAt)
  );

  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = calculateRemainingSeconds(deadlineAt);
      setSecondsLeft(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        if (onExpire) onExpire();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [deadlineAt, onExpire]);

  const isUrgent = secondsLeft > 0 && secondsLeft < 300; // < 5 minutes
  const isWarning = secondsLeft >= 300 && secondsLeft < 900; // < 15 minutes

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-md font-mono text-sm border font-semibold transition-colors ${
        isUrgent
          ? 'bg-red-950/70 border-red-700 text-red-200 animate-pulse'
          : isWarning
          ? 'bg-amber-950/60 border-amber-600 text-amber-200'
          : 'bg-slate-900 border-slate-700 text-slate-100'
      }`}
      role="timer"
      aria-live="polite"
    >
      {isUrgent ? (
        <AlertTriangle className="w-4 h-4 text-red-400" />
      ) : (
        <Clock className="w-4 h-4 text-blue-400" />
      )}
      <span>{formatCountdown(secondsLeft)}</span>
      {isUrgent && <span className="text-xs uppercase font-sans tracking-wide">Time Critical</span>}
    </div>
  );
}
