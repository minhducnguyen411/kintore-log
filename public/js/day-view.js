import { getDeviceId, todayString } from "./device.js";
import { formatJapaneseDate } from "./format.js";
import { createRecordCard } from "./record-card.js";

// confirm.html と detail.html の両方で使う: 1日分の記録を表示する

const list = document.getElementById("record-list");
const dateTitle = document.getElementById("day-date");
const addLink = document.getElementById("add-link");

/* ===== 1. URL から表示する日付と、さっき登録した記録の id を読む ===== */
const params = new URLSearchParams(location.search);
const date = params.get("date") ?? todayString();
const newId = Number(params.get("new"));

dateTitle.textContent = formatJapaneseDate(date);
addLink.href = `input.html?date=${date}`;

/* ===== 2. サーバーから記録を取ってきて、この日の分だけ表示する ===== */
async function loadRecords() {
  // ===== BÀI TẬP 3-A: Duc viết code ở đây =====
  //
  // TODO 1: fetch GET /api/records (giống Console ở Bài 1, KHÔNG cần method / body).
  //         Nhớ gửi header "X-Device-Id": getDeviceId()
  const res = await fetch("/api/records", {
    headers: {
      "X-Device-Id": getDeviceId(),
    },
  });
  // TODO 2: Đọc JSON vào biến records (đây là mảng TẤT CẢ bản ghi của mình).
  const records = await res.json();
  //

  //
  // TODO 3: Lọc ra những bản ghi của ngày đang xem, cất vào biến todays.
  //         Gợi ý: records.filter((w) => ...)  ← điều kiện: ngày của w bằng biến date

  const todays = records.filter((wr) => wr.date === date); //wr = 1 workout records

  list.replaceChildren(); // xoá chữ "読み込み中..." / danh sách cũ
  if (todays.length === 0) {
    list.textContent = "この日の記録はありません";
    return;
  }

  // TODO 4: Với mỗi workout trong todays, tạo thẻ và gắn vào list:
  //           list.append(createRecordCard(workout, { isNew: workout.id === newId, onDelete: deleteRecord }));
  //         Gợi ý: for (const workout of todays) { ... }
}

/* ===== 3. 記録を削除する ===== */
async function deleteRecord(workout) {
  if (!confirm(`${workout.exercise} の記録を削除しますか？`)) return;

  // ===== BÀI TẬP 3-B: Duc viết code ở đây =====
  //
  // TODO 5: fetch tới URL `/api/records/${workout.id}` với method "DELETE"
  //         và header "X-Device-Id". (Chú ý dấu ` chứ không phải dấu ")
  //
  //         ⚠️ Không cần await res.json(): 204 = server không gửi gì về.
  //
  // TODO 6: Nếu res.status là 204 (xoá thành công) thì gọi loadRecords() để vẽ lại danh sách.
  //         Nếu không thì alert("削除できませんでした");
}

loadRecords().catch(() => {
  list.textContent = "読み込みに失敗しました。通信状態を確認してください";
});
