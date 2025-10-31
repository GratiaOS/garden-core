import * as React from 'react';

type FlowActivityOptions = {
  /** Milliseconds after which inactivity is considered paused. Defaults to 5000. */
  pauseAfterMs?: number;
  /** Callback invoked when the flow pauses. */
  onPause?: () => void;
  /** Callback invoked when the flow resumes after a pause. */
  onResume?: () => void;
};

export type FlowActivityHandle = {
  /** Notify the hook that the user is active (typing, drawing, etc.). */
  notifyActivity: () => void;
  /** Whether the flow is currently paused. */
  paused: boolean;
};

/**
 * Tracks interaction bursts (typing, drawing, etc.) and flips to paused when
 * no activity is observed for `pauseAfterMs`.
 */
export function useFlowActivity(options: FlowActivityOptions = {}): FlowActivityHandle {
  const { pauseAfterMs = 5000 } = options;
  const onPauseRef = React.useRef(options.onPause);
  const onResumeRef = React.useRef(options.onResume);
  onPauseRef.current = options.onPause;
  onResumeRef.current = options.onResume;

  const timerRef = React.useRef<number | null>(null);
  const [paused, setPaused] = React.useState(true);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const notifyActivity = React.useCallback(() => {
    clearTimer();
    if (paused) {
      setPaused(false);
      onResumeRef.current?.();
    }
    timerRef.current = window.setTimeout(() => {
      setPaused(true);
      onPauseRef.current?.();
    }, pauseAfterMs);
  }, [pauseAfterMs, paused]);

  React.useEffect(() => {
    return () => clearTimer();
  }, []);

  return { paused, notifyActivity };
}

