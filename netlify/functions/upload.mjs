import { supabase, json } from "./_supabase.mjs";

export const config = { path: "/api/upload", maxDuration: 26 };

export default async (request) => {
  try {
    if (request.method === "GET") {
      const days = parseInt(process.env.DELETE_AFTER_DAYS || "30", 10);
      return json({ ok: true, deleteAfterDays: days });
    }

    const token = request.headers.get("x-admin-token");
    if (!token || token !== process.env.ADMIN_UPLOAD_TOKEN) {
      return json({ error: "Unauthorized: missing or invalid ADMIN_UPLOAD_TOKEN" }, 401);
    }

    const ctype = request.headers.get("content-type") || "";
    if (!ctype.includes("multipart/form-data")) {
      return json({ error: "Use multipart/form-data" }, 400);
    }

    const form = await request.formData();
    const file = form.get("file") || (form.getAll("files") || [])[0];
    if (!file || typeof file === "string") {
      return json({ error: "No file provided (use field 'file' or 'files[]')" }, 400);
    }

    const lockedRaw = form.get("locked");
    const locked = (lockedRaw == null) ? true : (String(lockedRaw).toLowerCase() === "true");

    const id = crypto.randomUUID();
    const name = file.name || `photo-${Date.now()}`;
    const ext = (name.split(".").pop() || "jpg").toLowerCase();
    const path = `${id}/${id}.${ext}`;

    const days = parseInt(process.env.DELETE_AFTER_DAYS || "30", 10);
    const safeDays = Number.isFinite(days) ? days : 30;
    const expires_at = new Date(Date.now() + safeDays * 24 * 60 * 60 * 1000).toISOString();

    const { error: rowErr } = await supabase.from("photos").insert({ id, path, expires_at, locked });
    if (rowErr) return json({ error: rowErr.message, stage: "db-insert" }, 500);

    const { error: upErr } = await supabase.storage.from("photos").upload(path, file, {
      contentType: file.type || "application/octet-stream"
    });
    if (upErr) return json({ error: upErr.message, stage: "storage-upload" }, 500);

    const origin = new URL(request.url).origin;
    return json({
      id,
      locked,
      expiresAt: expires_at,
      shareUrl: `${origin}/share/${id}`,
      apiShareUrl: `${origin}/api/share?id=${id}`
    });
  } catch (e) {
    return json({ error: e.message || "Unexpected error", stage: "exception" }, 500);
  }
};
