import { query } from "./db.js";

// 入力チェック。問題があればエラーメッセージ、なければ整えたデータを返す
export function validateWorkout(body) {
  if (!body || typeof body !== "object") return { error: "データが空です" };

  const date = String(body.date ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date))) {
    return { error: "日付が正しくありません" };
  }
  const back = new Date(date + "T00:00:00Z").toISOString().slice(0, 10);
  if (date !== back) {
    return { error: "日付が正しくありません" };
  }
  const exercise = String(body.exercise ?? "").trim();

  if (exercise.length < 1 || exercise.length > 50) {
    return { error: "種目名は1〜50文字で入力してください" };
  }

  if (
    !Array.isArray(body.sets) ||
    body.sets.length < 1 ||
    body.sets.length > 20
  ) {
    return { error: "セットは1〜20個で入力してください" };
  }
  const sets = [];
  for (const s of body.sets) {
    const weight = Number(s?.weight);
    const reps = Number(s?.reps);
    if (!Number.isFinite(weight) || weight < 0 || weight > 1000) {
      return { error: "重量は0〜1000kgで入力してください" };
    }
    if (!Number.isInteger(reps) || reps < 1 || reps > 1000) {
      return { error: "レップは1以上の整数で入力してください" };
    }
    sets.push({ weight, reps });
  }

  const rest = String(body.rest ?? "")
    .trim()
    .slice(0, 20);
  const memo = String(body.memo ?? "")
    .trim()
    .slice(0, 500);

  return { value: { date, exercise, sets, rest, memo } };
}

// 種目記録と各セットをまとめて取得する（1件の記録にセットの配列を付ける）
export async function listWorkouts(deviceId) {
  return query(
    `SELECT w.id,
            to_char(w.date, 'YYYY-MM-DD') AS date,
            w.exercise, w.rest, w.memo,
            COALESCE(
              json_agg(json_build_object('weight', s.weight::float8, 'reps', s.reps)
                       ORDER BY s.set_no)
                FILTER (WHERE s.id IS NOT NULL),
              '[]'
            ) AS sets
       FROM workouts w
       LEFT JOIN workout_sets s ON s.workout_id = w.id
      WHERE w.device_id = $1
      GROUP BY w.id
      ORDER BY w.date, w.id`,
    [deviceId],
  );
}

// 記録とセットを1つのSQL文で保存する（途中で失敗しても中途半端なデータが残らない）
export async function createWorkout(deviceId, w) {
  const rows = await query(
    `WITH new_workout AS (
       INSERT INTO workouts (device_id, date, exercise, rest, memo)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id
     )
     INSERT INTO workout_sets (workout_id, set_no, weight, reps)
     SELECT new_workout.id, s.set_no, s.weight, s.reps
       FROM new_workout,
            unnest($6::numeric[], $7::int[]) WITH ORDINALITY AS s(weight, reps, set_no)
     RETURNING workout_id`,
    [deviceId, w.date, w.exercise, w.rest, w.memo, ...setArrays(w.sets)],
  );
  return rows[0].workout_id;
}

// 記録を更新し、セットは一度消してから入れ直す
export async function updateWorkout(deviceId, id, w) {
  const rows = await query(
    `WITH updated AS (
       UPDATE workouts SET date = $3, exercise = $4, rest = $5, memo = $6
        WHERE id = $1 AND device_id = $2
       RETURNING id
     ), removed AS (
       DELETE FROM workout_sets WHERE workout_id IN (SELECT id FROM updated)
     )
     INSERT INTO workout_sets (workout_id, set_no, weight, reps)
     SELECT updated.id, s.set_no, s.weight, s.reps
       FROM updated,
            unnest($7::numeric[], $8::int[]) WITH ORDINALITY AS s(weight, reps, set_no)
     RETURNING workout_id`,
    [id, deviceId, w.date, w.exercise, w.rest, w.memo, ...setArrays(w.sets)],
  );
  return rows.length > 0;
}

export async function deleteWorkout(deviceId, id) {
  const rows = await query(
    "DELETE FROM workouts WHERE id = $1 AND device_id = $2 RETURNING id",
    [id, deviceId],
  );
  return rows.length > 0;
}

export async function deleteAllWorkouts(deviceId) {
  await query("DELETE FROM workouts WHERE device_id = $1", [deviceId]);
}

function setArrays(sets) {
  return [sets.map((s) => s.weight), sets.map((s) => s.reps)];
}
