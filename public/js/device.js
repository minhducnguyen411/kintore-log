// ログインの代わりに、このブラウザ専用のIDを作って localStorage に保存する
// 2回目以降は保存したIDをそのまま使う
export function getDeviceId() {
  let id = localStorage.getItem("deviceId");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("deviceId", id);
  }
  return id;
}

// 今日の日付を "YYYY-MM-DD" で返す（日本時間など、端末の時刻で計算する）
export function todayString() {
  const d = new Date();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${month}-${day}`;
}
