/**
 * LiveScorePanel — TalkPilot AI
 * Shows 10-dimension scores + per-answer rich feedback live after each answer.
 */
export default function LiveScorePanel({ scores, exchange, session }) {
  if (!scores && !exchange?.overall10 && !exchange?.answerConfidence) {
    return (
      <div className="p-4 text-center">
        <p className="text-[9px] text-[#1a3a20] tracking-widest uppercase">
          Answer a question to see your TalkPilot analysis
        </p>
      </div>
    );
  }

  const d = scores ?? {};
  const dims = [
    { key: 'technicalAccuracy', label: 'Technical',     val: exchange?.technicalAccuracy ?? d.technical ?? 0,  color: '#4ade80' },
    { key: 'completeness',      label: 'Completeness',  val: exchange?.completeness      ?? d.completeness ?? 0, color: '#34d399' },
    { key: 'communication',     label: 'Comms',         val: exchange?.communication     ?? d.communication ?? 0, color: '#38bdf8' },
    { key: 'confidence',        label: 'Confidence',    val: exchange?.answerConfidence  != null ? Math.round(exchange.answerConfidence / 10) : (d.confidence ?? 0), color: '#a78bfa' },
    { key: 'grammar',           label: 'Grammar',       val: exchange?.grammar           ?? d.grammar ?? 0,    color: '#f472b6' },
    { key: 'vocabulary',        label: 'Vocabulary',    val: exchange?.vocabulary        ?? d.vocabulary ?? 0,  color: '#fb923c' },
    { key: 'fluency',           label: 'Fluency',       val: exchange?.fluency           ?? d.fluency ?? 0,    color: '#facc15' },
    { key: 'problemSolving',    label: 'Problem Solving', val: exchange?.problemSolving  ?? d.problemSolving ?? 0, color: '#2dd4bf' },
  ];
  const overall = exchange?.overall10 ?? d.overall10 ?? 0;
  const quality = exchange?.answerQuality;
  const qualityColor = quality === 'EXCELLENT' ? '#4ade80' : quality === 'GOOD' ? '#34d399' : quality === 'ACCEPTABLE' ? '#eab308' : '#f87171';

  return (
    <div className="p-3 space-y-3 max-h-[420px] overflow-y-auto">

      {/* Overall + quality badge */}
      {(overall > 0 || quality) && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-md bg-[#080e0a] border border-[#1a3a20]">
          <span className="text-[9px] text-[#2d6e3a] tracking-widest uppercase">Overall</span>
          <span className="text-xl font-bold text-[#22c55e] ml-1">{overall}<span className="text-[9px] text-[#2d6e3a]">/10</span></span>
          {quality && (
            <span className="ml-auto text-[9px] font-bold tracking-widest px-2 py-0.5 rounded border"
              style={{ color: qualityColor, borderColor: qualityColor + '44', background: qualityColor + '12' }}>
              {quality}
            </span>
          )}
        </div>
      )}

      {/* 8-dimension grid */}
      <div className="grid grid-cols-2 gap-1.5">
        {dims.map(({ key, label, val, color }) => (
          <div key={key} className="bg-[#080e0a] rounded-md p-2 border border-[#1a3a20]">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[8px] tracking-widest uppercase text-[#2d6e3a]">{label}</span>
              <span className="text-[12px] font-bold" style={{ color }}>{val}<span className="text-[7px] text-[#2d6e3a]">/10</span></span>
            </div>
            <div className="h-0.5 rounded-full bg-[#1a3a20] overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700" style={{ width: `${val * 10}%`, background: color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Detected emotion */}
      {exchange?.detectedEmotion && (
        <div className="flex items-center gap-2 text-[9px]">
          <span className="text-[#1a3a20]">TONE</span>
          <span className="px-2 py-0.5 rounded bg-[#22c55e10] border border-[#22c55e22] text-[#22c55e] tracking-widest uppercase">
            {exchange.detectedEmotion}
          </span>
        </div>
      )}

      {/* Strengths */}
      {exchange?.strengths && (
        <FeedbackBlock icon="[+]" color="#4ade80" title="Strengths" text={exchange.strengths} />
      )}

      {/* Weaknesses */}
      {exchange?.weaknesses && (
        <FeedbackBlock icon="[!]" color="#f87171" title="Weaknesses" text={exchange.weaknesses} />
      )}

      {/* Missing concepts */}
      {exchange?.missingConcepts && (
        <FeedbackBlock icon="[?]" color="#eab308" title="Missing Concepts" text={exchange.missingConcepts} />
      )}

      {/* Improvement tips */}
      {exchange?.improvementTips && (
        <FeedbackBlock icon="[→]" color="#38bdf8" title="Tips" text={exchange.improvementTips} />
      )}

      {/* Sample answer */}
      {exchange?.sampleAnswer && (
        <div className="p-2.5 rounded bg-[#080e0a] border border-[#22c55e22]">
          <p className="text-[8px] tracking-widest uppercase text-[#22c55e] mb-1.5">Sample Answer</p>
          <p className="text-[10px] text-[#4a8f54] leading-relaxed italic">{exchange.sampleAnswer}</p>
        </div>
      )}
    </div>
  );
}

function FeedbackBlock({ icon, color, title, text }) {
  return (
    <div className="p-2 rounded bg-[#080e0a] border" style={{ borderColor: color + '33' }}>
      <p className="text-[8px] tracking-widest uppercase mb-1" style={{ color }}>{icon} {title}</p>
      <p className="text-[10px] text-[#8fbf96] leading-relaxed">{text}</p>
    </div>
  );
}
