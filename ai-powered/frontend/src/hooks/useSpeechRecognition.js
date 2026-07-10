import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeechRecognition() {
  const [finalTranscript,   setFinalTranscript]   = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening,       setIsListening]       = useState(false);
  const [isSupported,       setIsSupported]       = useState(false);

  const recognitionRef  = useRef(null);
  const shouldListenRef = useRef(false);   // true = keep mic alive
  const startingRef     = useRef(false);   // true = start() already in flight
  const restartTimer    = useRef(null);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SR);
    if (!SR) return;

    const rec = new SR();
    rec.continuous      = true;
    rec.interimResults  = true;
    rec.lang            = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      startingRef.current = false;   // start() completed successfully
      setIsListening(true);
    };

    rec.onresult = (event) => {
      let newFinal  = '';
      let newInterim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinal += event.results[i][0].transcript + ' ';
        } else {
          newInterim += event.results[i][0].transcript;
        }
      }
      if (newFinal.trim()) {
        setFinalTranscript((p) => (p + ' ' + newFinal).trim());
        setInterimTranscript('');
      } else if (newInterim) {
        setInterimTranscript(newInterim);
      }
    };

    rec.onerror = (e) => {
      startingRef.current = false;
      // Permissions denied — stop completely
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        shouldListenRef.current = false;
        setIsListening(false);
      }
      // no-speech / network / audio-capture — onend will handle restart
    };

    rec.onend = () => {
      startingRef.current = false;
      if (!shouldListenRef.current) {
        setIsListening(false);
        return;
      }
      // Auto-restart — small delay to avoid "already started" error
      clearTimeout(restartTimer.current);
      restartTimer.current = setTimeout(() => {
        if (!shouldListenRef.current || startingRef.current) return;
        startingRef.current = true;
        try { rec.start(); } catch { startingRef.current = false; }
      }, 200);
    };

    recognitionRef.current = rec;
    return () => {
      shouldListenRef.current = false;
      startingRef.current     = false;
      clearTimeout(restartTimer.current);
      try { rec.stop(); } catch { /* ignore */ }
    };
  }, []);

  /**
   * startListening — call this when the candidate should answer.
   * Clears transcript fresh, then starts the mic after a brief delay
   * so the speech-synthesis audio pipeline has fully closed.
   */
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    // Reset transcript for this new answer
    setFinalTranscript('');
    setInterimTranscript('');

    shouldListenRef.current = true;
    setIsListening(true);

    // 350ms buffer — lets browser fully release the audio output device
    // before opening the microphone input
    clearTimeout(restartTimer.current);
    restartTimer.current = setTimeout(() => {
      if (!shouldListenRef.current || startingRef.current) return;
      startingRef.current = true;
      try {
        recognitionRef.current.start();
      } catch {
        startingRef.current = false;
        // Already running is fine — onstart will clear startingRef
      }
    }, 350);
  }, []);

  /**
   * stopListening — call before submitting or when switching state.
   * Prevents onend from restarting.
   */
  const stopListening = useCallback(() => {
    shouldListenRef.current = false;
    startingRef.current     = false;
    clearTimeout(restartTimer.current);
    setIsListening(false);
    setInterimTranscript('');
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
  }, []);

  const getCleanTranscript = useCallback(() => finalTranscript.trim(), [finalTranscript]);

  const resetTranscript = useCallback(() => {
    setFinalTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    transcript:        finalTranscript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    getCleanTranscript,
    resetTranscript,
  };
}
