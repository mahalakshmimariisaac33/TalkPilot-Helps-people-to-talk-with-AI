export default function AnalysisPanel({ session, latestExchange }) {
  if (!latestExchange?.answerConfidence && !session?.confidenceScore) {
    return (
      <div className="p-6 text-center font-mono">
        <p className="text-xs text-corporate-400 tracking-widest uppercase">
          <span className="text-accent/40">&gt; </span>
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
      <div className="flex items-center gap-2 pb-3 border-b border-corporate-700">
        <span className="w-1.5 h-1.5 rounded-full bg-accent recording-dot" />
        <h3 className="text-xs font-bold tracking-widest text-accent uppercase">
          Analysis Console
        </h3>
        <span className="ml-auto text-[10px] text-corporate-700 tracking-wider">
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
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-corporate-800 border border-corporate-700 text-xs">
          <span className="text-corporate-400 tracking-wider">TONE_DETECTED</span>
          <span className="px-2 py-0.5 rounded bg-accent/10 text-accent font-bold tracking-widest uppercase text-[10px]">
            {latestExchange.detectedEmotion}
          </span>
          <span className="ml-auto text-accent animate-pulse">▊</span>
        </div>
      )}

      {session?.overallFeedback && (
        <div className="p-3 rounded-md bg-corporate-800 border border-accent/20">
          <p className="text-[9px] tracking-widest text-accent uppercase mb-2 flex items-center gap-1">
            <span className="text-corporate-400">{'// '}</span>Final Feedback
          </p>
          <p className="text-xs text-corporate-100 leading-relaxed font-sans">
            {session.overallFeedback}
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreCard({ label, value, wide }) {
  const score = value ?? 0;
  const tier =
    score >= 80 ? 'high' : score >= 60 ? 'mid' : 'low';
  const valueColor =
    tier === 'high' ? 'text-accent' :
    tier === 'mid'  ? 'text-lime-400' : 'text-yellow-400';
  const barColor =
    tier === 'high' ? 'bg-accent' :
    tier === 'mid'  ? 'bg-lime-400' : 'bg-yellow-400';

  return (
    <div className={`relative p-3 rounded-md bg-corporate-800 border border-corporate-700 overflow-hidden ${wide ? 'col-span-2' : ''}`}>
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
      <p className="text-[9px] tracking-widest text-corporate-400 uppercase mb-1">{label}</p>
      <p className={`text-3xl font-bold leading-none mb-2 ${valueColor}`}>{score}</p>
      <div className="h-0.5 rounded-full bg-corporate-700 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${barColor}`}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}