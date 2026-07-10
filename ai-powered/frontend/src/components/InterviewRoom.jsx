import { useState } from 'react';
import AvatarScene from './avatar/AvatarScene';
import UserWebcam  from './UserWebcam';
import TranscriptPanel from './TranscriptPanel';
import LiveScorePanel  from './LiveScorePanel';
import FinalReport     from './FinalReport';
import { useInterviewMachine, STATE } from '../hooks/useInterviewMachine';

export default function InterviewRoom({ session: initialSession, onRestart }) {
  const [showReport, setShowReport] = useState(false);

  const {
    state, session, emotion, error, liveScores,
    isSpeaking, isListening, sttSupported,
    transcript, interimTranscript,
    timerDisplay, elapsedMinutes,
    start, submitCurrentAnswer, endSession,
    canEnd,
  } = useInterviewMachine(initialSession);

  if (state === STATE.INTERVIEW_COMPLETED && showReport)
    return <FinalReport session={session} onRestart={onRestart} />;

  if (state === STATE.IDLE)
    return <PreStartScreen session={initialSession} onStart={start} />;

  const isActive       = state !== STATE.IDLE && state !== STATE.INTERVIEW_COMPLETED;
  const isBusy         = state === STATE.ANALYZING_ANSWER || state === STATE.GENERATING_QUESTION;
  const latestExchange = session.exchanges?.filter((e) => e.answer)?.slice(-1)[0];

  return (
    <div className="h-screen flex flex-col bg-[#080e0a] font-mono overflow-hidden">

      {/* Header */}
      <header className="flex items-center justify-between px-5 py-2 border-b border-[#1a3a20] bg-[#0a120b] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-[#22c55e14] border border-[#22c55e33] flex items-center justify-center text-[10px] font-bold text-[#22c55e]">IP</div>
          <div>
            <p className="text-[12px] font-bold text-[#e8f5ea] leading-none">InterviewPilot AI</p>
            <p className="text-[9px] text-[#2d6e3a] tracking-widest mt-0.5 uppercase">
              {session.interviewType} · {session.jobRole}
              {session.difficulty && (
                <span className={`ml-2 ${session.difficulty === 'HARD' ? 'text-[#f87171]' : session.difficulty === 'MEDIUM' ? 'text-[#eab308]' : 'text-[#22c55e]'}`}>
                  · {session.difficulty}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-[#0c1a0e] border border-[#1a3a20] text-[11px] font-bold tabular-nums ${elapsedMinutes >= 13 ? 'text-[#f87171]' : 'text-[#c8f0cd]'}`}>
            <svg className="w-3 h-3 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {timerDisplay}
          </div>
          <StateBadge state={state} isSpeaking={isSpeaking} isListening={isListening} />
          {isActive && (
            <button onClick={endSession} disabled={!canEnd || isBusy}
              title={canEnd ? 'End & generate report' : 'Available after 10 minutes'}
              className={`px-2.5 py-1.5 rounded text-[9px] font-bold tracking-widest uppercase border transition-all
                ${canEnd && !isBusy ? 'bg-[#f8717114] border-[#f8717144] text-[#f87171] hover:bg-[#f8717122] cursor-pointer'
                                    : 'bg-[#0c1a0e] border-[#1a3a20] text-[#1a3a20] cursor-not-allowed'}`}>
              End Session
            </button>
          )}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-2 p-2 min-h-0 overflow-hidden">

        {/* Interviewer panel — 2/3 width */}
        <div className="lg:col-span-2 relative flex flex-col min-h-0">
          <div className={`flex-1 rounded-lg border border-[#1a3a20] overflow-hidden relative bg-[#0c1a0e] ${isSpeaking ? 'ring-1 ring-[#22c55e33]' : ''}`}
            style={{ transition: 'box-shadow 0.4s' }}>

            {/* Speaking animation wrapper */}
            <div className="w-full h-full" style={isSpeaking ? {animation:'speakPulse 2s ease-in-out infinite'} : {}}>
              <AvatarScene
                gender={session.interviewerGender}
                isSpeaking={isSpeaking}
                isListening={state === STATE.CANDIDATE_ANSWERING}
                emotion={emotion}
              />
            </div>

            {/* Interviewer label */}
            <div className="absolute bottom-4 left-4 flex items-center gap-1.5 px-2.5 py-1.5 rounded bg-black/70 backdrop-blur border border-[#1a3a20] text-[10px] text-[#8fbf96]">
              <span className={`w-1.5 h-1.5 rounded-full ${isSpeaking ? 'bg-[#22c55e] recording-dot' : 'bg-[#1a3a20]'}`} />
              Senior HR Recruiter
            </div>

            {/* Audio wave bars while speaking */}
            {isSpeaking && (
              <div className="absolute bottom-[18px] right-4 flex items-end gap-[3px] h-5">
                {[2,4,6,5,4,3,2].map((h, i) => (
                  <div key={i} className="w-[3px] rounded-full bg-[#22c55e]"
                    style={{height:`${h*3}px`,animation:`soundBar 0.5s ease-in-out ${i*0.08}s infinite alternate`,opacity:0.85}} />
                ))}
              </div>
            )}

            {/* Listening ring while candidate speaks */}
            {state === STATE.CANDIDATE_ANSWERING && (
              <div className="absolute inset-0 pointer-events-none rounded-lg"
                style={{boxShadow:'inset 0 0 0 1.5px rgba(56,189,248,0.25)'}} />
            )}
          </div>

          {/* Candidate webcam PiP — 320×180, landscape, bottom-right */}
          <div className="absolute bottom-4 right-4 z-20"
            style={{width:'320px',height:'180px',borderRadius:'12px',border:'1.5px solid rgba(34,197,94,0.35)',overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.6)'}}>
            <UserWebcam activate={state !== STATE.IDLE} />
          </div>
        </div>

        {/* Right panel — transcript + analysis */}
        <div className="flex flex-col gap-2 min-h-0 overflow-hidden">
          <div className="flex-1 bg-[#0c1a0e] border border-[#1a3a20] rounded-lg overflow-hidden flex flex-col min-h-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a3a20] shrink-0">
              <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-[#22c55e] recording-dot' : 'bg-[#1a3a20]'}`} />
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#22c55e]">Live Transcript</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              <TranscriptPanel
                exchanges={session.exchanges || []}
                liveTranscript={state === STATE.CANDIDATE_ANSWERING ? transcript : ''}
                interimTranscript={interimTranscript}
                currentQuestion={session.currentQuestion}
              />
            </div>
          </div>
          <div className="bg-[#0c1a0e] border border-[#1a3a20] rounded-lg overflow-hidden shrink-0">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#1a3a20]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
              <span className="text-[9px] font-bold tracking-widest uppercase text-[#22c55e]">Real-time Analysis</span>
            </div>
            <LiveScorePanel scores={liveScores} exchange={latestExchange} session={session} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="px-5 py-3 border-t border-[#1a3a20] bg-[#0a120b] shrink-0">
        {error && <p className="text-[#f87171] text-[10px] text-center mb-2">ERR › {error}</p>}
        {!sttSupported && <p className="text-[#eab308] text-[10px] text-center mb-2">Speech recognition unavailable — use Chrome or Edge.</p>}
        <div className="flex items-center justify-center gap-4 min-h-[36px]">
          {state === STATE.CANDIDATE_ANSWERING && (
            <>
              <div className="flex items-center gap-1.5 text-[10px] text-[#4a8f54]">
                <span className="w-2 h-2 rounded-full bg-[#22c55e] recording-dot" />
                {isListening ? 'Listening...' : 'Mic ready'}
              </div>
              <button onClick={submitCurrentAnswer}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[10px] font-bold tracking-widest uppercase transition-opacity">
                <MicIcon /> Submit Answer
              </button>
            </>
          )}
          {state === STATE.INTERVIEWER_SPEAKING && <p className="text-[10px] text-[#22c55e] tracking-widest animate-pulse">› Interviewer speaking...</p>}
          {state === STATE.ANALYZING_ANSWER     && <BusyLabel text="Analyzing response..." />}
          {state === STATE.GENERATING_QUESTION  && <BusyLabel text="Generating next question..." />}
          {state === STATE.INTERVIEW_COMPLETED  && !showReport && (
            <button onClick={() => setShowReport(true)}
              className="px-6 py-2.5 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[10px] font-bold tracking-widest uppercase">
              ▶ View Full Report
            </button>
          )}
        </div>
      </footer>

      <style>{`
        @keyframes soundBar { from{transform:scaleY(0.4);opacity:0.5} to{transform:scaleY(1.8);opacity:1} }
        @keyframes speakPulse { 0%,100%{transform:scale(1);filter:brightness(1)} 50%{transform:scale(1.006);filter:brightness(1.04)} }
      `}</style>
    </div>
  );
}

function PreStartScreen({ session, onStart }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080e0a] font-mono p-4">
      <div className="flex flex-col items-center gap-5 p-8 rounded-xl border border-[#1a3a20] bg-[#0c1a0e] max-w-sm w-full text-center">
        <div className="w-12 h-12 rounded-xl bg-[#22c55e14] border border-[#22c55e33] flex items-center justify-center text-[13px] font-bold text-[#22c55e]">IP</div>
        <div>
          <p className="text-[#e8f5ea] text-sm font-bold tracking-widest uppercase mb-1">Ready to Begin</p>
          <p className="text-[#2d6e3a] text-[10px] tracking-widest uppercase">{session?.interviewType} · {session?.jobRole}</p>
        </div>
        <div className="w-full h-px bg-[#1a3a20]" />
        <ul className="text-left w-full space-y-2">
          {[['🎤','Allow microphone when prompted'],['📷','Allow camera when prompted'],['🔊','Ensure speakers are on'],['🌐','Best in Chrome or Edge']].map(([i,t])=>(
            <li key={t} className="flex gap-2 text-[10px] text-[#4a8f54]"><span>{i}</span><span>{t}</span></li>
          ))}
        </ul>
        <div className="w-full h-px bg-[#1a3a20]" />
        <p className="text-[10px] text-[#4a8f54] leading-relaxed">Questions are generated dynamically based on your answers. Click Start when ready.</p>
        <button onClick={onStart} className="w-full py-3 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[11px] font-bold tracking-widest uppercase transition-opacity">
          ▶ &nbsp;Start Interview
        </button>
      </div>
    </div>
  );
}

function StateBadge({ state, isSpeaking, isListening }) {
  const map = {
    [STATE.IDLE]:                   { label:'Idle',                 cls:'bg-[#1a3a20] text-[#4a8f54] border-[#1a3a20]' },
    [STATE.REQUESTING_PERMISSIONS]: { label:'Connecting',           cls:'bg-[#eab3080f] text-[#eab308] border-[#eab30833]' },
    [STATE.INTERVIEWER_SPEAKING]:   { label:'Interviewer Speaking', cls:'bg-[#22c55e0f] text-[#22c55e] border-[#22c55e33]' },
    [STATE.CANDIDATE_ANSWERING]:    { label:'Your Turn',            cls:'bg-[#38bdf80f] text-[#38bdf8] border-[#38bdf833]' },
    [STATE.ANALYZING_ANSWER]:       { label:'Analyzing',            cls:'bg-[#eab3080f] text-[#eab308] border-[#eab30833]' },
    [STATE.GENERATING_QUESTION]:    { label:'AI Thinking',          cls:'bg-[#a78bfa0f] text-[#a78bfa] border-[#a78bfa33]' },
    [STATE.INTERVIEW_COMPLETED]:    { label:'Complete',             cls:'bg-[#1a3a20] text-[#4a8f54] border-[#1a3a20]' },
  };
  const { label, cls } = map[state] || map[STATE.IDLE];
  const display = isSpeaking ? 'Interviewer Speaking' : isListening ? 'Listening...' : label;
  return <div className={`px-2.5 py-1.5 rounded border text-[9px] font-bold tracking-widest uppercase ${cls}`}>{display}</div>;
}

function BusyLabel({ text }) {
  return (
    <div className="flex items-center gap-2 text-[10px] text-[#eab308] tracking-widest animate-pulse">
      <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
      </svg>
      {text}
    </div>
  );
}

function MicIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
      <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
    </svg>
  );
}
