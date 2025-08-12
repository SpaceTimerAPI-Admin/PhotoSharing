// Simple Discord notifier. Set DISCORD_WEBHOOK_URL in Netlify env vars.
export async function notifyDiscord(text) {
  const url = process.env.DISCORD_WEBHOOK_URL;
  if (!url) return false;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ content: text })
    });
    return res.ok;
  } catch {
    return false;
  }
}
