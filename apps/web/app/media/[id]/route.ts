import { cms } from '../../../lib/cms';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){
  const id=(await params).id;if(!/^[a-f0-9-]{36}$/.test(id))return new Response('不存在',{status:404});
  try{const headers=new Headers();const range=request.headers.get('range');if(range)headers.set('Range',range);const r=await cms(`/api/public/media/${id}`,{headers});const output=new Headers();for(const name of ['Content-Type','Content-Length','Content-Range','Accept-Ranges','ETag']){const value=r.headers.get(name);if(value)output.set(name,value);}output.set('Cache-Control','public, max-age=60');output.set('X-Content-Type-Options','nosniff');return new Response(r.body,{status:r.status,headers:output});}
  catch{return new Response('媒体暂时不可用',{status:503});}
}
