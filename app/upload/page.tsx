'use client';

import { useState } from 'react';

const API = 'https://female-norina-ujrisai-6e069b82.koyeb.app';

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
      // Step 1: Register a guest account
      setStatus('Setting up your case...');
      const guestEmail = `guest_${Date.now()}@ujris.co.uk`;
      const guestPassword = `Ujris${Date.now()}!`;

      const registerRes = await fetch(`${API}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: guestEmail,
          password: guestPassword,
          name: 'UJRIS User',
        }),
      });

      if (!registerRes.ok) throw new Error('Account setup failed');
      const { data: authData } = await registerRes.json();
      const token = authData.token;

      // Save credentials so user can log back in
      localStorage.setItem('ujris_token', token);
      localStorage.setItem('ujris_email', guestEmail);
      localStorage.setItem('ujris_password', guestPassword);

      // Step 2: Create a case
      setStatus('Creating your case...');
      const caseRes = await fetch(`${API}/api/cases`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title: 'UJRIS Case — ' + new Date().toLocaleDateString('en-GB'),
          description: 'Case submitted via UJRIS upload portal. Evidence attached for AI analysis.',
          decisionType: 'OTHER',
          grounds: 'OTHER',
        }),
      });

      if (!caseRes.ok) throw new Error('Case creation failed');
      const { data: caseData } = await caseRes.json();
      const caseId = caseData.case.id;
      localStorage.setItem('ujris_case_id', caseId);

      // Step 3: Upload files (max 5 per request — backend limit)
      const BATCH_SIZE = 10;
      let uploaded = 0;

      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        setStatus(`Uploading files ${i + 1}–${Math.min(i + BATCH_SIZE, files.length)} of ${files.length}...`);

        const formData = new FormData();
        batch.forEach(file => formData.append('files', file));

        const uploadRes = await fetch(`${API}/api/cases/${caseId}/evidence`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (!uploadRes.ok) {
          const err = await uploadRes.json().catch(() => ({}));
          throw new Error(err?.error?.message || `Upload failed for batch ${i + 1}`);
        }
        uploaded += batch.length;
      }

      setStatus(`${uploaded} file(s) uploaded successfully!`);
      setUploaded(true);

      // Redirect to payment after 2 seconds
      setTimeout(() => {
        window.location.href = `https://tally.so/r/eq2Pqe?caseId=${caseId}`;
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
      <header className="bg-[#0f172a] text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-xl">UJRIS</a>
          <a href="https://tally.so/r/eq2Pqe" className="text-slate-300 hover:text-white text-sm">
            Skip upload →
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#0f172a] mb-4">
            Upload Your Evidence
          </h1>
          <p className="text-slate-600 text-lg">
            PDF, images, Word docs, or plain text. Up to 10MB per file.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="border-2 border-dashed border-[#c9a84c] rounded-xl p-8 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.txt"
            />
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-600 font-medium">
                  {files.length} file(s) selected
                </p>
                <ul className="text-left text-xs text-slate-500 mt-2 max-h-40 overflow-y-auto space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{f.name}</span>
                      <span className="text-slate-400">{(f.size / 1024 / 1024).toFixed(2)} MB</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {status && !uploaded && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm text-center">
              ⏳ {status}
            </div>
          )}

          {!uploaded ? (
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="mt-6 w-full bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a] font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? status || 'Uploading...' : `Upload ${files.length} file(s) — Then Pay £49`}
            </button>
          ) : (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-center">
              <p className="text-green-800 font-medium">✅ {status}</p>
              <p className="text-green-600 text-sm mt-1">Redirecting to payment...</p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center mt-6">
            Files are encrypted in transit. No human access. Auto-deleted after 30 days.
          </p>
        </div>
      </main>
    </div>
  );
}
