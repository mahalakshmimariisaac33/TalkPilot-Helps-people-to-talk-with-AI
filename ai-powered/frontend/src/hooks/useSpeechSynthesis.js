import { useCallback, useEffect, useRef, useState } from 'react';

function pickVoice(gender) {
  const voices = window.speechSynthesis?.getVoices() || [];
  const en = voices.filter((v) => v.lang.startsWith('en'));
  if (!en.length) return null;

  if (gender === 'FEMALE') {
    return (
      en.find((v) => /samantha|zira|jenny|aria|susan|victoria|female/i.test(v.name)) ||
      en.find((v) => !/david|mark|guy|james|daniel|ryan|george|male/i.test(v.name)) ||
      en[0]
    );
  }
  return (
    en.find((v) => /david|mark|guy|james|daniel|ryan|george|male/i.test(v.name)) ||
    en[0]
  );
}

export function useSpeechSynthesis({ gender = 'MALE', rate = 1.0 } = {}) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const animRef     = useRef(null);
  const startRef    = useRef(0);
  const resolveRef  = useRef(null);

  // Ensure voices are loaded
  useEffect(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.getVoices(); // trigger load
      const handler = () => {};
      window.speechSynthesis.addEventListener('voiceschanged', handler);
      return () => window.speechSynthesis.removeEventListener('voiceschanged', handler);
    }
  }, []);

  const stopAnim = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    animRef.current = null;
  }, []);

  const speak = useCallback((text) => {
    return new Promise((resolve) => {
      if (!window.speechSynthesis || !text) { resolve(); return; }

      // Cancel anything playing
      window.speechSynthesis.cancel();

      // Small gap after cancel before starting new speech
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate   = Math.max(0.5, Math.min(2, rate));
        utterance.pitch  = gender === 'FEMALE' ? 1.1 : 0.9;
        utterance.volume = 1;

        // Give voices a chance to load
        const voice = pickVoice(gender);
        if (voice) utterance.voice = voice;

        resolveRef.current = resolve;

        utterance.onstart = () => {
          setIsSpeaking(true);
          startRef.current = Date.now();
        };

        const finish = () => {
          setIsSpeaking(false);
          stopAnim();
          // Extra 400ms gap — lets audio pipeline fully close before mic opens
          setTimeout(() => {
            resolveRef.current?.();
            resolveRef.current = null;
          }, 400);
        };

        utterance.onend   = finish;
        utterance.onerror = finish;

        window.speechSynthesis.speak(utterance);

        // Chrome bug: speechSynthesis sometimes freezes on long text.
        // Keepalive workaround: pause/resume every 10s.
        const keepAlive = setInterval(() => {
          if (!window.speechSynthesis.speaking) { clearInterval(keepAlive); return; }
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }, 10000);

      }, 100);
    });
  }, [gender, rate, stopAnim]);

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
    stopAnim();
    resolveRef.current?.();
    resolveRef.current = null;
  }, [stopAnim]);

  useEffect(() => () => cancel(), [cancel]);

  return { speak, cancel, isSpeaking };
}
