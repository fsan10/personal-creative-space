import {env} from 'cloudflare:workers';
import {getSetting,setSetting} from './server';
import {publicHttps} from './deployment';
type Connection={url:string;token:string};
async function key(){if(!env.ADMIN_SERVICE_KEY)throw new Error('服务器加密配置不可用');return crypto.subtle.importKey('raw',await crypto.subtle.digest('SHA-256',new TextEncoder().encode(env.ADMIN_SERVICE_KEY)),{name:'AES-GCM'},false,['encrypt','decrypt']);}
function base(value:string){const url=publicHttps(value);if(!url)throw new Error('请使用可信服务的 HTTPS 域名地址');const u=new URL(url);if(u.search||u.hash||!['/','/api/v1','/api/v1/'].includes(u.pathname))throw new Error('请输入 Coolify 首页地址或 /api/v1 地址');return u.origin+'/api/v1';}
export async function getConnection():Promise<Connection|null>{
 if(env.COOLIFY_URL&&env.COOLIFY_TOKEN)return {url:base(env.COOLIFY_URL),token:env.COOLIFY_TOKEN};
 const stored=await getSetting('coolify_connection',null) as {url:string;iv:number[];cipher:number[]}|null;if(!stored)return null;
 try{const bytes=await crypto.subtle.decrypt({name:'AES-GCM',iv:new Uint8Array(stored.iv)},await key(),new Uint8Array(stored.cipher));return {url:base(stored.url),token:new TextDecoder().decode(bytes)};}catch{throw new Error('连接密钥无法解密，请重新连接 Coolify');}
}
export async function saveConnection(url:string,token:string){const normalized=base(url),iv=crypto.getRandomValues(new Uint8Array(12));const cipher=await crypto.subtle.encrypt({name:'AES-GCM',iv},await key(),new TextEncoder().encode(token));await setSetting('coolify_connection',{url:normalized,iv:Array.from(iv),cipher:Array.from(new Uint8Array(cipher))});}
export async function connectionStatus(){try{const connection=await getConnection();return {configured:!!connection,url:connection?new URL(connection.url).origin:'',source:env.COOLIFY_TOKEN?'environment':'settings'};}catch{return {configured:false,url:'',error:'请重新连接 Coolify'};}}
export async function coolify(path:string,method='GET',body?:unknown,provided?:Connection){
 const connection=provided??await getConnection();if(!connection)throw new Error('尚未连接 Coolify，请到设置填写服务器地址和 API Token');
 if(!path.startsWith('/')||path.startsWith('//'))throw new Error('无效的服务路径');
 let response:Response;try{response=await fetch(base(connection.url)+path,{method,headers:{Authorization:'Bearer '+connection.token,'Content-Type':'application/json'},body:body?JSON.stringify(body):undefined,redirect:'manual',signal:AbortSignal.timeout(25000)});}catch{throw new Error('Coolify 请求未取得结果，请核对服务记录后再操作');}
 if(!response.ok){await response.body?.cancel();throw new Error(response.status===401||response.status===403?'Coolify 授权失效或权限不足':`Coolify 返回 ${response.status}，请检查资源配置`);}
 const reader=response.body?.getReader(),chunks:Uint8Array[]=[];let size=0;
 if(reader){while(true){const {value,done}=await reader.read();if(done)break;size+=value.length;if(size>1048576){await reader.cancel();throw new Error('服务响应过大，请在 Coolify 查看完整日志');}chunks.push(value);}}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 try{return JSON.parse(new TextDecoder().decode(bytes));}catch{throw new Error('Coolify 响应格式不正确');}
}
export async function testConnection(url:string,token:string){await coolify('/applications','GET',undefined,{url:base(url),token});}
export async function clearConnection(){if(env.COOLIFY_TOKEN)throw new Error('此连接由服务器环境配置，请在部署设置移除');await setSetting('coolify_connection',null);}
export async function redactLogs(text:string){const connection=await getConnection();let output=text.slice(-30000);if(connection?.token)output=output.split(connection.token).join('[已隐藏]');if(env.ADMIN_SERVICE_KEY)output=output.split(env.ADMIN_SERVICE_KEY).join('[已隐藏]');return output.replace(/(authorization\s*[:=]\s*bearer|password\s*[:=]|secret\s*[:=]|token\s*[:=])\s*[^\s,;]+/gi,'$1 [已隐藏]');}
