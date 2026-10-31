// 1件の記録をカードの形にして返す
// innerHTML に文字を直接入れず textContent を使う → メモに <script> などが入っていても実行されない
export function createRecordCard(workout, { isNew = false, onDelete } = {}) {
  const card = document.createElement("div");
  card.className = isNew ? "record-card new" : "record-card";

  // --- ヘッダー: 種目名 + 削除ボタン ---
  const header = document.createElement("div");
  header.className = "record-card-header";

  const name = document.createElement("span");
  name.className = "exercise-name";
  name.textContent = workout.exercise;
  header.append(name);

  if (isNew) {
    const badge = document.createElement("span");
    badge.className = "new-badge";
    badge.textContent = "NEW";
    name.append(" ", badge);
  }

  if (onDelete) {
    const deleteBtn = document.createElement("button");
    deleteBtn.type = "button";
    deleteBtn.className = "delete-btn";
    deleteBtn.setAttribute("aria-label", "この記録を削除");
    deleteBtn.innerHTML = '<i class="fa-solid fa-trash-can"></i>';
    deleteBtn.addEventListener("click", () => onDelete(workout));
    header.append(deleteBtn);
  }
  card.append(header);

  // --- セットの表 ---
  const table = document.createElement("table");
  table.className = "record-table";
  workout.sets.forEach((set, i) => {
    const row = table.insertRow();
    const th = document.createElement("th");
    th.textContent = `セット${i + 1}`;
    row.append(th);
    row.insertCell().textContent = `${set.weight} kg × ${set.reps} 回`;
  });
  if (workout.rest) {
    const row = table.insertRow();
    const th = document.createElement("th");
    th.textContent = "インターバル";
    row.append(th);
    row.insertCell().textContent = workout.rest;
  }
  card.append(table);

  // --- メモ（あるときだけ） ---
  if (workout.memo) {
    const memo = document.createElement("div");
    memo.className = "memo-box";
    memo.textContent = `メモ: ${workout.memo}`;
    card.append(memo);
  }

  return card;
}
