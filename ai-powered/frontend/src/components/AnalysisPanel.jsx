export default function AnalysisPanel({ session, latestExchange }) {
  if (!latestExchange?.answerConfidence && !session?.confidenceScore) {
    return (
      <div className="p-6 text-center font-mono">
        <p className="text-xs text-[#2d6e3a] tracking-widest uppercase">
          <span className="text-[#22c55e33]">&gt; </span>
          Awaiting input — answer to begin analysis
        </p>
      </div>
    );
  }

  const scores = session?.interviewComplete
    ? [
        { label: 'Overall Confidence', value: session.confidenceScore },
        { label: 'Communication',      value: session.communicationScore },
      ]
    : [
        { label: 'Confidence', value: latestExchange?.answerConfidence },
        { label: 'Clarity',    value: latestExchange?.clarityScore },
        { label: 'Relevance',  value: latestExchange?.relevanceScore },
      ];

  return (
    <div className="p-4 space-y-3 font-mono">
      <div className="flex items-center gap-2 pb-3 border-b border-[#1a3a20]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
        <h3 className="text-xs font-bold tracking-widest text-[#22c55e] uppercase">
          Analysis Console
        </h3>
        <span className="ml-auto text-[10px] text-[#1a3a20] tracking-wider">
          SESSION_{String(session?.id ?? '00').padStart(2, '0')}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {scores.map((s, i) => (
          <ScoreCard
            key={s.label}
            label={s.label}
            value={s.value}
            wide={scores.length % 2 !== 0 && i === scores.length - 1}
          />
        ))}
      </div>

      {latestExchange?.detectedEmotion && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#080e0a] border border-[#1a3a20] text-xs">
          <span className="text-[#2d6e3a] tracking-wider">TONE_DETECTED</span>
          <span className="px-2 py-0.5 rounded bg-[#22c55e10] text-[#22c55e] font-bold tracking-widest uppercase text-[10px]">
            {latestExchange.detectedEmotion}
          </span>
          <span className="ml-auto text-[#22c55e] animate-pulse">▊</span>
        </div>
      )}

      {session?.overallFeedback && (
        <div className="p-3 rounded-md bg-[#080e0a] border border-[#22c55e20]">
          <p className="text-[9px] tracking-widest text-[#22c55e] uppercase mb-2 flex items-center gap-1">
            <span className="text-[#1a3a20]">{'// '}</span>Final Feedback
          </p>
          <p className="text-xs text-[#8fbf96] leading-relaxed font-sans">
            {session.overallFeedback}
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, wide }) {
  const score = value ?? 0;
  const valueColor = score >= 80 ? 'text-[#22c55e]' : score >= 60 ? 'text-[#84cc16]' : 'text-[#eab308]';
  const barColor   = score >= 80 ? 'bg-[#22c55e]'   : score >= 60 ? 'bg-[#84cc16]'   : 'bg-[#eab308]';

  return (
    <div className={`relative p-3 rounded-md bg-[#080e0a] border border-[#1a3a20] overflow-hidden ${wide ? 'col-span-2' : ''}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22c55e30] to-transparent" />
      <p className="text-[9px] tracking-widest text-[#2d6e3a] uppercase mb-1">{label}</p>
      <p className={`text-3xl font-bold leading-none mb-2 ${valueColor}`}>{score}</p>
      <div className="h-0.5 rounded-full bg-[#1a3a20] overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${score}%` }} />
      </div>
    </div>
  );
}
