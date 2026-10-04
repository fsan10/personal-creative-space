import { publicContent } from '../../../../lib/content';
import { json, getSetting } from '../../../../lib/server';
import { defaultRecommendation,normaliseOptions } from '../../../../lib/recommendation';
export async function GET() {
  const items=await publicContent(),recommendation=normaliseOptions(await getSetting('recommendation',defaultRecommendation));
  recommendation.pins=recommendation.pins.filter(id=>items.some(item=>item.id===id));
  return json({ items,recommendation, profile:await getSetting('profile',{
    name:'橘子', tagline:'把想法写下来，把喜欢的东西做出来。', bio:'这里是我的文章、作品与持续进行的实验。', github:'https://github.com/fsan10',
  }) });
}
