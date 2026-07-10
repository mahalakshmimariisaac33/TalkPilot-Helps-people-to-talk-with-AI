import { useRef, useState } from 'react';
import { uploadResume } from '../api/resumeApi';

export default function ResumeUploadScreen({ userId, greeting, existingResume, onContinue }) {
  const [resume, setResume] = useState(existingResume || null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a PDF file.');
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const parsed = await uploadResume(userId, file);
      setResume(parsed);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#080e0a] font-mono">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#22c55e0c] border border-[#22c55e33] text-[#22c55e] text-[9px] tracking-widest uppercase mb-4">
            <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] recording-dot" />
            Step 1 of 2
          </div>
          <h1 className="text-xl font-bold text-[#e8f5ea] tracking-tight mb-1">
            Upload Your Resume
          </h1>
          {greeting && (
            <p className="text-[11px] text-[#2d6e3a] leading-relaxed font-sans">{greeting}</p>
          )}
        </div>

        <div className="bg-[#0c1a0e] border border-[#1a3a20] rounded-xl p-6 space-y-4">
          {!resume && (
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                handleFile(e.dataTransfer.files?.[0]);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors
                ${dragOver ? 'border-[#22c55e88] bg-[#22c55e0a]' : 'border-[#1a3a20] hover:border-[#22c55e44]'}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
              <p className="text-[#4a8f54] text-xs font-sans mb-1">
                {uploading ? 'Reading and analyzing your resume…' : 'Click or drag a PDF here'}
              </p>
              <p className="text-[#1a3a20] text-[10px] font-sans">Max 8MB, .pdf only</p>
            </div>
          )}

          {error && (
            <div className="px-3 py-2 rounded-md bg-red-500/10 border border-red-500/30 text-red-300 text-[11px] font-sans">
              {error}
            </div>
          )}

          {resume && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-widest uppercase text-[#2d6e3a]">
                  {resume.fileName}
                </span>
                <button
                  onClick={() => { setResume(null); setError(null); }}
                  className="text-[10px] text-[#4a8f54] hover:text-[#22c55e] underline"
                >
                  Upload different file
                </button>
              </div>

              <div className="bg-[#080e0a] border border-[#1a3a20] rounded-lg p-4 space-y-3">
                {resume.summary && (
                  <p className="text-[#c8f0cd] text-xs font-sans leading-relaxed">{resume.summary}</p>
                )}

                {resume.skills?.length > 0 && (
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-[#2d6e3a] mb-1.5">Skills detected</p>
                    <div className="flex flex-wrap gap-1.5">
                      {resume.skills.map((s) => (
                        <span key={s} className="px-2 py-0.5 rounded bg-[#22c55e0f] border border-[#22c55e33] text-[#22c55e] text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {resume.projects?.length > 0 && (
                  <div>
                    <p className="text-[9px] tracking-widest uppercase text-[#2d6e3a] mb-1.5">Projects</p>
                    <ul className="space-y-1">
                      {resume.projects.map((p, i) => (
                        <li key={i} className="text-[11px] text-[#c8f0cd] font-sans">
                          <span className="text-[#22c55e] font-bold">{p.title}</span>
                          {p.description ? ` — ${p.description}` : ''}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-4 text-[10px] text-[#2d6e3a] pt-1">
                  {resume.yearsOfExperience && <span>Experience: <span className="text-[#4a8f54]">{resume.yearsOfExperience}</span></span>}
                  {resume.targetRoleGuess && <span>Likely target role: <span className="text-[#4a8f54]">{resume.targetRoleGuess}</span></span>}
                </div>
              </div>

              <button
                onClick={() => onContinue(resume)}
                className="w-full py-2.5 rounded-lg bg-[#22c55e] hover:opacity-85 text-[#080e0a] text-[11px] font-bold tracking-widest uppercase transition-opacity"
              >
                Looks good — Continue
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
