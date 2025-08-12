export const config = { path: "/api/download" };

export default async (req) => {
  return new Response(JSON.stringify({ status: 'download ok' }), {
    headers: { 'content-type': 'application/json' }
  });
};
