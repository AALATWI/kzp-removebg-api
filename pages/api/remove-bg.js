// pages/api/remove-bg.js
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing REMOVE_BG_API_KEY env var' });
  }

  try {
    const form = formidable({ multiples: false, keepExtensions: true });

    const { fields, files } = await new Promise((resolve, reject) => {
      form.parse(req, (err, f, fl) => (err ? reject(err) : resolve({ fields: f, files: fl })));
    });

    const imageUrl = (fields.image_url || '').toString().trim();

    let fileObj = files.image_file;
    if (Array.isArray(fileObj)) fileObj = fileObj[0];
    const filePath = fileObj && (fileObj.filepath || fileObj.path);
    const filename = fileObj && (fileObj.originalFilename || 'upload.png');

    if (!imageUrl && !filePath) {
      return res.status(400).json({ error: 'Please provide image_file or image_url' });
    }

    const fd = new FormData();
    if (imageUrl) fd.append('image_url', imageUrl);
    if (filePath) fd.append('image_file', fs.createReadStream(filePath), filename);
    fd.append('size', 'auto');

    const r = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': apiKey },
      body: fd,
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const ab = await r.arrayBuffer();
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(Buffer.from(ab));
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
