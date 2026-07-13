import { useEffect, useRef, useState } from 'react';

const MAX_MINUTES = 15;
const MAX_SECONDS = MAX_MINUTES * 60;

export function useInterviewTimer(active, startedAt, onMaxReached) {
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const intervalRef  = useRef(null);
  const calledMaxRef = useRef(false);

  useEffect(() => {
    if (!active) return;

    const getElapsed = () => {
      if (startedAt) {
        return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
      }
      return 0;
    };

    setElapsedSeconds(getElapsed());

    intervalRef.current = setInterval(() => {
      const elapsed = getElapsed();
      setElapsedSeconds(elapsed);

      if (elapsed >= MAX_SECONDS && !calledMaxRef.current) {
        calledMaxRef.current = true;
        clearInterval(intervalRef.current);
        onMaxReached?.();
      }
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [active, startedAt, onMaxReached]);

  // countdown from 15:00 → 00:00
  const remaining = Math.max(MAX_SECONDS - elapsedSeconds, 0);
  const mm = String(Math.floor(remaining / 60)).padStart(2, '0');
  const ss = String(remaining % 60).padStart(2, '0');
  const formatted = `${mm}:${ss}`;

  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  return { formatted, elapsedSeconds, elapsedMinutes };
}
