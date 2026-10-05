import { env } from 'cloudflare:workers';
import { db } from './server';
import { mediaRange } from './media-range';
export type MediaItem={id:string;name:string;object_key:string;mime:string;size:number;sha256:string;created_at:string;url:string};
const supported=['image/png','image/jpeg','image/webp','image/gif','video/mp4','video/webm'];
export function validSignature(mime:string,bytes:Uint8Array):boolean {
  const text=(a:number,b:number)=>String.fromCharCode(...bytes.slice(a,b));
  return mime==='image/png'?text(1,4)==='PNG'&&bytes[0]===137:
    mime==='image/jpeg'?bytes[0]===255&&bytes[1]===216&&bytes[2]===255:
    mime==='image/gif'?text(0,6)==='GIF87a'||text(0,6)==='GIF89a':
    mime==='image/webp'?text(0,4)==='RIFF'&&text(8,12)==='WEBP':
    mime==='video/mp4'?text(4,8)==='ftyp':mime==='video/webm'?bytes[0]===26&&bytes[1]===69&&bytes[2]===223&&bytes[3]===163:false;
}
export async function mediaList():Promise<MediaItem[]> {
  const rows=await db().prepare('SELECT * FROM media ORDER BY created_at DESC LIMIT 1000').all<MediaItem>();
  return rows.results.map(item=>({...item,url:`/media/${item.id}`}));
}
export async function uploadMedia(file:File):Promise<MediaItem> {
  if(!supported.includes(file.type))throw new Error('支持 PNG、JPEG、WebP、GIF、MP4 和 WebM');
  const limit=file.type.startsWith('image/')?10*1024*1024:25*1024*1024;
  if(file.size===0||file.size>limit)throw new Error(file.type.startsWith('image/')?'图片需小于 10 MB':'视频需小于 25 MB；更大的视频请插入外部链接');
  if(!env.BUCKET)throw new Error('媒体存储尚未连接');
  const bytes=new Uint8Array(await file.arrayBuffer());
  if(!validSignature(file.type,bytes))throw new Error('文件格式与内容不一致');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
  const existing=await db().prepare('SELECT * FROM media WHERE sha256=? LIMIT 1').bind(hash).first<MediaItem>();
  if(existing)return {...existing,url:`/media/${existing.id}`};
  const id=crypto.randomUUID(),key=`media/${id}`,created=new Date().toISOString(),name=file.name.slice(0,240);
  await env.BUCKET.put(key,bytes,{httpMetadata:{contentType:file.type},customMetadata:{sha256:hash}});
  try{await db().prepare('INSERT INTO media (id,name,object_key,mime,size,sha256,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,name,key,file.type,file.size,hash,created).run();}
  catch(error){await env.BUCKET.delete(key);throw error;}
  return {id,name,object_key:key,mime:file.type,size:file.size,sha256:hash,created_at:created,url:`/media/${id}`};
}
export async function serveMedia(id:string,request:Request,publicOnly=false):Promise<Response> {
  if(!env.BUCKET)return new Response('媒体存储未连接',{status:503});
  if(!/^[a-f0-9-]{36}$/.test(id))return new Response('不存在',{status:404});
  if(publicOnly){
    const published=await db().prepare('SELECT id FROM contents WHERE live_json IS NOT NULL AND public_at<=? AND trashed_at IS NULL AND instr(live_json,?)>0 LIMIT 1').bind(new Date().toISOString(),`/media/${id}`).first();
    if(!published)return new Response('不存在',{status:404});
  }
  const media=await db().prepare('SELECT * FROM media WHERE id=?').bind(id).first<MediaItem>();
  if(!media)return new Response('不存在',{status:404});
  const range=mediaRange(request.headers.get('Range'),media.size);
  if(range.kind==='unsatisfiable')return new Response(null,{status:416,headers:{'Content-Range':`bytes */${media.size}`,'Accept-Ranges':'bytes'}});
  const object=await env.BUCKET.get(media.object_key,range.kind==='partial'?{range:{offset:range.offset,length:range.length}}:undefined);
  if(!object)return new Response('不存在',{status:404});
  const headers=new Headers({'Content-Type':media.mime,'X-Content-Type-Options':'nosniff','Content-Disposition':'inline','Cache-Control':'private, max-age=60','Accept-Ranges':'bytes'});
  headers.set('ETag',object.httpEtag);
  if(range.kind==='partial'){headers.set('Content-Range',`bytes ${range.offset}-${range.offset+range.length-1}/${object.size}`);headers.set('Content-Length',String(range.length));return new Response(object.body,{status:206,headers});}
  headers.set('Content-Length',String(object.size));return new Response(object.body,{headers});
}
