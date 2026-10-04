import { authorize, json } from '../../../lib/server';
import { listContent, saveContent } from '../../../lib/content';
export async function GET(request:Request) {
  if(!await authorize(request)) return json({error:'请以本站主人身份登录'},401);
  return json({items:await listContent(new URL(request.url).searchParams.get('trash')==='1')});
}
export async function POST(request:Request) {
  if(!await authorize(request)) return json({error:'请以本站主人身份登录'},401);
  try { return json({item:await saveContent(await request.json())}); }
  catch(error) {
    const message=error instanceof Error?error.message:'';
    if(message==='CONFLICT') return json({error:'内容已被其他窗口更新，请重新打开后保存'},409);
    if(message==='NOT_FOUND') return json({error:'内容不存在'},404);
    if(message.includes('UNIQUE')) return json({error:'这个链接名称已被使用，请更换'},409);
    return json({error:'保存失败，请检查标题、链接名称和内容长度'},400);
  }
}
