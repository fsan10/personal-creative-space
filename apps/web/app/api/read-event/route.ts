import { cms } from '../../../lib/cms';
export async function POST(request:Request){
  const origin=request.headers.get('origin');if(origin&&origin!==new URL(request.url).origin)return Response.json({error:'来源不匹配'},{status:403});
  if(request.headers.get('dnt')==='1')return Response.json({ok:true,skipped:true});
  try{const body=await request.text();if(body.length>1024)return Response.json({error:'请求过大'},{status:413});const result=await cms('/api/public/events',{method:'POST',headers:{'Content-Type':'application/json'},body});return new Response(result.body,{status:result.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});}
  catch{return Response.json({error:'记录暂时不可用'},{status:503});}
}
