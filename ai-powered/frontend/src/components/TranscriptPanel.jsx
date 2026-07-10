import { useEffect, useRef } from "react";

export default function TranscriptionPanel({
  exchanges = [],
  liveTranscript = "",
  interimTranscript = "",
  currentQuestion = "",
}) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [exchanges, liveTranscript, interimTranscript, currentQuestion]);

  const questionCount = exchanges.length + (currentQuestion ? 1 : 0);

  return (
    <div className="flex flex-col h-full bg-[#0c1a0e] border border-[#1a3a20] rounded-xl overflow-hidden font-mono">
      {/* Header */}
      <div className="px-4 py-2.5 border-b border-[#1a3a20] bg-[#080e0a] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[9px] tracking-widest uppercase text-[#2d6e3a]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e]" />
          <span>$ live_transcript</span>
        </div>

        <span className="text-[9px] text-[#1a3a20] tracking-wider">
          Q {questionCount}
        </span>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {exchanges.map((ex, i) => (
          <div
            key={ex.id ?? ex.sequenceNumber ?? i}
            className="space-y-2"
          >
            {/* HR Question */}
            <div className="flex gap-2 items-start">
              <Avatar role="HR" />
              <p className="text-[11px] text-[#c8f0cd] leading-relaxed pt-0.5">
                {ex.question}
              </p>
            </div>

            {/* User Answer */}
            {ex.answer && (
              <div className="flex gap-2 items-start ml-2">
                <Avatar role="You" />
                <p className="text-[11px] text-[#8ecf96] leading-relaxed pt-0.5">
                  {ex.answer}
                </p>
              </div>
            )}

            {/* AI Feedback */}
            {ex.aiFeedback && (
              <p className="text-[10px] text-[#22c55e99] italic ml-[30px] border-l-2 border-[#22c55e22] pl-2">
                ✦ {ex.aiFeedback}
              </p>
            )}

            {i < exchanges.length - 1 && (
              <div className="h-px bg-[#1a3a2044]" />
            )}
          </div>
        ))}

        {/* Current Question */}
        {currentQuestion &&
          !exchanges.some(
            (e) => e.question === currentQuestion && e.answer
          ) && (
            <div className="space-y-2">
              <div className="flex gap-2 items-start">
                <Avatar role="HR" />
                <p className="text-[11px] text-[#22c55e] animate-pulse">
                  {currentQuestion}
                </p>
              </div>
            </div>
          )}

        {/* Live Transcript */}
        {(liveTranscript || interimTranscript) && (
          <div className="border-t border-[#1a3a2044] pt-3">
            <div className="flex gap-2 items-start">
              <Avatar role="You" />

              <p className="text-[11px] text-white leading-relaxed">
                {liveTranscript}
                {interimTranscript && (
                  <span className="text-[#2d6e3a]">
                    {" "}
                    {interimTranscript}
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-[#1a3a20] bg-[#080e0a] flex gap-4 text-[9px] tracking-wider text-[#1a3a20]">
        <span>
          <span className="text-[#2d6e3a]">MIC</span> active
        </span>

        <span>
          <span className="text-[#2d6e3a]">STT</span> streaming
        </span>

        {questionCount > 0 && (
          <span>
            <span className="text-[#2d6e3a]">Q{questionCount}</span> in progress
          </span>
        )}
      </div>
    </div>
  );
}

function Avatar({ role }) {
  const isHR = role === "HR";

  return (
    <span
      className={`shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center text-[8px] font-bold border ${
        isHR
          ? "bg-[#22c55e14] border-[#22c55e33] text-[#22c55e]"
          : "bg-[#1a3a20] border-[#1e4a25] text-[#4a8f54]"
      }`}
    >
      {role}
    </span>
  );
}