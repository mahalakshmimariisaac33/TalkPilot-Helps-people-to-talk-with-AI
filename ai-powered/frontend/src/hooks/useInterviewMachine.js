/**
 * useInterviewMachine
 * Central state machine for the interview flow.
 * States: idle → requesting_permissions → interviewer_speaking →
 *         candidate_answering → analyzing_answer →
 *         generating_question → interview_completed
 *
 * All speech/mic coordination lives here so InterviewRoom stays declarative.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSpeechRecognition } from './useSpeechRecognition';
import { useSpeechSynthesis }   from './useSpeechSynthesis';
import { useInterviewTimer }    from './useInterviewTimer';
import { submitAnswer, concludeInterview } from '../api/interviewApi';

export const STATE = {
  IDLE:                  'idle',
  REQUESTING_PERMISSIONS:'requesting_permissions',
  INTERVIEWER_SPEAKING:  'interviewer_speaking',
  CANDIDATE_ANSWERING:   'candidate_answering',
  ANALYZING_ANSWER:      'analyzing_answer',
  GENERATING_QUESTION:   'generating_question',
  INTERVIEW_COMPLETED:   'interview_completed',
};

export function useInterviewMachine(initialSession) {
  const [state,   setState]   = useState(STATE.IDLE);
  const [session, setSession] = useState(initialSession);
  const [emotion, setEmotion] = useState(initialSession?.interviewerEmotion || 'welcoming');
  const [error,   setError]   = useState(null);

  // Per-answer live scores displayed in the analysis panel (scale 1-10)
  const [liveScores, setLiveScores] = useState(null);

  const stateRef      = useRef(state);
  const concludingRef = useRef(false);

  useEffect(() => { stateRef.current = state; }, [state]);

  /* ── Speech hooks ─────────────────────────────────────────────────────── */
  const {
    transcript, interimTranscript, isListening,
    isSupported: sttSupported,
    startListening, stopListening, getCleanTranscript, resetTranscript,
  } = useSpeechRecognition();

  const { speak, cancel, isSpeaking } = useSpeechSynthesis({
    gender: session?.interviewerGender,
    rate:   session?.speakingSpeed,
  });

  /* ── Auto-conclude at 15 min ─────────────────────────────────────────── */
  const handleMaxReached = useCallback(async () => {
    if (concludingRef.current || stateRef.current === STATE.INTERVIEW_COMPLETED) return;
    concludingRef.current = true;
    stopListening(); cancel();
    setState(STATE.ANALYZING_ANSWER);
    try {
      const updated = await concludeInterview(session.id);
      setSession(updated); setEmotion('closing');
      setState(STATE.INTERVIEWER_SPEAKING);
      if (updated.overallFeedback) await speak(updated.overallFeedback);
      setState(STATE.INTERVIEW_COMPLETED);
    } catch (err) {
      setError(err.message); concludingRef.current = false;
      setState(STATE.CANDIDATE_ANSWERING);
    }
  }, [session?.id, stopListening, cancel, speak]);

  const { formatted: timerDisplay, elapsedMinutes } = useInterviewTimer(
    state !== STATE.IDLE && state !== STATE.REQUESTING_PERMISSIONS &&
    session?.status === 'IN_PROGRESS',
    session?.startedAt,
    handleMaxReached
  );

  /* ── Core: speak a question then open mic ────────────────────────────── */
  const speakQuestion = useCallback(async (question, newEmotion) => {
    if (!question) return;
    setState(STATE.INTERVIEWER_SPEAKING);
    setEmotion(newEmotion || 'attentive');
    resetTranscript();
    await speak(question);              // resolves 400ms after speech ends
    setState(STATE.CANDIDATE_ANSWERING);
    startListening();                   // mic opens only after audio pipeline closes
  }, [speak, resetTranscript, startListening]);

  /* ── Start: request permissions then kick off first question ─────────── */
  const start = useCallback(async () => {
    setState(STATE.REQUESTING_PERMISSIONS);
    // Camera/mic are requested in UserWebcam on its own activate prop.
    // We just transition immediately — the browser will show the prompt.
    if (initialSession?.currentQuestion) {
      await speakQuestion(initialSession.currentQuestion, initialSession.interviewerEmotion);
    } else {
      setState(STATE.CANDIDATE_ANSWERING);
    }
  }, [initialSession, speakQuestion]);

  /* ── Submit answer ───────────────────────────────────────────────────── */
  const submitCurrentAnswer = useCallback(async () => {
    if (concludingRef.current) return;
    stopListening();
    const answer = getCleanTranscript();
    if (!answer || answer.length < 3) {
      setError('Please speak your answer before submitting.');
      startListening();
      return;
    }
    setError(null);
    setState(STATE.ANALYZING_ANSWER);

    try {
      const updated = await submitAnswer(session.id, answer);
      setSession(updated);

      // Extract per-answer scores (0-100 from backend → convert to 1-10)
      const latest = updated.exchanges?.filter((e) => e.answer)?.slice(-1)[0];
      if (latest) {
        setLiveScores({
          technical:     Math.round((latest.relevanceScore  ?? 70) / 10),
          communication: Math.round((latest.clarityScore    ?? 70) / 10),
          confidence:    Math.round((latest.answerConfidence ?? 70) / 10),
          fluency:       Math.round(((latest.clarityScore ?? 70) + (latest.answerConfidence ?? 70)) / 20),
        });
      }

      if (updated.interviewComplete) {
        setEmotion('closing');
        setState(STATE.INTERVIEWER_SPEAKING);
        if (updated.overallFeedback) await speak(updated.overallFeedback);
        setState(STATE.INTERVIEW_COMPLETED);
        return;
      }

      setState(STATE.GENERATING_QUESTION);
      await speakQuestion(updated.currentQuestion, updated.interviewerEmotion);
    } catch (err) {
      setError(err.message);
      setState(STATE.CANDIDATE_ANSWERING);
      startListening();
    }
  }, [session?.id, stopListening, getCleanTranscript, startListening, speak, speakQuestion]);

  /* ── Manual end session ──────────────────────────────────────────────── */
  const endSession = useCallback(async () => {
    if (concludingRef.current) return;
    concludingRef.current = true;
    stopListening(); cancel();
    setState(STATE.ANALYZING_ANSWER);
    try {
      const updated = await concludeInterview(session.id);
      setSession(updated); setEmotion('closing');
      setState(STATE.INTERVIEWER_SPEAKING);
      if (updated.overallFeedback) await speak(updated.overallFeedback);
      setState(STATE.INTERVIEW_COMPLETED);
    } catch (err) {
      setError(err.message); concludingRef.current = false;
      setState(STATE.CANDIDATE_ANSWERING);
    }
  }, [session?.id, stopListening, cancel, speak]);

  // Cleanup on unmount
  useEffect(() => () => cancel(), []); // eslint-disable-line

  return {
    // State
    state, session, emotion, error, liveScores,
    // Speech state
    isSpeaking, isListening, sttSupported,
    transcript, interimTranscript,
    // Timer
    timerDisplay, elapsedMinutes,
    // Actions
    start, submitCurrentAnswer, endSession,
    // Helpers
    canEnd: elapsedMinutes >= 10,
  };
}
