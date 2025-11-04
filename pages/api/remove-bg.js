export const config = {
  api: {
    bodyParser: false, // let us handle multipart
  },
};

import formidable from 'formidable';
import FormData from 'form-data';
import { Readable } from 'stream';

// We bundle a tiny formidable to parse multipart; use dynamic import to avoid SSR issues
async function parseMultipart(req) {
  const form = formidable({ multiples: false });
  return await new Promise((resolve, reject) => {
    form.parse(req, (err, fields, files) => {
      if (err) reject(err);
      else resolve({ fields, files });
    });
  });
}

async function bufferFromFile(file) {
  const fs = await import('fs');
  return await fs.promises.readFile(file.filepath);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Use POST' });
  }

  try {
    // CORS (allow from anywhere; tighten later in Vercel by domain)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    const key = process.env.REMOVE_BG_API_KEY;
    if (!key) return res.status(500).json({ error: 'Missing REMOVE_BG_API_KEY' });

    // Parse multipart
    const { fields, files } = await parseMultipart(req);
    const imageUrl = fields.image_url;
    const size = fields.size || 'auto';
    const bgColor = fields.bg_color;
    const channels = fields.channels || 'rgba';

    const form = new FormData();

    if (imageUrl) {
      form.append('image_url', imageUrl);
    } else if (files?.image_file) {
      const buf = await bufferFromFile(files.image_file);
      form.append('image_file', buf, { filename: files.image_file.originalFilename || 'upload.jpg' });
    } else {
      return res.status(400).json({ error: 'Provide image_file or image_url' });
    }

    form.append('size', size);
    form.append('channels', channels);
    if (bgColor) form.append('bg_color', bgColor);

    const r = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: { 'X-Api-Key': key, ...form.getHeaders?.() },
      body: form,
    });

    if (!r.ok) {
      const txt = await r.text();
      return res.status(r.status).json({ error: txt });
    }

    const arrayBuf = await r.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).send(buf);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || 'Server error' });
  }
}
