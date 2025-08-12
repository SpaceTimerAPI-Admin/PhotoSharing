export const config = { path: "/api/ping" };

export default () =>
  new Response(JSON.stringify({ ok: true, ts: Date.now() }), {
    headers: { "content-type": "application/json" }
  });
