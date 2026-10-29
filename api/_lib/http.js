// 全APIで使う共通処理

// ログインの代わりに、ブラウザごとに作るランダムなIDでデータを分ける
export function getDeviceId(req, res) {
  const id = req.headers["x-device-id"];
  if (typeof id !== "string" || !/^[A-Za-z0-9-]{8,64}$/.test(id)) {
    res.status(400).json({ error: "X-Device-Id ヘッダーが必要です" });
    return null;
  }
  return id;
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  res.status(405).json({ error: "このメソッドは使えません" });
}

export function serverError(res, err) {
  console.error(err);
  res.status(500).json({ error: "サーバーエラーが発生しました" });
}
