import { useState } from 'react';

const MODE_INFO = {
  PRACTICE: { label: 'Practice Session', color: '#22c55e', note: '15-min timed practice · unlimited retakes' },
  REAL: { label: 'Real Interview Simulation', color: '#ef4444', note: 'One serious attempt · no re-asks' },
};

export default function SetupScreen({ onStart, loading, mode = 'PRACTICE', onBack }) {
  const modeInfo = MODE_INFO[mode] || MODE_INFO.PRACTICE;
  const [form, setForm] = useState({
    candidateName:     '',
    jobRole:           'Software Engineer',
    interviewType:     'HR',
    interviewerGender: Math.random() < 0.5 ? 'MALE' : 'FEMALE',
    speakingSpeed:     1.0,
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.candidateName.trim()) return;
    onStart({ ...form, mode });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080e0a] font-mono">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-7">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="text-[10px] text-[#2d6e3a] hover:text-[#4a8f54] mb-3 underline"
            >
              ← Back to dashboard
            </button>
          )}
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded border text-[9px] tracking-widest uppercase mb-4"
            style={{ backgroundColor: `${modeInfo.color}10`, borderColor: `${modeInfo.color}33`, color: modeInfo.color }}
          >
            <span className="w-1.5 h-1.5 rounded-full recording-dot" style={{ backgroundColor: modeInfo.color }} />
            {modeInfo.label}
          </div>
          <h1 className="text-2xl font-bold text-[#e8f5ea] tracking-tight mb-1">
            Interview<span className="text-[#22c55e]">Pilot</span> AI
          </h1>
          <p className="text-[11px] text-[#2d6e3a] leading-relaxed font-sans">
            {modeInfo.note}
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="bg-[#0c1a0e] border border-[#1a3a20] rounded-xl p-6 space-y-4"
        >
          {/* Name */}
          <Field label="Candidate Name">
            <input
              type="text"
              required
              value={form.candidateName}
              onChange={(e) => setForm({ ...form, candidateName: e.target.value })}
              placeholder="Enter your full name"
              className="w-full px-3 py-2 rounded-md bg-[#080e0a] border border-[#1a3a20] text-[#c8f0cd] text-xs placeholder-[#1a3a20] focus:outline-none focus:border-[#22c55e66] transition-colors"
            />
          </Field>

          {/* Role */}
          <Field label="Target Role">
            <input
              type="text"
              required
              value={form.jobRole}
              onChange={(e) => setForm({ ...form, jobRole: e.target.value })}
              className="w-full px-3 py-2 rounded-md bg-[#080e0a] border border-[#1a3a20] text-[#c8f0cd] text-xs focus:outline-none focus:border-[#22c55e66] transition-colors"
            />
          </Field>

          {/* Interview type */}
          <Field label="Interview Type">
            <div className="grid grid-cols-2 gap-2">
              {['HR', 'TECHNICAL'].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setForm({ ...form, interviewType: type })}
                  className={`py-2 rounded-md text-[10px] font-bold tracking-widest uppercase border transition-all
                    ${form.interviewType === type
                      ? 'bg-[#22c55e0f] border-[#22c55e44] text-[#22c55e]'
                      : 'bg-[#080e0a] border-[#1a3a20] text-[#2d6e3a] hover:border-[#22c55e22] hover:text-[#4a8f54]'}`}
                >
                  [ {type === 'HR' ? 'HR' : 'Technical'} ]
                </button>
              ))}
            </div>
          </Field>

          {/* Interviewer voice */}
          <Field label="Interviewer Voice">
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: 'MALE',   label: '♂  Male'   },
                { value: 'FEMALE', label: '♀  Female' },
              ].map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, interviewerGender: value })}
                  className={`py-2 rounded-md text-[10px] font-bold tracking-widest uppercase border transition-all
                    ${form.interviewerGender === value
                      ? 'bg-[#22c55e0f] border-[#22c55e44] text-[#22c55e]'
                      : 'bg-[#080e0a] border-[#1a3a20] text-[#2d6e3a] hover:border-[#22c55e22] hover:text-[#4a8f54]'}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </Field>

          {/* Speaking speed */}
          <Field label="Speaking Speed" value={`${form.speakingSpeed.toFixed(1)}x`}>
            <div className="flex items-center gap-3">
              <span className="text-[9px] text-[#1a3a20]">0.5x</span>
              <input
                type="range"
                min="0.5" max="2" step="0.1"
                value={form.speakingSpeed}
                onChange={(e) => setForm({ ...form, speakingSpeed: parseFloat(e.target.value) })}
                className="flex-1 accent-[#22c55e] h-0.5"
              />
              <span className="text-[9px] text-[#1a3a20]">2.0x</span>
            </div>
          </Field>

          {/* Divider */}
          <div className="h-px bg-[#1a3a20]" />

          {mode === 'REAL' && (
            <div className="px-3 py-2 rounded-md bg-[#ef444410] border border-[#ef444433] text-[#f87171] text-[10px] font-sans leading-relaxed">
              This is a real-attempt simulation — vague answers won't get a second chance, and the session can't be restarted once it begins.
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[11px] font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
              <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
            </svg>
            {loading ? 'Preparing interview room...' : 'Enter Interview Room'}
          </button>
        </form>

        {/* Footer note */}
        <p className="text-center text-[9px] text-[#1a3a20] tracking-wider mt-4 leading-relaxed">
          <span className="text-[#2d6e3a]">MIC</span> required ·{' '}
          <span className="text-[#2d6e3a]">CAM</span> optional · best in{' '}
          <span className="text-[#2d6e3a]">Chrome</span> or{' '}
          <span className="text-[#2d6e3a]">Edge</span>
        </p>
      </div>
    </div>
  );
}

function Field({ label, value, children }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-[#2d6e3a]">
          <span className="text-[#22c55e33]">$</span>
          {label}
        </label>
        {value && (
          <span className="text-[10px] font-bold text-[#22c55e]">{value}</span>
        )}
      </div>
      {children}
    </div>
  );
}