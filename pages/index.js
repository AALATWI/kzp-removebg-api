// pages/index.js
import { useState, useRef } from 'react';

export default function Home() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();

      // خذ الملف من حقل الرفع عبر الـ ref
      const file = fileRef.current?.files?.[0] || null;

      if (file) {
        // لازم نمرر Blob/File فعلي + اسم الملف
        fd.append('image_file', file, file.name);
      } else if (imageUrl && imageUrl.trim()) {
        fd.append('image_url', imageUrl.trim());
      } else {
        throw new Error('Please choose a file or paste an image URL');
      }

      // أرسل إلى API عندنا
      const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });
      if (!r.ok) {
        // حاول نقرأ نص الخطأ من السيرفر
        const txt = await r.text();
        throw new Error(txt || 'Remove.bg error');
      }

      // استلم الصورة كـ PNG (بايتات)
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
        {/* رفع ملف (نستعمل ref) */}
        <div style={{ marginBottom: 8 }}>
          <input type="file" accept="image/*" ref={fileRef} />
        </div>

        {/* إدخال رابط صورة (اختياري) */}
        <div style={{ marginBottom: 8 }}>
          <input
            style={{ width: '100%' }}
            placeholder="Or image URL (https://)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>

        <button disabled={loading}>
          {loading ? 'Processing…' : 'Process'}
        </button>
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
