'use client';

import { useState } from 'react';

const API =
  process.env.NEXT_PUBLIC_UPLOAD_API_URL || 'https://ujris-simple-backend.onrender.com';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setError('');
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setError('');

    try {
      setStatus('Uploading your files...');
      const caseId = Date.now().toString();

      const formData = new FormData();
      files.forEach((file) => formData.append('files', file));
      formData.append('caseId', caseId);

      const res = await fetch(`${API}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err?.error || 'Upload failed');
      }

      const data = await res.json();
      localStorage.setItem('ujris_case_id', data.caseId);

      setStatus(`${data.count} file(s) uploaded successfully!`);
      setUploaded(true);

      setTimeout(() => {
        window.location.href = `https://tally.so/r/eq2Pqe?caseId=${data.caseId}`;
      }, 2000);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload failed';
      setError(message);
      setStatus('');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0f172a] px-6 py-4 text-white">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <a href="/" className="font-serif text-xl font-bold">
            UJRIS
          </a>
          <a href="https://tally.so/r/eq2Pqe" className="text-sm text-slate-300 hover:text-white">
            Skip upload -&gt;
          </a>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8 text-center">
          <h1 className="mb-4 font-serif text-4xl font-bold text-[#0f172a]">Upload Your Evidence</h1>
          <p className="text-lg text-slate-600">Any file type. Up to 100MB per file. Unlimited files.</p>
        </div>

        <div className="rounded-2xl bg-white p-8 shadow-xl">
          <div className="rounded-xl border-2 border-dashed border-[#c9a84c] p-8 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp,.txt,.mp3,.mp4,.zip"
            />
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-medium text-slate-600">{files.length} file(s) selected</p>
                <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-left text-xs text-slate-500">
                  {files.map((file, index) => (
                    <li key={index} className="flex justify-between">
                      <span>{file.name}</span>
                      <span className="text-slate-400">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {status && !uploaded && (
            <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-3 text-center text-sm text-blue-700">
              Upload in progress: {status}
            </div>
          )}

          {!uploaded ? (
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="mt-6 w-full rounded-lg bg-[#c9a84c] px-6 py-3 font-semibold text-[#0f172a] transition hover:bg-[#b8973f] disabled:opacity-50"
            >
              {uploading ? status || 'Uploading...' : `Upload ${files.length} file(s) - Then Pay GBP 49`}
            </button>
          ) : (
            <div className="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 text-center">
              <p className="font-medium text-green-800">Upload complete. {status}</p>
              <p className="mt-1 text-sm text-green-600">Redirecting to payment...</p>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-slate-400">
            Files are encrypted in transit, processed in the backend, and auto-deleted after 30
            days unless retention is required for delivery or support.
          </p>
        </div>
      </main>
    </div>
  );
}
