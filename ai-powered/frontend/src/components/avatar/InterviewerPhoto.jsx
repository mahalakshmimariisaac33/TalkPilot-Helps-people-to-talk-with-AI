import { useEffect, useRef, useState } from 'react';

/**
 * Realistic photo-based interviewer with:
 * - Eye blinking (random interval 2-5s)
 * - Subtle breathing (scale animation)
 * - Speaking animation (lip-sync overlay shimmer)
 * - Slight head sway while listening
 * - Eye contact glow effect
 */
export default function InterviewerPhoto({ gender, isSpeaking, isListening, emotion }) {
  const [blink, setBlink] = useState(false);
  const [breathPhase, setBreathPhase] = useState(0);
  const blinkRef = useRef(null);
  const breathRef = useRef(null);

  // Randomly blink every 2–5 seconds
  useEffect(() => {
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      blinkRef.current = setTimeout(() => {
        setBlink(true);
        setTimeout(() => {
          setBlink(false);
          scheduleBlink();
        }, 130);
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(blinkRef.current);
  }, []);

  // Breathing cycle
  useEffect(() => {
    let frame;
    const animate = () => {
      setBreathPhase((p) => (p + 0.008) % (Math.PI * 2));
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  const breathScale = 1 + Math.sin(breathPhase) * 0.005;
  const headSway = isListening ? Math.sin(breathPhase * 0.7) * 1.2 : 0;

  const src =
    gender === 'FEMALE'
      ? '/images/female-interviewer.png'
      : '/images/male-interviewer.png';

  const emotionGlow = {
    welcoming: 'rgba(99,179,237,0.18)',
    attentive: 'rgba(66,153,225,0.12)',
    encouraging: 'rgba(72,187,120,0.15)',
    impressed: 'rgba(246,173,85,0.15)',
    closing: 'rgba(159,122,234,0.15)',
    neutral: 'rgba(66,153,225,0.10)',
  };

  const glowColor = emotionGlow[emotion] || emotionGlow.neutral;

  return (
    <div className="relative w-full h-full flex items-end justify-center overflow-hidden select-none">
      {/* Office background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, #1a2f4a 0%, #162540 40%, #1e3552 70%, #243d5c 100%)',
        }}
      />

      {/* Bookshelf / backdrop detail */}
      <div className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(90deg, transparent, transparent 48px, rgba(255,255,255,0.04) 48px, rgba(255,255,255,0.04) 50px)',
        }}
      />

      {/* Desk surface at bottom */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[18%] rounded-t-[60%]"
        style={{
          background: 'linear-gradient(180deg, #3d2817 0%, #2a1c0f 100%)',
          boxShadow: '0 -4px 24px rgba(0,0,0,0.6)',
        }}
      />

      {/* Desk reflection line */}
      <div
        className="absolute bottom-[17%] left-[10%] right-[10%] h-[1px]"
        style={{ background: 'rgba(255,255,255,0.08)' }}
      />

      {/* Ambient desk lamp glow */}
      <div
        className="absolute bottom-[15%] left-1/2 -translate-x-1/2 w-[60%] h-[30%] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center bottom, rgba(255,220,150,0.08) 0%, transparent 70%)',
        }}
      />

      {/* Interviewer photo — breathing + head sway */}
      <div
        className="relative z-10 flex items-end justify-center"
        style={{
          transform: `scale(${breathScale}) rotate(${headSway * 0.15}deg)`,
          transition: 'transform 0.1s ease-out',
          transformOrigin: 'bottom center',
          height: '92%',
          width: '100%',
        }}
      >
        <img
          src={src}
          alt="Interviewer"
          draggable={false}
          style={{
            height: '100%',
            width: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            userSelect: 'none',
            filter: `brightness(0.97) contrast(1.02) drop-shadow(0 8px 32px rgba(0,0,0,0.5))`,
          }}
        />

        {/* Emotion ambient glow overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-700"
          style={{ background: `radial-gradient(ellipse at 50% 30%, ${glowColor} 0%, transparent 65%)` }}
        />

        {/* Eye blink overlay — covers just the eye region */}
        {blink && (
          <div
            className="absolute pointer-events-none"
            style={{
              top: gender === 'FEMALE' ? '22%' : '20%',
              left: '20%',
              right: '20%',
              height: '7%',
              background: 'rgba(20, 30, 45, 0.88)',
              borderRadius: '50%',
              filter: 'blur(2px)',
            }}
          />
        )}

        {/* Speaking lip animation overlay */}
        {isSpeaking && (
          <div
            className="absolute pointer-events-none"
            style={{
              bottom: gender === 'FEMALE' ? '38%' : '36%',
              left: '30%',
              right: '30%',
              height: '3.5%',
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.07)',
              animation: 'lipSync 0.18s ease-in-out infinite alternate',
            }}
          />
        )}
      </div>

      {/* Listening indicator: subtle head movement ring */}
      {isListening && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '45%',
            paddingBottom: '45%',
            borderRadius: '50%',
            border: '1.5px solid rgba(99,179,237,0.18)',
            animation: 'pulse 2.5s ease-in-out infinite',
          }}
        />
      )}

      {/* Speaking pulse ring */}
      {isSpeaking && (
        <div
          className="absolute z-20 pointer-events-none"
          style={{
            top: '8%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '45%',
            paddingBottom: '45%',
            borderRadius: '50%',
            border: '1.5px solid rgba(72,187,120,0.22)',
            animation: 'pulse 1.2s ease-in-out infinite',
          }}
        />
      )}

      <style>{`
        @keyframes lipSync {
          from { transform: scaleY(0.6); opacity: 0.5; }
          to   { transform: scaleY(1.4); opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 0.4; transform: translateX(-50%) scale(1); }
          50%      { opacity: 0.1; transform: translateX(-50%) scale(1.08); }
        }
      `}</style>
    </div>
  );
}
