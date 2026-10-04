import { authorize, db, json } from '../../../../../lib/server';
import { findContent, saveContent } from '../../../../../lib/content';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await authorize(request)) return json({error:'请先登录'},401);
  const {id}=await params;
  const rows=await db().prepare('SELECT revision,created_at,data_json FROM revisions WHERE content_id=? ORDER BY revision DESC LIMIT 100').bind(id).all<{revision:number;created_at:string;data_json:string}>();
  return json({items:rows.results.map(r=>({revision:r.revision,createdAt:r.created_at,title:JSON.parse(r.data_json).title}))});
}
export async function POST(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await authorize(request)) return json({error:'请先登录'},401);
  const {id}=await params, body=await request.json() as {revision:number;expectedRevision:number}, current=await findContent(id);
  if(!Number.isInteger(body.revision)||!current||current.revision!==body.expectedRevision) return json({error:'版本已改变，请重新打开后恢复'},409);
  const row=await db().prepare('SELECT data_json FROM revisions WHERE content_id=? AND revision=?').bind(id,body.revision).first<{data_json:string}>();
  if(!row) return json({error:'这个版本不存在'},404);
  return json({item:await saveContent({...JSON.parse(row.data_json),id,expectedRevision:current.revision})});
}
