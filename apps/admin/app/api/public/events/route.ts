import { z } from 'zod';
import { env } from 'cloudflare:workers';
import { db,json } from '../../../../lib/server';
const schema=z.object({contentId:z.string().uuid(),session:z.string().uuid(),kind:z.enum(['view','read'])});
export async function POST(request:Request){
  try{
    const data=schema.parse(await request.json()),day=new Date().toISOString().slice(0,10);
    const content=await db().prepare('SELECT id FROM contents WHERE id=? AND live_json IS NOT NULL AND public_at<=? AND trashed_at IS NULL').bind(data.contentId,new Date().toISOString()).first();
    if(!content)return json({error:'内容不存在'},404);
    const encoded=new TextEncoder().encode(`${env.ADMIN_SERVICE_KEY}:${day}:${data.session}:${data.contentId}:${data.kind}`);
    const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',encoded)),n=>n.toString(16).padStart(2,'0')).join('');
    await db().batch([
      db().prepare('INSERT OR IGNORE INTO events (id,content_id,kind,day) VALUES (?,?,?,?)').bind(hash,data.contentId,data.kind,day),
      db().prepare('INSERT INTO metrics (content_id,views,reads) SELECT ?,?,? WHERE changes()>0 ON CONFLICT(content_id) DO UPDATE SET views=views+excluded.views,reads=reads+excluded.reads').bind(data.contentId,data.kind==='view'?1:0,data.kind==='read'?1:0),
    ]);
    return json({ok:true});
  }catch{return json({error:'阅读事件格式不正确'},400);}
}
