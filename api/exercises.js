import { query } from "./_lib/db.js";
import { getDeviceId, methodNotAllowed, serverError } from "./_lib/http.js";

// GET  /api/exercises  自分で追加した種目の一覧
// POST /api/exercises  種目を追加 { name }
export default async function handler(req, res) {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  try {
    if (req.method === "GET") {
      const rows = await query(
        "SELECT name FROM exercises WHERE device_id = $1 ORDER BY id",
        [deviceId],
      );
      return res.status(200).json(rows.map((r) => r.name));
    }
    if (req.method === "POST") {
      const name = String(req.body?.name ?? "").trim();
      if (name.length < 1 || name.length > 50) {
        return res.status(400).json({ error: "種目名は1〜50文字で入力してください" });
      }
      await query(
        `INSERT INTO exercises (device_id, name) VALUES ($1, $2)
         ON CONFLICT (device_id, name) DO NOTHING`,
        [deviceId, name],
      );
      return res.status(201).json({ name });
    }
    methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    serverError(res, err);
  }
}
