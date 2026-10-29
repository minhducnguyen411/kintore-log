# 筋トレ歴史の記録 (kintore-log)

ジムのインターバル中にスマホで素早く記録できる、モバイルファーストの筋トレ記録Webアプリ。

## 構成

| 部分 | 技術 | 場所 |
|---|---|---|
| 画面 (フロントエンド) | HTML / CSS / JavaScript | `public/` |
| API (バックエンド) | Node.js (Vercel Functions) | `api/` |
| データベース | PostgreSQL (本番: Neon / ローカル: PGlite) | `db/schema.sql` |

ログインはなし。ブラウザごとにランダムなID (`X-Device-Id`) を作り、データを分けている。

## API

| メソッド | URL | 内容 |
|---|---|---|
| GET | `/api/records` | 自分の記録を全部取得 |
| POST | `/api/records` | 記録を1件追加 |
| DELETE | `/api/records` | 自分の記録を全部削除 |
| PUT | `/api/records/:id` | 記録を修正 |
| DELETE | `/api/records/:id` | 記録を削除 |
| GET / POST | `/api/exercises` | 自分で追加した種目 |
| POST | `/api/demo` | サンプルデータを作る |

## ローカルで動かす

```bash
npm install
npm run dev   # http://localhost:3000
npm test
```

`DATABASE_URL` がなければ、`.data/` にローカルのデータベースが自動で作られる。
