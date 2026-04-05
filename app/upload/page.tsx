'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [caseId] = useState(() => Date.now().toString());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('caseId', caseId);

    try {
      const res = await fetch('https://ujris-backend.koyeb.app/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        setUploaded(true);
        localStorage.setItem('ujris_case_id', caseId);
        setTimeout(() => {
          window.location.href = 'https://tally.so/r/eq2Pqe';
        }, 2000);
      } else {
        alert('Upload failed. Please try again.');
      }
    } catch (error) {
      alert('Upload error. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <header className="bg-[#0f172a] text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <a href="/" className="font-serif font-bold text-xl">UJRIS</a>
          <a href="https://tally.so/r/eq2Pqe" className="text-slate-300 hover:text-white">Skip for now →</a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#0f172a] mb-4">
            Upload Your Evidence
          </h1>
          <p className="text-slate-600 text-lg">
            Any file type. Any size. Unlimited files.
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="border-2 border-dashed border-[#c9a84c] rounded-xl p-8 text-center">
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="w-full"
              accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt,.mp3,.mp4,.zip"
            />
            {files.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-slate-600">
                  {files.length} file(s) selected
                </p>
                <ul className="text-left text-xs text-slate-500 mt-2 max-h-40 overflow-y-auto">
                  {files.map((f, i) => (
                    <li key={i}>{f.name} ({(f.size / 1024 / 1024).toFixed(2)} MB)</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {!uploaded ? (
            <button
              onClick={handleUpload}
              disabled={uploading || files.length === 0}
              className="mt-6 w-full bg-[#c9a84c] hover:bg-[#b8973f] text-[#0f172a] font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file(s) — Then Pay £49`}
            </button>
          ) : (
            <div className="mt-6 p-4 bg-green-50 rounded-lg text-center">
              <p className="text-green-800">✅ Upload complete! Redirecting to payment...</p>
            </div>
          )}

          <p className="text-xs text-slate-400 text-center mt-6">
            Files are encrypted. No human access. Auto-deleted after 30 days.
          </p>
        </div>
      </main>
    </div>
  );
}
