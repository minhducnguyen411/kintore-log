import { getDeviceId, todayString } from "./device.js";

const form = document.getElementById("input-form");
const dateInput = document.getElementById("val-date");
const exerciseSelect = document.getElementById("exercise-select");
const myExercises = document.getElementById("my-exercises");
const setList = document.getElementById("set-list");
const addSetBtn = document.getElementById("add-set-btn");
const errorBox = document.getElementById("form-error");
const submitBtn = form.querySelector(".submit-btn");

/* ===== 1. 日付: URL に ?date= があればその日、なければ今日 ===== */
const params = new URLSearchParams(location.search);
dateInput.value = params.get("date") ?? todayString();

/* ===== 2. セットの行を追加・削除する ===== */
function addSetRow(weight = "", reps = "") {
  const row = document.createElement("div");
  row.className = "set-row";
  row.innerHTML = `
    <span class="set-no"></span>
    <input type="number" class="input-field set-weight" inputmode="decimal"
           min="0" step="0.5" placeholder="kg" />
    <input type="number" class="input-field set-reps" inputmode="numeric"
           min="1" step="1" placeholder="回" />
    <button type="button" class="remove-set-btn" aria-label="このセットを削除">
      <i class="fa-solid fa-xmark"></i>
    </button>`;
  row.querySelector(".set-weight").value = weight;
  row.querySelector(".set-reps").value = reps;
  row.querySelector(".remove-set-btn").addEventListener("click", () => {
    if (setList.children.length > 1) {
      row.remove();
      renumberSets();
    }
  });
  setList.append(row);
  renumberSets();
}

// セット番号 (1, 2, 3...) を振り直す
function renumberSets() {
  [...setList.children].forEach((row, i) => {
    row.querySelector(".set-no").textContent = i + 1;
  });
}

// 「セット追加」: 前のセットと同じ重量・レップをコピーして入力を楽にする
addSetBtn.addEventListener("click", () => {
  const last = setList.lastElementChild;
  addSetRow(
    last?.querySelector(".set-weight").value ?? "",
    last?.querySelector(".set-reps").value ?? "",
  );
});

addSetRow();

/* ===== 3. 自分で追加した種目をサーバーから読み込む (GET の例) ===== */
async function loadMyExercises() {
  const res = await fetch("/api/exercises", {
    headers: { "X-Device-Id": getDeviceId() },
  });
  if (!res.ok) return;
  const names = await res.json();
  for (const name of names) {
    myExercises.append(new Option(name, name));
  }
}

loadMyExercises();

/* ===== 4. 「+ 新しい種目を追加...」 (POST の例) ===== */
let previousExercise = exerciseSelect.value;

exerciseSelect.addEventListener("change", async () => {
  if (exerciseSelect.value !== "add-new") {
    previousExercise = exerciseSelect.value;
    return;
  }

  const name = prompt("新しい種目名を入力してください:")?.trim();
  if (!name) {
    exerciseSelect.value = previousExercise;
    return;
  }

  const res = await fetch("/api/exercises", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Device-Id": getDeviceId(),
    },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) {
    showError((await res.json()).error);
    exerciseSelect.value = previousExercise;
    return;
  }

  myExercises.append(new Option(name, name));
  exerciseSelect.value = name;
  previousExercise = name;
});

/* ===== 5. フォームの内容をまとめる ===== */
function collectWorkout() {
  const sets = [...setList.children].map((row) => ({
    weight: Number(row.querySelector(".set-weight").value),
    reps: Number(row.querySelector(".set-reps").value),
  }));
  return {
    date: dateInput.value,
    exercise: exerciseSelect.value,
    sets,
    rest: document.getElementById("val-rest").value,
    memo: document.getElementById("val-memo").value,
  };
}

function showError(message) {
  errorBox.textContent = message;
  errorBox.hidden = false;
}

/* ===== 6. 登録ボタン: サーバーに保存して確認画面へ ===== */
form.addEventListener("submit", async (event) => {
  event.preventDefault();
  errorBox.hidden = true;

  const workout = collectWorkout();
  if (workout.exercise === "add-new") {
    showError("種目を選択してください");
    return;
  }

  // 空欄があればサーバーに送る前に止める（すぐにエラーを見せるため）
  const hasEmpty = [...setList.querySelectorAll("input")].some(
    (input) => input.value === "",
  );
  if (hasEmpty) {
    showError("重量とレップをすべて入力してください");
    return;
  }

  submitBtn.disabled = true; // 送信中はボタンを押せなくする（二重登録を防ぐ）
  try {
    const res = await fetch("/api/records", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Device-Id": getDeviceId(),
      },
      body: JSON.stringify(workout),
    });
    const data = await res.json();

    if (res.status === 201) {
      location.href = `confirm.html?date=${workout.date}&new=${data.id}`;
    } else {
      showError(data.error);
    }
  } catch {
    showError("通信エラー: インターネット接続を確認してください");
  } finally {
    submitBtn.disabled = false;
  }
});
