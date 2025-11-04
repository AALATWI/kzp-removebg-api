import { useState } from 'react';

export default function Home() {
  const [file, setFile] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const fd = new FormData();
      if (file) fd.append('image_file', file);
      if (imageUrl) fd.append('image_url', imageUrl.trim());
      const r = await fetch('/api/remove-bg', { method: 'POST', body: fd });
      if (!r.ok) {
        const t = await r.text();
        throw new Error(t);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      setResult(url);
    } catch (err) {
      setError(err.message || 'Error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', fontFamily: 'system-ui' }}>
      <h1>Remove.bg Proxy – KidsZoneParty</h1>
      <form onSubmit={onSubmit}>
        <div style={{ marginBottom: 8 }}>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0] || null)} />
        </div>
        <div style={{ marginBottom: 8 }}>
          <input
            style={{ width: '100%' }}
            placeholder="Or image URL (https://…)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
          />
        </div>
        <button disabled={loading}>{loading ? 'Processing…' : 'Process'}</button>
      </form>

      {error && <pre style={{ color: 'crimson', whiteSpace: 'pre-wrap' }}>{error}</pre>}

      {result && (
        <div style={{ marginTop: 16 }}>
          <h3>Result</h3>
          <img src={result} alt="result" style={{ maxWidth: '100%', border: '1px solid #ddd' }} />
          <p><a href={result} download="output.png">Download</a></p>
        </div>
      )}
    </main>
  );
}
