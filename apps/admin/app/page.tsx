import Studio from '../components/Studio';
import { requireChatGPTUser } from './chatgpt-auth';
import { env } from 'cloudflare:workers';
export const dynamic = 'force-dynamic';
export default async function Home() {
  await requireChatGPTUser('/');
  return <Studio name="橘子" webUrl={env.WEB_ORIGIN || '#'} />;
}
