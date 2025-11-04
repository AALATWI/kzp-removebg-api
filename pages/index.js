// pages/index.js
import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);        // ← نمسك الـFile هنا
  const [imageUrl, setImageUrl] = useState('');  // ← أو رابط صورة
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();

      if (file instanceof File) {
        // نمرر File فعلي + الاسم
        fd.append('image_file', file, file.name);
      } else if (imageUrl && imageUrl.trim()) {
        fd.append('image_url', imageUrl.trim());
      } else {
        throw new Error('Please choose a file or paste an image URL');
      }

      const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });
      if (!r.ok) {
        const txt = await r.text();
        throw new Error(txt || 'Remove.bg error');
      }

      const ab = await r.arrayBuffer();
      const blob = new Blob([ab], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Remove.bg Proxy – KidsZoneParty</h1>

      <form onSubmit={onSubmit}>
        {/* رفع ملف: نمسكه في state */}
        <div style={{ marginBottom: 8 }}>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {/* أو رابط صورة */}
        <div style={{ marginBottom: 8 }}>
          <input
            style={{ width: '100%' }}
            placeholder="Or image URL (https://)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <button disabled={loading}>{loading ? 'Processing…' : 'Process'}</button>
      </form>

      {error && (
        <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Result</h3>
          <img src={result} style={{ maxWidth: '100%', border: '1px solid #ddd' }} />
          <p><a href={result} download="output.png">Download</a></p>
        </div>
      )}
    </main>
  );
}
