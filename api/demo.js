import { getDeviceId, methodNotAllowed, serverError } from "./_lib/http.js";
import { createWorkout, deleteAllWorkouts } from "./_lib/workouts.js";

// POST /api/demo { today: "YYYY-MM-DD" }
// 発表・お試し用に、今日までの8週間分のサンプル記録を作る（今のデータは消える）
export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);
  const deviceId = getDeviceId(req, res);
  if (!deviceId) return;

  const today = String(req.body?.today ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(today) || Number.isNaN(Date.parse(today))) {
    return res.status(400).json({ error: "日付が正しくありません" });
  }

  try {
    await deleteAllWorkouts(deviceId);
    const workouts = buildDemoWorkouts(today);
    for (const w of workouts) {
      await createWorkout(deviceId, w);
    }
    res.status(201).json({ count: workouts.length });
  } catch (err) {
    serverError(res, err);
  }
}

// 曜日ごとのメニュー（0=日曜）。start は8週間前の重量、step は1週間ごとに増やす重量
const PLAN = {
  1: [
    { exercise: "Bench Press", start: 40, step: 2.5, reps: [10, 8, 8], rest: "2'00\"" },
    { exercise: "Incline Dumbbell Press", start: 12, step: 1, reps: [12, 10, 10], rest: "1'30\"" },
    { exercise: "Lateral Raise", start: 6, step: 0.5, reps: [15, 12, 12], rest: "1'00\"" },
  ],
  3: [
    { exercise: "Lat Pulldown", start: 35, step: 2.5, reps: [12, 10, 8], rest: "1'30\"" },
    { exercise: "Barbell Row", start: 30, step: 2.5, reps: [10, 10, 8], rest: "2'00\"" },
    { exercise: "Dumbbell Curl", start: 8, step: 0.5, reps: [12, 10, 10], rest: "1'00\"" },
  ],
  6: [
    { exercise: "Squat", start: 50, step: 5, reps: [10, 8, 6], rest: "2'30\"" },
    { exercise: "Leg Press", start: 80, step: 10, reps: [12, 10, 10], rest: "2'00\"" },
  ],
};

const MEMOS = ["", "", "", "調子が良かった", "少し肩に違和感", "睡眠不足で重く感じた", "フォームを意識した"];

function buildDemoWorkouts(today) {
  const end = new Date(`${today}T00:00:00Z`);
  const workouts = [];
  for (let daysAgo = 55; daysAgo >= 0; daysAgo--) {
    const day = new Date(end);
    day.setUTCDate(end.getUTCDate() - daysAgo);
    const menu = PLAN[day.getUTCDay()];
    if (!menu) continue;

    const week = Math.floor((55 - daysAgo) / 7);
    const date = day.toISOString().slice(0, 10);
    menu.forEach((m, i) => {
      const top = m.start + m.step * week;
      workouts.push({
        date,
        exercise: m.exercise,
        // 1セット目は軽め、だんだん重くする
        sets: m.reps.map((reps, n) => ({ weight: top - m.step * (m.reps.length - 1 - n), reps })),
        rest: m.rest,
        memo: MEMOS[(daysAgo + i) % MEMOS.length],
      });
    });
  }
  return workouts;
}
