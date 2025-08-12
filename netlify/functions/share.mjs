export const config = { path: "/api/share" };

export default async (req) => {
  return new Response(JSON.stringify({ status: 'share ok' }), {
    headers: { 'content-type': 'application/json' }
  });
};
