# KidsZoneParty Remove.bg API (Serverless on Vercel)

A tiny Next.js serverless function that proxies requests to Remove.bg to strip background from user-uploaded photos.

## Deploy (fast)

1. On Vercel: **New → Project → Import from Git** (this repo).
2. In Vercel **Settings → Environment Variables**, add:
   - `REMOVE_BG_API_KEY` = your key from remove.bg
3. **Deploy**. Your endpoint will be:

```
POST https://<your-project>.vercel.app/api/remove-bg
```

## Request options

Send **multipart/form-data** with either:
- `image_file` (binary file), or
- `image_url` (URL),

Optional params:
- `size` (`auto`, `preview`, `small`, `regular`, `medium`, `hd`, `4k`)
- `bg_color` (hex like `#ffffff`) if you want colored background instead of transparent
- `channels` (`rgba` by default)

### cURL examples

Upload a local file:
```bash
curl -X POST https://<your-project>.vercel.app/api/remove-bg   -F image_file=@/path/to/photo.jpg   --output output.png
```

Use image URL:
```bash
curl -X POST https://<your-project>.vercel.app/api/remove-bg   -F image_url=https://example.com/baby.jpg   --output output.png
```

### Response

- **200 OK** with the **processed image bytes** (PNG) as the body.
- On error: JSON `{ error: "message" }` with corresponding status code.

## Test page
Open `/` to use a very simple browser form for manual tests.
