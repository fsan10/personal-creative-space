import Collection from '../../components/Collection';
import { getPublicData } from '../../lib/public-data';
export const dynamic='force-dynamic';
export const metadata={title:'作品',description:'个人项目、交互实验与正在持续生长的作品。'};
export default async function Page(){const {items}=await getPublicData();return <div className="collection-page"><header className="page-heading"><span className="page-mark">✳</span><h1>做点喜欢的东西。</h1><p>从一个念头，到能被看见、被使用的作品。<br/>这里收下每一次尝试。</p></header><Collection items={items.filter(item=>item.kind==='project')} kind="project"/></div>;}
