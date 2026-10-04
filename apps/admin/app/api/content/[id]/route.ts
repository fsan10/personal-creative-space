import { authorize, db, json } from '../../../../lib/server';
import { findContent } from '../../../../lib/content';
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await authorize(request)) return json({error:'请先登录'},401);
  const {id}=await params, item=await findContent(id);
  if(!item) return json({error:'内容不存在'},404);
  const data=await request.json() as {action?:string;date?:string;expectedRevision?:number};
  if(data.expectedRevision!==item.revision) return json({error:'版本已改变，请重新打开内容'},409);
  const now=new Date().toISOString();
  if(data.action==='publish'||data.action==='schedule') {
    const parsed=new Date(data.date??'');
    if(data.action==='schedule'&&Number.isNaN(parsed.getTime()))return json({error:'请选择有效的发布时间'},400);
    const at=data.action==='publish'?now:parsed.toISOString();
    if(data.action==='schedule'&&at<=now) return json({error:'请选择未来的发布时间'},400);
    const result=await db().prepare('UPDATE contents SET live_json=data_json,public_at=?,updated_at=? WHERE id=? AND revision=? AND trashed_at IS NULL').bind(at,now,id,item.revision).run();
    if(!result.meta.changes)return json({error:'版本已改变，请重新打开内容'},409);
  } else if(data.action==='unpublish') {
    const result=await db().prepare('UPDATE contents SET live_json=NULL,public_at=NULL,updated_at=? WHERE id=? AND revision=?').bind(now,id,item.revision).run();
    if(!result.meta.changes)return json({error:'版本已改变，请重新打开内容'},409);
  } else if(data.action==='restore_trash') {
    const result=await db().prepare('UPDATE contents SET trashed_at=NULL,updated_at=? WHERE id=? AND revision=?').bind(now,id,item.revision).run();
    if(!result.meta.changes)return json({error:'版本已改变，请重新打开内容'},409);
  } else return json({error:'未知操作'},400);
  return json({item:await findContent(id)});
}
export async function DELETE(request:Request,{params}:{params:Promise<{id:string}>}) {
  if(!await authorize(request)) return json({error:'请先登录'},401);
  const {id}=await params;
  await db().prepare('UPDATE contents SET trashed_at=?,updated_at=? WHERE id=?').bind(new Date().toISOString(),new Date().toISOString(),id).run();
  return json({ok:true});
}
