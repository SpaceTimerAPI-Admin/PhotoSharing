export const config = { path: "/api/upload", maxDuration: 26 };

export default async (req) => {
  return new Response(JSON.stringify({ status: 'upload ok' }), {
    headers: { 'content-type': 'application/json' }
  });
};
