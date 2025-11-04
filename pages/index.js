import { useState, useRef } from 'react';

export default function Home() {
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // نستخدم ref للحصول على ملف الـ input كـ File
  const fileRef = useRef(null);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();

      // 1) لو فيه ملف مختار – خذه كـ File صحيح
      const file = fileRef.current?.files?.[0] || null;
      if (file) {
        fd.append('image_file', file, file.name); // لازم يكون Blob/File
      }
      // 2) لو مافيه ملف وفيه رابط – استخدم image_url
      else if (imageUrl && imageUrl.trim()) {
        fd.append('image_url', imageUrl.trim());
      } else {
        throw new Error('Please choose a file or paste an image URL');
      }

      const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });

      if (!r.ok) {
        const text = await r.text();
        throw new Error(text || 'Remove.bg error');
      }

      // نستلم الصورة كبايتات ونحوّلها لبلوب ثم URL للعرض/التحميل
      const ab = await r.arrayBuffer();
      const blob = new Blob([ab], { type: 'image/png' });
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      console.error(err);
      setError(err.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Remove.bg Proxy – KidsZoneParty</h1>
      <p>Upload a photo or paste an image URL, then click Process.</p>

      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={() => {
              // لو اخترت ملف، نفرغ حقل الرابط حتى ما نرسل الاثنين
              setImageUrl('');
            }}
          />
        </div>

        <div style={{ marginBottom: 8 }}>
          <input
            style={{ width: '100%' }}
            placeholder="Or image URL (https://…)"
            value={imageUrl}
            onChange={(e) => {
              setImageUrl(e.target.value);
              // لو كتبت رابط، نفرغ اختيار الملف
              if (fileRef.current) fileRef.current.value = '';
            }}
          />
        </div>

        <button disabled={loading}>{loading ? 'Processing…' : 'Process'}</button>
      </form>

      {error && (
        <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap', marginTop: 12 }}>
          {JSON.stringify({ error }, null, 2)}
        </pre>
      )}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Result</h3>
          <img src={result} alt="output" style={{ width: '100%', border: '1px solid #ddd' }} />
          <p>
            <a href={result} download="output.png">Download</a>
          </p>
        </div>
      )}
    </main>
  );
}
