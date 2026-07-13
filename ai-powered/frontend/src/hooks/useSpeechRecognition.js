import { useState, useRef, useCallback } from 'react';

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export function useSpeechRecognition() {
  const [transcript,        setTranscript]        = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isListening,       setIsListening]       = useState(false);
  const recognitionRef = useRef(null);

  const isSupported = !!SpeechRecognition;

  const startListening = useCallback(() => {
    if (!isSupported || isListening) return;

    const recognition = new SpeechRecognition();
    recognition.continuous      = true;   // never auto-stop on silence
    recognition.interimResults  = true;
    recognition.lang            = 'en-US';

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event) => {
      let final   = '';
      let interim = '';
      for (let i = 0; i < event.results.length; i++) {
        // keep raw — filler words, pauses, hesitation intact
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final)   setTranscript((prev) => prev + final);
      if (interim) setInterimTranscript(interim);
    };

    recognition.onerror = (e) => {
      console.error('STT error:', e.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      // do NOT restart — manual stop only
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isSupported, isListening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const resetTranscript = useCallback(() => {
    setTranscript('');
    setInterimTranscript('');
  }, []);

  const getCleanTranscript = useCallback(() => {
    // returns raw transcript — AI evaluates filler words itself
    return transcript.trim();
  }, [transcript]);

  return {
    transcript,
    interimTranscript,
    isListening,
    isSupported,
    startListening,
    stopListening,
    resetTranscript,
    getCleanTranscript,
  };
}
