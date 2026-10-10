'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { AlertCircle, ShieldAlert } from 'lucide-react';

interface Props {
  attemptId: string;
  sessionId: string;
  currentQuestionId?: string | null;
  onDuplicateSessionDetected?: () => void;
}

export function ProctorMonitor({
  attemptId,
  sessionId,
  currentQuestionId,
  onDuplicateSessionDetected,
}: Props) {
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  const [isDuplicateTab, setIsDuplicateTab] = useState(false);
  const warningTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showWarning = useCallback((msg: string) => {
    setWarningMessage(msg);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => {
      setWarningMessage(null);
    }, 6000);
  }, []);

  const sendEvent = useCallback(
    (
      eventType: string,
      severity: 'low' | 'medium' | 'high',
      metadata: Record<string, unknown> = {}
    ) => {
      const payload = {
        attemptId,
        sessionId,
        eventType,
        severity,
        metadata,
        questionId: currentQuestionId || null,
      };

      try {
        // Use keepalive for guaranteed delivery during page visibility changes
        fetch('/api/assessment/integrity', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch((err) => console.warn('Failed to send proctor event:', err));
      } catch (err) {
        console.warn('Proctor send error:', err);
      }
    },
    [attemptId, sessionId, currentQuestionId]
  );

  useEffect(() => {
    // 1. BroadcastChannel: Single Active Assessment Tab Coordination
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(`inc_attempt_${attemptId}`);

      // Announce arrival
      channel.postMessage({ type: 'TAB_ACTIVE', sessionId });

      channel.onmessage = (event) => {
        if (event.data?.type === 'TAB_ACTIVE' && event.data?.sessionId !== sessionId) {
          // Another tab was opened!
          setIsDuplicateTab(true);
          sendEvent('duplicate_tab', 'high', {
            conflictSessionId: event.data.sessionId,
          });
          showWarning('Multiple assessment tabs detected! Only one active session is permitted.');
          if (onDuplicateSessionDetected) onDuplicateSessionDetected();
        }
      };
    } catch {
      // BroadcastChannel not supported in this environment
    }

    // 2. Visibility Change Detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        sendEvent('page_hidden', 'medium', { timestamp: new Date().toISOString() });
        showWarning('Assessment window is not visible. Tab switch recorded.');
      } else {
        sendEvent('page_visible', 'low', { timestamp: new Date().toISOString() });
      }
    };

    // 3. Window Blur / Focus Detection
    const handleBlur = () => {
      sendEvent('window_blur', 'low', { timestamp: new Date().toISOString() });
    };

    const handleFocus = () => {
      sendEvent('window_focus', 'low', { timestamp: new Date().toISOString() });
    };

    // 4. Context Menu Detection (Right Click)
    const handleContextMenu = (e: MouseEvent) => {
      sendEvent('context_menu', 'low', { target: (e.target as HTMLElement)?.tagName });
    };

    // 5. Fullscreen change
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        sendEvent('fullscreen_exit', 'medium', { timestamp: new Date().toISOString() });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    // 6. Periodic Heartbeat to Server
    const heartbeatInterval = setInterval(() => {
      fetch('/api/assessment/heartbeat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attemptId, sessionId }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.valid === false) {
            setIsDuplicateTab(true);
            showWarning('Another device or browser session has taken over this assessment.');
          }
        })
        .catch(() => {});
    }, 30000); // every 30 seconds

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      clearInterval(heartbeatInterval);
      if (channel) channel.close();
      if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    };
  }, [attemptId, sessionId, sendEvent, showWarning, onDuplicateSessionDetected]);

  return (
    <>
      {/* Non-intrusive warning toast */}
      {warningMessage && !isDuplicateTab && (
        <div
          className="fixed bottom-6 right-6 z-50 max-w-md bg-amber-950/95 border border-amber-600 text-amber-200 px-4 py-3 rounded-lg shadow-xl backdrop-blur-md flex items-start gap-3 text-sm animate-fade-in"
          role="alert"
        >
          <AlertCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-100">Integrity Notice</p>
            <p className="text-xs text-amber-300/90 mt-0.5">{warningMessage}</p>
          </div>
        </div>
      )}

      {/* Duplicate Tab Lock Overlay */}
      {isDuplicateTab && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-6 text-center">
          <div className="bg-slate-900 border border-red-700/80 rounded-xl p-8 max-w-lg shadow-2xl text-slate-100">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Duplicate Assessment Session Detected</h2>
            <p className="text-sm text-slate-300 mb-6">
              Another browser tab or device has opened this assessment attempt. In accordance with ICPC integrity rules, only one active assessment session is permitted at a time.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-lg transition-colors"
            >
              Resume in This Tab
            </button>
          </div>
        </div>
      )}
    </>
  );
}
