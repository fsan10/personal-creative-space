import { authorize,json } from '../../../lib/server';
import { mediaList,uploadMedia } from '../../../lib/media';
export async function GET(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);return json({items:await mediaList()});}
export async function POST(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  if(Number(request.headers.get('content-length'))>26*1024*1024)return json({error:'上传文件过大'},413);
  try{const form=await request.formData(),file=form.get('file');if(!(file instanceof File))return json({error:'请选择一个媒体文件'},400);return json({item:await uploadMedia(file)});}
  catch(e){return json({error:(e as Error).message},400);}
}
