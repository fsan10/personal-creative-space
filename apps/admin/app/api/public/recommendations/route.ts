import { publicContent } from '../../../../lib/content';
import { json,getSetting } from '../../../../lib/server';
import { recommend,defaultRecommendation } from '../../../../lib/recommendation';
export async function GET(request:Request){const p=new URL(request.url).searchParams;const count=Number(p.get('count'));return json({items:recommend(await publicContent(),await getSetting('recommendation',defaultRecommendation),{count:Number.isFinite(count)&&count>0?count:6,seed:(p.get('seed')??'default').slice(0,100),topics:(p.get('topics')??'').split(',').filter(Boolean).slice(0,15)})});}
