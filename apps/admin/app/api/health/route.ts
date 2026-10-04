import { db, json } from '../../../lib/server';
export async function GET() {
  try { await db().prepare('SELECT count(*) AS n FROM contents').first(); return json({ ok: true, storage: 'D1', media: 'R2', version: 1 }); }
  catch { return json({ ok: false, error: '内容数据库尚未就绪' }, 503); }
}
