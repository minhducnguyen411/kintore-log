import { getDeviceId, methodNotAllowed, serverError } from "../_lib/http.js";
import { deleteWorkout, updateWorkout, validateWorkout } from "../_lib/workouts.js";

// PUT    /api/records/:id  記録を修正
// DELETE /api/records/:id  記録を削除
export default async function handler(req, res) {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  const id = Number(req.query.id);
  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({ error: "IDが正しくありません" });
  }

  try {
    if (req.method === "PUT") {
      const { error, value } = validateWorkout(req.body);
      if (error) return res.status(400).json({ error });
      const found = await updateWorkout(deviceId, id, value);
      if (!found) return res.status(404).json({ error: "記録が見つかりません" });
      return res.status(200).json({ id });
    }
    if (req.method === "DELETE") {
      const found = await deleteWorkout(deviceId, id);
      if (!found) return res.status(404).json({ error: "記録が見つかりません" });
      return res.status(204).end();
    }
    methodNotAllowed(res, ["PUT", "DELETE"]);
  } catch (err) {
    serverError(res, err);
  }
}
