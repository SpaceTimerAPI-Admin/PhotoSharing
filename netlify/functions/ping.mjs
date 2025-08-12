export const config = { path: "/api/ping" };
export default async () => new Response(JSON.stringify({ ok: true }), { headers: { "content-type": "application/json" }});
