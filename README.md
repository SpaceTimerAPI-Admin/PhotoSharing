# CandidPhotos — Full Starter

Single-photo QR flow with:
- Blurred preview + “follow to unlock” (Instagram/TikTok/Snapchat)
- Optional per-photo unlock (no gate)
- Expiry + daily cleanup
- Discord alerts for visits and downloads
- Admin panel to upload & toggle the gate

## Files
- `public/admin.html` — upload UI + lock checkbox + toggle tool
- `netlify/functions/` — serverless functions
  - `upload.mjs` — handles upload, stores `locked`, applies `DELETE_AFTER_DAYS`
  - `download.mjs` — returns signed URL (5 min) + Discord alert
  - `share.mjs` — renders share page; locked/unlocked logic + Discord alert
  - `toggle.mjs` — change `locked` later via POST
  - `cleanup.mjs` — deletes expired files/rows (cron in netlify.toml)
  - `_supabase.mjs` — Supabase client + JSON helper
  - `_notify.mjs` — Discord helper
  - `ping.mjs` — quick health check
- `supabase-init.sql` — creates `photos` table (includes `locked` column)
- `netlify.toml` — build/redirects/schedule
- `public/_redirects` — backup redirect
- `package.json` — deps

## Setup

### 1) Supabase
- Create a **private** bucket named `photos` in **Storage**
- Run `supabase-init.sql` (SQL Editor)

### 2) Netlify
Create a new site from this folder/repo. Build settings:
- **Publish directory**: `public`
- **Functions directory**: `netlify/functions`

Environment variables (Site settings → Environment variables):
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE=...
ADMIN_UPLOAD_TOKEN=...             # paste the same value in /admin.html
DISCORD_WEBHOOK_URL=...            # for alerts
DELETE_AFTER_DAYS=30               # adjust if you like
```

Deploy. In logs you should see:
```
Packaging Functions from netlify/functions directory:
  - ping.mjs
  - upload.mjs
  - share.mjs
  - download.mjs
  - toggle.mjs
  - cleanup.mjs
```

### 3) Sanity tests (use your netlify.app domain first)
- `/.netlify/functions/ping` → JSON `{ ok: true }`
- `/admin.html` → click **Check function health**
- Upload one photo (locked or unlocked)

### 4) Custom domain (optional)
- Add `photos.anthonymchugh.com` to this site
- DNS CNAME `photos` → `<your-site>.netlify.app`

Done! You’ll get Discord pings for opens/downloads. The share page uses:
- Instagram: **anthonymchugh__**
- TikTok: **@anthonymchugh_**
- Snapchat: **anthonymchugh**
