// pages/api/remove-bg.js
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false, // مهم جداً لأننا نستقبل multipart/form-data
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.REMOVE_BG_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Missing REMOVE_BG_API_KEY' });
  }

  try {
    // نفكّر الـ multipart باستخدام formidable
    const { fields, files } = await new Promise((resolve, reject) => {
      const form = formidable({ multiples: false });
      form.parse(req, (err, fields, files) => {
        if (err) reject(err);
        else resolve({ fields, files });
      });
    });

    const imageUrl = (fields.image_url || '').toString().trim();

    // نجهّز الفورم الذي سنرسله إلى remove.bg
    const fd = new FormData();

    if (imageUrl) {
      fd.append('image_url', imageUrl);
    } else if (files.image_file && files.image_file.filepath) {
      const filePath = files.image_file.filepath;
      const filename =
        files.image_file.originalFilename || 'upload.png';
      fd.append('image_file', fs.createReadStream(filePath), filename);
    } else {
      return res
        .status(400)
        .json({ error: 'Please provide image_file or image_url' });
    }

    // خيارات اختيارية (مثال: الحجم)
    fd.append('size', 'auto');

    // نرسل الطلب إلى remove.bg
    const r = await fetch('https://api.remove.bg/v1.0/removebg', {
      method: 'POST',
      headers: {
        'X-Api-Key': apiKey,
      },
      body: fd,
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: text });
    }

    const ab = await r.arrayBuffer();
    const buf = Buffer.from(ab);

    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    return res.send(buf);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message || 'Server error' });
  }
}
