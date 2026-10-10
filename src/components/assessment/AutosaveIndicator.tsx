'use client';

import React from 'react';
import { CheckCircle2, Loader2, AlertCircle, WifiOff } from 'lucide-react';

export type SaveState = 'idle' | 'saving' | 'saved' | 'offline' | 'error';

interface Props {
  state: SaveState;
  lastSavedAt?: string | null;
}

export function AutosaveIndicator({ state, lastSavedAt }: Props) {
  if (state === 'idle' && !lastSavedAt) {
    return null;
  }

  return (
    <div className="flex items-center gap-1.5 text-xs">
      {state === 'saving' && (
        <span className="flex items-center gap-1.5 text-blue-400">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Saving...</span>
        </span>
      )}

      {state === 'saved' && (
        <span className="flex items-center gap-1.5 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Saved</span>
        </span>
      )}

      {state === 'offline' && (
        <span className="flex items-center gap-1.5 text-amber-400" title="Changes cached in browser, reconnecting...">
          <WifiOff className="w-3.5 h-3.5" />
          <span>Offline (cached)</span>
        </span>
      )}

      {state === 'error' && (
        <span className="flex items-center gap-1.5 text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>Unable to save</span>
        </span>
      )}
    </div>
  );
}
