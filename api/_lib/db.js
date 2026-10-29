import { mkdirSync, readFileSync } from "node:fs";

// 本番 (Vercel): DATABASE_URL の PostgreSQL (Neon) に接続する
// ローカル: DATABASE_URL が無ければ PGlite（Node 内で動く PostgreSQL）を使う
let ready;

export async function query(text, params = []) {
  // 接続に失敗したら次のリクエストでやり直す
  ready ??= connect().catch((err) => {
    ready = undefined;
    throw err;
  });
  const run = await ready;
  return run(text, params);
}

async function connect() {
  const schema = readFileSync(new URL("../../db/schema.sql", import.meta.url), "utf8");

  if (process.env.DATABASE_URL) {
    const { neon } = await import("@neondatabase/serverless");
    const sql = neon(process.env.DATABASE_URL);
    // HTTP 接続は1回に1文しか実行できないので、; で分けて順番に作る
    for (const statement of splitStatements(schema)) {
      await sql.query(statement);
    }
    return (text, params) => sql.query(text, params);
  }

  const { PGlite } = await import("@electric-sql/pglite");
  const dir = process.env.PGLITE_DIR ?? "./.data/pglite";
  mkdirSync(dir, { recursive: true });
  const db = new PGlite(dir);
  await db.exec(schema);
  return async (text, params) => (await db.query(text, params)).rows;
}

function splitStatements(sql) {
  return sql
    .split(";")
    .map((s) => s.replace(/--.*$/gm, "").trim())
    .filter(Boolean);
}
