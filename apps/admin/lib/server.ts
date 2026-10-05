import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '../app/chatgpt-auth';
export function db(): D1Database {
  if (!env.DB) throw new Error('内容数据库尚未连接');
  return env.DB;
}
export function json(data: unknown, status = 200): Response {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } });
}
export async function authorize(request: Request): Promise<boolean> {
  const origin = request.headers.get('origin');
  if (origin && origin !== new URL(request.url).origin) return false;
  if (await getChatGPTUser()) return true;
  const supplied = request.headers.get('x-admin-service-key');
  if (!supplied) return false;
  for (const expected of [env.ADMIN_SERVICE_KEY,env.ADMIN_AUTOMATION_KEY]) {
    if (!expected || expected.length !== supplied.length) continue;
    let difference=0;for(let i=0;i<expected.length;i++)difference|=expected.charCodeAt(i)^supplied.charCodeAt(i);
    if(difference===0)return true;
  }
  return false;
}
export async function getSetting(key: string, fallback: unknown) {
  const row = await db().prepare('SELECT data_json FROM settings WHERE key = ?').bind(key).first<{data_json: string}>();
  return row ? JSON.parse(row.data_json) : fallback;
}
export async function setSetting(key: string, value: unknown) {
  await db().prepare('INSERT INTO settings (key,data_json,updated_at) VALUES (?,?,?) ON CONFLICT(key) DO UPDATE SET data_json=excluded.data_json,updated_at=excluded.updated_at')
    .bind(key, JSON.stringify(value), new Date().toISOString()).run();
}
