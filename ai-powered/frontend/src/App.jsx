import { useEffect, useState } from 'react';
import LoginScreen from './components/LoginScreen';
import ResumeUploadScreen from './components/ResumeUploadScreen';
import Dashboard from './components/Dashboard';
import SetupScreen from './components/SetupScreen';
import InterviewRoom from './components/InterviewRoom';
import { startInterview } from './api/interviewApi';
import { loginOrRegister } from './api/userApi';

const STORAGE_KEY = 'interviewpilot_email';

export default function App() {
  const [userStatus, setUserStatus] = useState(null); // UserStatusDto from /api/users/login
  const [resume, setResume] = useState(null);          // ResumeDto once uploaded/confirmed
  const [mode, setMode] = useState(null);               // 'PRACTICE' | 'REAL'
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Remember the email locally so returning users skip straight past the login form.
  useEffect(() => {
    const savedEmail = localStorage.getItem(STORAGE_KEY);
    if (savedEmail) {
      loginOrRegister(savedEmail).then(setUserStatus).catch(() => {
        localStorage.removeItem(STORAGE_KEY);
      });
    }
  }, []);

  const handleLoggedIn = (status) => {
    localStorage.setItem(STORAGE_KEY, status.email);
    setUserStatus(status);
    if (status.latestResume) setResume(status.latestResume);
  };

  const handleResumeConfirmed = (confirmedResume) => {
    setResume(confirmedResume);
  };

  const handleStart = async (config) => {
    setLoading(true);
    setError(null);
    try {
      const newSession = await startInterview({
        ...config,
        userId: userStatus?.userId,
        resumeId: resume?.id,
      });
      setSession(newSession);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestart = () => {
    setSession(null);
    setMode(null);
    setError(null);
    // Refresh status so the dashboard reflects the session that just finished
    // (new day number / difficulty / attempt count).
    if (userStatus?.email) {
      loginOrRegister(userStatus.email).then(setUserStatus).catch(() => {});
    }
  };

  if (session) {
    return <InterviewRoom session={session} onRestart={handleRestart} />;
  }

  if (!userStatus) {
    return <LoginScreen onLoggedIn={handleLoggedIn} />;
  }

  if (!resume) {
    return (
      <ResumeUploadScreen
        userId={userStatus.userId}
        greeting={userStatus.greeting}
        existingResume={userStatus.latestResume}
        onContinue={handleResumeConfirmed}
      />
    );
  }

  if (!mode) {
    return <Dashboard userStatus={userStatus} onSelectMode={setMode} />;
  }

  return (
    <>
      {error && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-lg bg-red-500/20 border border-red-500/40 text-red-300 text-sm">
          {error}
        </div>
      )}
      <SetupScreen onStart={handleStart} loading={loading} mode={mode} onBack={() => setMode(null)} />
    </>
  );
}
