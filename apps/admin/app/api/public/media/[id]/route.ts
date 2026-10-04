import { serveMedia } from '../../../../../lib/media';
export async function GET(request:Request,{params}:{params:Promise<{id:string}>}){return serveMedia((await params).id,request,true);}
