import Studio from '../components/Studio';
import { requireChatGPTUser } from './chatgpt-auth';
import { env } from 'cloudflare:workers';
import {getSetting} from '../lib/server';
export const dynamic = 'force-dynamic';
export default async function Home() {
  await requireChatGPTUser('/');
  const profile=await getSetting('profile',{name:'橘子'}) as {name:string};
  return <Studio name={profile.name} webUrl={env.WEB_ORIGIN || '#'} />;
}
