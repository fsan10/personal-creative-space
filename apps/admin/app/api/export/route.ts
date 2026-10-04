import { authorize,json,getSetting } from '../../../lib/server';
import { listContent } from '../../../lib/content';
import { mediaList } from '../../../lib/media';
export async function GET(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  return json({format:'creative-space',version:1,exportedAt:new Date().toISOString(),contents:await listContent(),media:await mediaList(),settings:{profile:await getSetting('profile',{}),recommendation:await getSetting('recommendation',{})}});
}
