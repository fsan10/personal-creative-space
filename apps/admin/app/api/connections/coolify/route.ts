import {z} from 'zod';
import {authorize,json} from '../../../../lib/server';
import {connectionStatus,testConnection,saveConnection,clearConnection} from '../../../../lib/coolify';
export async function GET(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);return json(await connectionStatus());}
export async function POST(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);try{const value=z.object({url:z.string().max(2000),token:z.string().min(10).max(4000)}).parse(await request.json());await testConnection(value.url,value.token);await saveConnection(value.url,value.token);return json({ok:true,...await connectionStatus()});}catch(e){return json({error:(e as Error).message.length<200?(e as Error).message:'连接参数不正确'},400);}}
export async function DELETE(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);try{await clearConnection();return json({ok:true});}catch(e){return json({error:(e as Error).message},400);}}
