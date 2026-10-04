import { z } from 'zod';
import {connectionStatus} from '../../../lib/coolify';
import { authorize,json,getSetting,setSetting } from '../../../lib/server';
import { defaultRecommendation,normaliseOptions } from '../../../lib/recommendation';
const profileSchema=z.object({name:z.string().trim().min(1).max(40),tagline:z.string().max(160),bio:z.string().max(1800),github:z.string().url().max(2000).refine(url=>url.startsWith('https://github.com/'))});
const recommendationSchema=z.object({weights:z.object({editorial:z.number().min(0).max(1),completeness:z.number().min(0).max(1),freshness:z.number().min(0).max(1),engagement:z.number().min(0).max(1),relevance:z.number().min(0).max(1)}),pins:z.array(z.string().uuid()).max(20),exploration:z.number().min(0).max(.2)}).refine(value=>Object.values(value.weights).some(weight=>weight>0));
export async function GET(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  return json({profile:await getSetting('profile',{name:'橘子',tagline:'把想法写下来，把喜欢的东西做出来。',bio:'这里是我的文章、作品与持续进行的实验。',github:'https://github.com/fsan10'}),recommendation:await getSetting('recommendation',defaultRecommendation),connections:{coolify:(await connectionStatus()).configured,distribution:'browser_extension'}});
}
export async function PUT(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  try{const data=await request.json() as Record<string,unknown>;
    if(data.profile)await setSetting('profile',profileSchema.parse(data.profile));
    if(data.recommendation)await setSetting('recommendation',normaliseOptions(recommendationSchema.parse(data.recommendation)));
    return json({ok:true});
  }catch{return json({error:'设置格式不正确，请检查名称、链接或推荐权重'},400);}
}
