const API_BASE = '/api/interviews';

export async function startInterview(config) {
  const res = await fetch(`${API_BASE}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start interview');
  }
  return res.json();
}

export async function submitAnswer(sessionId, answer) {
  const res = await fetch(`${API_BASE}/${sessionId}/answer`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to submit answer');
  }
  return res.json();
}

export async function concludeInterview(sessionId) {
  const res = await fetch(`${API_BASE}/${sessionId}/conclude`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error('Failed to conclude interview');
  return res.json();
}

export async function getSession(sessionId) {
  const res = await fetch(`${API_BASE}/${sessionId}`);
  if (!res.ok) throw new Error('Failed to load session');
  return res.json();
}
