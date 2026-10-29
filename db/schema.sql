-- 1回の種目記録（例: 2026-10-17 の Bench Press）
CREATE TABLE IF NOT EXISTS workouts (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  date DATE NOT NULL,
  exercise TEXT NOT NULL,
  rest TEXT NOT NULL DEFAULT '',
  memo TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS workouts_device_date ON workouts (device_id, date);

-- 各セットの重量とレップ（workouts 1件 : workout_sets 多件）
CREATE TABLE IF NOT EXISTS workout_sets (
  id SERIAL PRIMARY KEY,
  workout_id INTEGER NOT NULL REFERENCES workouts (id) ON DELETE CASCADE,
  set_no INTEGER NOT NULL,
  weight NUMERIC(6, 2) NOT NULL CHECK (weight >= 0),
  reps INTEGER NOT NULL CHECK (reps > 0)
);

CREATE INDEX IF NOT EXISTS workout_sets_workout ON workout_sets (workout_id);

-- ユーザーが自分で追加した種目
CREATE TABLE IF NOT EXISTS exercises (
  id SERIAL PRIMARY KEY,
  device_id TEXT NOT NULL,
  name TEXT NOT NULL,
  UNIQUE (device_id, name)
);
