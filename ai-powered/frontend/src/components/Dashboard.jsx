const DIFFICULTY_LABEL = {
  EASY: { text: 'Easy', color: '#22c55e' },
  MEDIUM: { text: 'Medium', color: '#eab308' },
  HARD: { text: 'Hard', color: '#ef4444' },
};

export default function Dashboard({ userStatus, onSelectMode }) {
  const diff = DIFFICULTY_LABEL[userStatus.nextPracticeDifficulty] || DIFFICULTY_LABEL.EASY;

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080e0a] font-mono">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#22c55e0c] border border-[#22c55e33] text-[#22c55e] text-[9px] tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
            Dashboard
          </div>
          <h1 className="text-2xl font-bold text-[#e8f5ea] tracking-tight mb-1">
            {userStatus.greeting}
          </h1>
          <p className="text-[11px] text-[#2d6e3a] font-sans">
            Choose how you want to prepare today.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Practice card */}
          <button
            onClick={() => onSelectMode('PRACTICE')}
            className="text-left bg-[#0c1a0e] border border-[#1a3a20] hover:border-[#22c55e55] rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] tracking-widest uppercase text-[#2d6e3a]">Practice</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ color: diff.color, backgroundColor: `${diff.color}18` }}>
                {diff.text}
              </span>
            </div>
            <h2 className="text-[#e8f5ea] font-bold text-base mb-2 group-hover:text-[#22c55e] transition-colors">
              Daily Practice
            </h2>
            <p className="text-[11px] text-[#4a8f54] font-sans leading-relaxed mb-3">
              15-minute timed session. Unlimited retakes. Difficulty ramps up as you build a streak.
            </p>
            <ul className="text-[10px] text-[#2d6e3a] font-sans space-y-1">
              <li>• Day {userStatus.practiceDayNumber} of your practice streak</li>
              <li>• Follow-up questions probe shallow answers</li>
              <li>• Restart anytime — this is judgment-free</li>
            </ul>
          </button>

          {/* Real Experience card */}
          <button
            onClick={() => onSelectMode('REAL')}
            className="text-left bg-[#0c1a0e] border border-[#1a3a20] hover:border-[#ef444455] rounded-xl p-5 transition-colors group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[9px] tracking-widest uppercase text-[#2d6e3a]">Real Experience</span>
              <span className="px-2 py-0.5 rounded text-[9px] font-bold text-[#ef4444] bg-[#ef444418]">
                Hard
              </span>
            </div>
            <h2 className="text-[#e8f5ea] font-bold text-base mb-2 group-hover:text-[#f87171] transition-colors">
              Real Interview Simulation
            </h2>
            <p className="text-[11px] text-[#4a8f54] font-sans leading-relaxed mb-3">
              One serious attempt, based on your resume. No re-asks, no restarts — just like the real thing.
            </p>
            <ul className="text-[10px] text-[#2d6e3a] font-sans space-y-1">
              <li>• Questions reference your actual skills/projects</li>
              <li>• No leniency on vague answers</li>
              <li>• {userStatus.realSessionCount} attempt{userStatus.realSessionCount === 1 ? '' : 's'} completed so far</li>
            </ul>
          </button>
        </div>
      </div>
    </div>
  );
}
