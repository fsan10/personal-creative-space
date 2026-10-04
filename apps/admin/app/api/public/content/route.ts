import { publicContent } from '../../../../lib/content';
import { json, getSetting } from '../../../../lib/server';
export async function GET() {
  return json({ items:await publicContent(), profile:await getSetting('profile',{
    name:'橘子', tagline:'把想法写下来，把喜欢的东西做出来。', bio:'这里是我的文章、作品与持续进行的实验。', github:'https://github.com/fsan10',
  }) });
}
