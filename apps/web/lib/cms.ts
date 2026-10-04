import { env } from 'cloudflare:workers';
export async function cms(path: string, init: RequestInit = {}) {
  if (!env.CMS_ORIGIN || !env.CMS_SITE_TOKEN) throw new Error('管理端尚未连接');
  if (!path.startsWith('/api/public/')) throw new Error('只允许访问公开内容 API');
  const origin = new URL(env.CMS_ORIGIN);
  if (origin.protocol !== 'https:') throw new Error('内容服务需要 HTTPS');
  const headers = new Headers(init.headers);
  headers.set('OAI-Sites-Authorization', `Bearer ${env.CMS_SITE_TOKEN}`);
  return fetch(new URL(path, origin), { ...init, headers, redirect: 'error' });
}
