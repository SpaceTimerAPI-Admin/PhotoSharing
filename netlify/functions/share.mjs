import { supabase } from "./_supabase.mjs";
import { notifyDiscord } from "./_notify.mjs";

export const config = { path: "/api/share" };

const page = (title, bodyHtml = "") => `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${title}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
  <style>
    :root { color-scheme: dark; }
    body { font-family: Inter, system-ui, -apple-system, Segoe UI, Roboto, Arial; margin: 0; padding: 24px; background: #0b0b10; color: #eaeaf0; }
    .card { max-width: 720px; margin: 0 auto; background: #151522; border: 1px solid #222235; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,.35); }
    header { padding: 20px 24px; border-bottom: 1px solid #222235; display: flex; align-items: center; justify-content: space-between; }
    h1 { font-size: 18px; margin: 0; }
    .content { padding: 24px; }
    .preview { background: #0f0f18; border: 1px dashed #2c2c44; border-radius: 12px; padding: 12px; display: grid; place-items: center; min-height: 220px; }
    img { max-width: 100%; border-radius: 8px; transition: filter 250ms ease; }
    .blurred { filter: blur(16px); }
    .gate { margin-top: 16px; padding: 16px; background: #10101a; border: 1px solid #2a2a44; border-radius: 12px; }
    button { background: #635bff; color: white; border: 0; border-radius: 12px; padding: 12px 16px; font-weight: 600; cursor: pointer; }
    button[disabled] { opacity: .6; cursor: not-allowed; }
    a.social { display: inline-flex; align-items: center; gap: 8px; padding: 10px 12px; border: 1px solid #2a2a44; border-radius: 10px; color: #eaeaf0; text-decoration: none; }
    .row { display: flex; gap: 8px; flex-wrap: wrap; }
    .muted { color: #a5a5c3; font-size: 14px; }
    .footer { padding: 16px 24px; border-top: 1px solid #222235; color: #a5a5c3; font-size: 12px; }
    .hidden { display: none; }
    .err { color: #ffb3b3; }
  </style>
</head>
<body>
  <div class="card">
    <header>
      <h1>Photo Download</h1>
      <span class="muted">Follow to unlock</span>
    </header>
    <div class="content">
      ${bodyHtml}
    </div>
    <div class="footer">
      This photo is provided for personal use by the recipient. <strong>The photo and link will expire ${parseInt(process.env.DELETE_AFTER_DAYS || "30",10)} days after upload.</strong>
    </div>
  </div>
</body>
</html>`;

export default async (request) => {
  const url = new URL(request.url);
  const id = url.searchParams.get("id") || url.pathname.split("/").filter(Boolean).pop();

  const ua = request.headers.get("user-agent") || "";
  const ref = request.headers.get("referer") || "";
  const ip = request.headers.get("x-nf-client-connection-ip") || request.headers.get("x-forwarded-for") || "";

  if (!id || id === "share") {
    return new Response(page("Missing ID", `<p class="err">Missing ID in URL. Make sure your link looks like <code>/share/&lt;id&gt;</code>.</p>`),
      { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  const { data: row } = await supabase.from("photos").select("*").eq("id", id).maybeSingle();
  const expired = row?.expires_at && new Date() > new Date(row.expires_at);
  notifyDiscord(`${row ? "📸 Share open" : "⚠️ Share not found"}: **${id}**\n• UA: ${ua}\n• Ref: ${ref}\n• IP: ${ip}`).catch(()=>{});

  if (!row) {
    return new Response(page("Link not found", `<p class="err">Link not found.</p>`),
      { headers: { "content-type": "text/html; charset=utf-8" } });
  }
  if (expired) {
    return new Response(page("Link expired", `<p class="muted">This link has expired.</p>`),
      { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Build absolute origin for server-side fetches
  const origin = new URL(request.url).origin;

  // Direct (unlocked)
  if (row.locked === false) {
    const dl = await fetch(`${origin}/api/download?id=${encodeURIComponent(id)}`);
    const j = await dl.json();
    const body = `
      <div class="preview"><img src="${j.url}" alt="Photo"/></div>
      <div class="gate">
        <p>Direct download:</p>
        <p><a class="social" href="${j.url}" target="_blank" rel="noopener">Download photo</a></p>
        <p class="muted">This photo is not gated.</p>
      </div>`;
    return new Response(page("Photo Download", body), { headers: { "content-type": "text/html; charset=utf-8" } });
  }

  // Locked (blur + gate)
  const dl = await fetch(`${origin}/api/download?id=${encodeURIComponent(id)}`);
  const j = await dl.json();
  let body = "";
  if (j.url) {
    body = `
      <p id="msg" class="err hidden"></p>
      <div class="preview"><img id="thumb" class="blurred" src="${j.url}" alt="Photo preview (blurred)"/></div>
      <div class="gate">
        <p class="muted">Before downloading, please follow Anthony on one of these:</p>
        <div class="row" id="socials">
          <a class="social" href="https://www.instagram.com/anthonymchugh__/" target="_blank" rel="noopener">Instagram</a>
          <a class="social" href="https://www.tiktok.com/@anthonymchugh_" target="_blank" rel="noopener">TikTok</a>
          <a class="social" href="https://www.snapchat.com/add/anthonymchugh" target="_blank" rel="noopener">Snapchat</a>
        </div>
        <p class="muted">Once done, click the button below.</p>
        <button id="unlockBtn">I followed — unlock download</button>
        <div id="download" class="hidden"><p>Thanks! Your download is ready:</p>
          <p><a id="dl" class="social" href="${j.url}" target="_blank" rel="noopener">Download photo</a></p>
        </div>
      </div>
      <script>
        document.getElementById('unlockBtn').addEventListener('click', () => {
          document.getElementById('download').classList.remove('hidden');
          document.getElementById('thumb').classList.remove('blurred');
        });
      </script>`;
  } else {
    body = `<p class="err">${j.error || "Unable to generate preview."}</p>`;
  }

  return new Response(page("Photo Download", body), { headers: { "content-type": "text/html; charset=utf-8" } });
};
