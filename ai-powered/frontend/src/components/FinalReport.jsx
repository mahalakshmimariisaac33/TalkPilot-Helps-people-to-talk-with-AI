export default function FinalReport({ session, onRestart }) {
  const overall   = session.overallScore ?? 0;
  const readiness = session.readinessPercentage ?? 0;

  const rec = session.hiringRecommendation ?? (overall >= 75 ? 'SELECTED' : overall >= 55 ? 'BORDERLINE' : 'REJECTED');
  const recStyle = rec === 'SELECTED'
    ? { label: 'Selected',   color: '#22c55e', bg: '#22c55e14', border: '#22c55e44' }
    : rec === 'BORDERLINE'
    ? { label: 'Borderline', color: '#eab308', bg: '#eab30814', border: '#eab30844' }
    : { label: 'Rejected',   color: '#f87171', bg: '#f8717114', border: '#f8717144' };

  const scores = [
    { label: 'Overall',    value: session.overallScore,       color: '#22c55e' },
    { label: 'Technical',  value: session.technicalScore,     color: '#4ade80' },
    { label: 'Comms',      value: session.communicationScore, color: '#38bdf8' },
    { label: 'Confidence', value: session.confidenceScore,    color: '#a78bfa' },
  ];

  return (
    <div className="min-h-screen bg-[#080e0a] flex flex-col items-center py-10 px-4 overflow-y-auto font-mono">
      <div className="w-full max-w-3xl space-y-4">

        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#22c55e0f] border border-[#22c55e33] text-[#22c55e] text-[9px] tracking-widest uppercase mb-3">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
            TalkPilot AI — Interview Complete
          </div>
          <h1 className="text-2xl font-bold text-[#e8f5ea] mb-1">Interview Report</h1>
          <p className="text-[10px] tracking-widest uppercase text-[#2d6e3a]">
            {session.candidateName}
            {' · '}
            <span className="text-[#4a8f54]">{session.interviewType}</span>
          </p>
        </div>

        {/* Readiness ring + recommendation */}
        <div className="flex flex-col items-center mb-6 gap-3">
          <ReadinessRing value={readiness} />
          <p className="text-[10px] tracking-widest uppercase text-[#2d6e3a] mt-1">Interview Readiness</p>
          <div
            className="flex items-center gap-2 px-4 py-2 rounded-lg border text-[11px] font-bold tracking-widest uppercase"
            style={{ color: recStyle.color, background: recStyle.bg, borderColor: recStyle.border }}
          >
            Recommendation: {recStyle.label}
          </div>
        </div>

        {/* Score cards */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-2 mb-5">
          {scores.map((s) => <ScoreCard key={s.label} {...s} />)}
        </div>

        {/* Closing remarks */}
        {session.overallFeedback && (
          <div className="w-full bg-[#0c1a0e] border border-[#1a3a20] rounded-lg p-4 mb-4">
            <p className="text-[9px] tracking-widest uppercase text-[#22c55e] mb-2 flex items-center gap-1">
              <span className="text-[#1a3a20]">{'// '}</span>Interviewer's Closing Remarks
            </p>
            <p className="text-[11px] text-[#8fbf96] leading-relaxed italic font-sans">
              "{session.overallFeedback}"
            </p>
          </div>
        )}

        {/* Strengths / Weaknesses */}
        <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <FeedbackBlock title="Strengths"             icon="[+]" color="green" content={session.strengths} />
          <FeedbackBlock title="Areas for Improvement" icon="[!]" color="amber" content={session.weaknesses} />
        </div>

        {/* Recommendations */}
        {session.recommendations && (
          <div className="w-full bg-[#0c1a0e] border border-[#38bdf833] rounded-lg p-4 mb-6">
            <p className="text-[9px] tracking-widest uppercase text-[#38bdf8] mb-3 flex items-center gap-1">
              <span className="text-[#1a3a20]">{'// '}</span>Personalised Recommendations
            </p>
            <ul className="space-y-2">
              {session.recommendations
                .split(/[.\n]/)
                .filter((r) => r.trim().length > 5)
                .map((r, i) => (
                  <li key={i} className="flex gap-2 text-[11px] text-[#8fbf96] font-sans leading-relaxed">
                    <span className="text-[#38bdf8] shrink-0 text-[10px]">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    {r.trim()}
                  </li>
                ))}
            </ul>
          </div>
        )}

        <div className="flex justify-center">
          <button
            onClick={onRestart}
            className="px-8 py-3 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-xs font-bold tracking-widest uppercase transition-opacity"
          >
            ▶ Start New Interview
          </button>
        </div>

      </div>
    </div>
  );
}

function ScoreCard({ label, value, color }) {
  const score = value ?? 0;
  return (
    <div className="relative bg-[#0c1a0e] border border-[#1a3a20] rounded-lg p-3 text-center overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#22c55e44] to-transparent" />
      <p className="text-[9px] tracking-widest uppercase text-[#2d6e3a] mb-1">{label}</p>
      <p className="text-3xl font-bold leading-none mb-2" style={{ color }}>{score}</p>
      <div className="h-0.5 rounded-full bg-[#1a3a20] overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function FeedbackBlock({ title, icon, color, content }) {
  const accent = color === 'green' ? '#22c55e' : '#eab308';
  const border = color === 'green' ? '#22c55e22' : '#eab30822';
  const items  = content ? content.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className="bg-[#0c1a0e] rounded-lg p-4" style={{ border: `0.5px solid ${border}` }}>
      <p className="text-[9px] tracking-widest uppercase mb-3 flex items-center gap-1" style={{ color: accent }}>
        <span className="text-[#1a3a20]">{'// '}</span>
        <span className="font-bold">{icon}</span> {title}
      </p>
      <ul className="space-y-1.5">
        {items.map((item, i) => (
          <li key={i} className="flex gap-2 text-[11px] text-[#8fbf96] font-sans leading-relaxed">
            <span className="shrink-0 font-mono" style={{ color: accent }}>{icon}</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function ReadinessRing({ value }) {
  const radius = 52;
  const circ   = 2 * Math.PI * radius;
  const offset = circ - (value / 100) * circ;
  const color  = value >= 75 ? '#22c55e' : value >= 50 ? '#eab308' : '#f87171';
  const label  = value >= 75 ? 'READY'   : value >= 50 ? 'CLOSE'   : 'PREP';

  return (
    <svg width="120" height="120" viewBox="0 0 140 140">
      <circle cx="70" cy="70" r={radius} fill="none" stroke="#1a3a20" strokeWidth="8" />
      <circle
        cx="70" cy="70" r={radius} fill="none"
        stroke={color} strokeWidth="8"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        strokeLinecap="round"
        transform="rotate(-90 70 70)"
        style={{ transition: 'stroke-dashoffset 1.2s ease' }}
      />
      <text x="70" y="65" textAnchor="middle" fill={color}
        fontSize="22" fontWeight="700" fontFamily="JetBrains Mono, monospace">
        {value}%
      </text>
      <text x="70" y="83" textAnchor="middle" fill="#2d6e3a"
        fontSize="9" fontFamily="JetBrains Mono, monospace" letterSpacing="2">
        {label}
      </text>
    </svg>
  );
}
