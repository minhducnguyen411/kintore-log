import { getDeviceId, methodNotAllowed, serverError } from "../_lib/http.js";
import {
  createWorkout,
  deleteAllWorkouts,
  listWorkouts,
  validateWorkout,
} from "../_lib/workouts.js";

// GET  /api/records  自分の記録を全部取得
// POST /api/records  記録を1件追加
// DELETE /api/records  自分の記録を全部削除
export default async function handler(req, res) {
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  try {
    if (req.method === "GET") {
      return res.status(200).json(await listWorkouts(deviceId));
    }
    if (req.method === "POST") {
      const { error, value } = validateWorkout(req.body);
      if (error) return res.status(400).json({ error });
      const id = await createWorkout(deviceId, value);
      return res.status(201).json({ id });
    }
    if (req.method === "DELETE") {
      await deleteAllWorkouts(deviceId);
      return res.status(204).end();
    }
    methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (err) {
    serverError(res, err);
  }
}
