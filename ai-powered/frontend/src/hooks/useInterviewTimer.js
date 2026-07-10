import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_MINUTES = 15;

export function useInterviewTimer(isActive, startedAt, onMaxReached) {
  const [elapsed, setElapsed] = useState(0);
  const intervalRef           = useRef(null);
  const onMaxReachedRef       = useRef(onMaxReached);
  const maxFiredRef           = useRef(false);

  useEffect(() => { onMaxReachedRef.current = onMaxReached; }, [onMaxReached]);

  const tick = useCallback(() => {
    const start = startedAt ? new Date(startedAt).getTime() : Date.now();
    const seconds = Math.floor((Date.now() - start) / 1000);
    setElapsed(seconds);
    if (!maxFiredRef.current && seconds >= MAX_MINUTES * 60) {
      maxFiredRef.current = true;
      onMaxReachedRef.current?.();
    }
  }, [startedAt]);

  useEffect(() => {
    if (!isActive) { clearInterval(intervalRef.current); return; }
    tick();
    intervalRef.current = setInterval(tick, 1000);
    return () => clearInterval(intervalRef.current);
  }, [isActive, tick]);

  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;

  return {
    elapsed,
    elapsedMinutes: minutes,
    formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}