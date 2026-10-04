import { authorize } from '../../../lib/server';
import { serveMedia } from '../../../lib/media';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){if(!await authorize(request))return new Response('请先登录',{status:401});return serveMedia((await params).id,request);}
