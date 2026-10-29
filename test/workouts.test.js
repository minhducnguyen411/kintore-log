import { test } from "node:test";
import assert from "node:assert/strict";
import { validateWorkout } from "../api/_lib/workouts.js";

const valid = {
  date: "2026-10-17",
  exercise: "Bench Press",
  sets: [{ weight: 40, reps: 10 }],
  rest: "2'00\"",
  memo: "",
};

test("正しいデータはそのまま通る", () => {
  const { error, value } = validateWorkout(valid);
  assert.equal(error, undefined);
  assert.deepEqual(value.sets, [{ weight: 40, reps: 10 }]);
});

test("種目名の前後の空白は消す", () => {
  const { value } = validateWorkout({ ...valid, exercise: "  Squat  " });
  assert.equal(value.exercise, "Squat");
});

test("日付の形がおかしいとエラー", () => {
  assert.ok(validateWorkout({ ...valid, date: "2026/10/17" }).error);
});

test("存在しない日付はエラー", () => {
  assert.ok(validateWorkout({ ...valid, date: "2026-02-31" }).error);
});

test("セットが0個だとエラー", () => {
  assert.ok(validateWorkout({ ...valid, sets: [] }).error);
});

test("レップが小数だとエラー", () => {
  assert.ok(
    validateWorkout({ ...valid, sets: [{ weight: 40, reps: 2.5 }] }).error,
  );
});

test("重量がマイナスだとエラー", () => {
  assert.ok(
    validateWorkout({ ...valid, sets: [{ weight: -5, reps: 10 }] }).error,
  );
});
