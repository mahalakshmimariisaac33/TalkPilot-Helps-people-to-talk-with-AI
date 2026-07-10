import { useEffect, useRef, useState } from 'react';

/**
 * UserWebcam — only requests camera when `activate` prop turns true.
 * This ensures it's called after a user gesture (Start Interview click),
 * so the browser grants permission without issues.
 */
export default function UserWebcam({ activate }) {
  const videoRef  = useRef(null);
  const streamRef = useRef(null);
  const [hasCamera, setHasCamera] = useState(false);
  const [error, setError]         = useState(null);
  const [requested, setRequested] = useState(false);

  useEffect(() => {
    if (!activate || requested) return;
    setRequested(true);

    async function startCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(() => {});
          setHasCamera(true);
        }
      } catch {
        setError('Camera unavailable or denied');
        setHasCamera(false);
      }
    }

    startCamera();

    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [activate, requested]);

  return (
    <div className="relative w-full h-full bg-[#080e0a] overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="absolute inset-0 w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)', display: hasCamera ? 'block' : 'none' }}
      />

      {/* Placeholder */}
      {!hasCamera && (
        <div className="flex flex-col items-center justify-center w-full h-full gap-2">
          <div className="w-10 h-10 rounded-full bg-[#0c1a0e] border border-[#1a3a20] flex items-center justify-center">
            <svg className="w-5 h-5 fill-[#2d6e3a]" viewBox="0 0 24 24">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </div>
          <p className="text-[9px] text-[#2d6e3a] tracking-wider text-center px-2">
            {error || (activate ? 'Starting camera...' : 'Camera off')}
          </p>
        </div>
      )}

      {/* Corner brackets when live */}
      {hasCamera && (
        <>
          <span className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-[#22c55e55]" />
          <span className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-[#22c55e55]" />
          <span className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-[#22c55e55]" />
          <span className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-[#22c55e55]" />
        </>
      )}

      {/* YOU label */}
      <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 border border-[#1a3a20] text-[8px] text-[#8fbf96] tracking-widest z-10">
        YOU
      </div>

      {/* LIVE dot */}
      {hasCamera && (
        <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/60 border border-[#22c55e33] z-10">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
          <span className="text-[8px] text-[#22c55e] tracking-widest">LIVE</span>
        </div>
      )}
    </div>
  );
}
