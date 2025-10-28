// server/sqlHelpers.ts
// Lightweight helpers with `any`-typed DB to avoid bundling sqlite3 types here
export const runAsync = (db: any, sql: string, params: any[] = []) =>
  new Promise((resolve, reject) => db.run(sql, params, (err: any) => { err ? reject(err) : resolve(null); }));
export const getAsync = (db: any, sql: string, params: any[] = []) =>
  new Promise((resolve, reject) => db.get(sql, params, (err: any, row: any) => err ? reject(err) : resolve(row)));
export const allAsync = (db: any, sql: string, params: any[] = []) =>
  new Promise((resolve, reject) => db.all(sql, params, (err: any, rows: any) => err ? reject(err) : resolve(rows)));
