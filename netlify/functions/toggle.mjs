export const config = { path: "/api/toggle" };

export default async (req) => {
  return new Response(JSON.stringify({ status: 'toggle ok' }), {
    headers: { 'content-type': 'application/json' }
  });
};
