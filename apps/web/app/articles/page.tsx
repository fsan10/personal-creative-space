import Collection from '../../components/Collection';
import { getPublicData } from '../../lib/public-data';
export const dynamic='force-dynamic';
export const metadata={title:'文章',description:'写在创作途中的想法、笔记与过程。'};
export default async function Page(){const {items}=await getPublicData();return <div className="collection-page"><header className="page-heading"><span className="page-mark">✎</span><h1>写在途中。</h1><p>一些想法，一些过程。<br/>文字让它们有了可以回看的形状。</p></header><Collection items={items.filter(item=>item.kind==='article')} kind="article"/></div>;}
