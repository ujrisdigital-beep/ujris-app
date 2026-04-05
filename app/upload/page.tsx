'use client';

import { useState } from 'react';

export default function UploadPage() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [caseId] = useState(() => Date.now().toString());

  const handleUpload = async () => {
    setUploading(true);

    for (const file of files) {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('caseId', caseId);

      const res = await fetch('https://female-norina-ujrisai-6e069b82.koyeb.app/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        console.log('Uploaded:', file.name);
      }
    }

    setUploading(false);
    alert('Upload complete! Redirecting to payment...');
    window.location.href = 'https://tally.so/r/eq2Pqe';
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Upload Your Evidence</h1>
        <p className="text-slate-600 mb-8">Any file type. Any size. Unlimited files.</p>

        <input
          type="file"
          multiple
          onChange={(e) => setFiles(Array.from(e.target.files || []))}
          className="w-full p-4 border-2 border-dashed border-[#c9a84c] rounded-lg mb-4"
        />

        {files.length > 0 && (
          <div className="mb-4">
            <p>{files.length} file(s) selected</p>
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="bg-[#c9a84c] px-6 py-2 rounded disabled:opacity-50"
            >
              {uploading ? 'Uploading...' : `Upload ${files.length} file(s) — £49`}
            </button>
          </div>
        )}

        <p className="text-xs text-slate-400 mt-8">
          Files are encrypted. No human access. Deleted after 30 days.
        </p>
      </div>
    </div>
  );
}
