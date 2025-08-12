import { supabase, json } from "./_supabase.mjs";

export const config = { path: "/api/toggle" };

export default async (request) => {
  if (request.method !== "POST") return json({ error: "POST only" }, 405);

  const token = request.headers.get("x-admin-token");
  if (!token || token !== process.env.ADMIN_UPLOAD_TOKEN) {
    return json({ error: "Unauthorized: missing or invalid ADMIN_UPLOAD_TOKEN" }, 401);
  }

  let body;
  try { body = await request.json(); }
  catch { return json({ error: "Invalid JSON body" }, 400); }

  const id = body?.id;
  const locked = body?.locked;
  if (!id || typeof locked !== "boolean") {
    return json({ error: "Provide id (string) and locked (boolean)" }, 400);
  }

  const { data, error } = await supabase.from("photos").update({ locked }).eq("id", id).select("*").maybeSingle();
  if (error) return json({ error: error.message }, 500);
  if (!data) return json({ error: "Not found" }, 404);

  return json({ ok: true, id, locked });
};
