import { useState } from 'react';
import { loginOrRegister } from '../api/userApi';

export default function LoginScreen({ onLoggedIn }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const status = await loginOrRegister(email.trim());
      onLoggedIn(status);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080e0a] font-mono">
      <div className="w-full max-w-md">
        <div className="text-center mb-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#22c55e0c] border border-[#22c55e33] text-[#22c55e] text-[9px] tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
            Campus Placement Prep
          </div>
          <h1 className="text-2xl font-bold text-[#e8f5ea] tracking-tight mb-1">
            Interview<span className="text-[#22c55e]">Pilot</span> AI
          </h1>
          <p className="text-[11px] text-[#2d6e3a] leading-relaxed font-sans">
            Sign in to track your progress and get<br />
            questions personalized to your resume.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-[#0c1a0e] border border-[#1a3a20] rounded-xl p-6 space-y-4"
        >
          <div>
            <label className="flex items-center gap-1.5 text-[9px] tracking-widest uppercase text-[#2d6e3a] mb-1.5">
              <span className="text-[#22c55e33]">$</span>
              Email
            </label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-3 py-2 rounded-md bg-[#080e0a] border border-[#1a3a20] text-[#c8f0cd] text-xs placeholder-[#1a3a20] focus:outline-none focus:border-[#22c55e66] transition-colors"
            />
          </div>

          {error && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[11px]">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[11px] font-bold tracking-widest uppercase transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Continue'}
          </button>
        </form>

        <p className="text-center text-[9px] text-[#1a3a20] tracking-wider mt-4 leading-relaxed">
          No password needed — we just use your email to save your progress.
        </p>
      </div>
    </div>
  );
}
