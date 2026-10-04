import Home from '../components/Home';
import { getPublicData } from '../lib/public-data';
import { cms } from '../lib/cms';
import { defaultRecommendation } from '../lib/recommendation';
export const dynamic='force-dynamic';
export default async function Page(){
  const data=await getPublicData();
  return <Home {...data} options={data.recommendation}/>;
}
