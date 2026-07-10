const API_BASE = '/api/resumes';

export async function uploadResume(userId, file) {
  const formData = new FormData();
  formData.append('userId', userId);
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to upload resume');
  }
  return res.json();
}

export async function getLatestResume(userId) {
  const res = await fetch(`${API_BASE}/latest?userId=${userId}`);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error('Failed to load resume');
  return res.json();
}
