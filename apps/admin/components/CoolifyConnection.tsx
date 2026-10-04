'use client';
import {useEffect,useState} from 'react';
import {Plug,Unplug,ExternalLink} from 'lucide-react';
import {api} from '../lib/client';
export default function CoolifyConnection({notify}:{notify:(message:string)=>void}){
 const [status,setStatus]=useState({configured:false,url:'',source:''}),[url,setUrl]=useState(''),[token,setToken]=useState(''),[busy,setBusy]=useState(false);
 useEffect(()=>{api('/api/connections/coolify').then(setStatus).catch(e=>notify(e.message));},[]);
 async function connect(){setBusy(true);try{const result=await api('/api/connections/coolify',{method:'POST',body:JSON.stringify({url,token})});setStatus(result);setToken('');notify('已验证并保存 Coolify 连接');}catch(e){notify((e as Error).message);}finally{setBusy(false);}}
 async function disconnect(){setBusy(true);try{await api('/api/connections/coolify',{method:'DELETE'});setStatus({configured:false,url:'',source:''});notify('已断开管理台连接，已有项目继续运行');}catch(e){notify((e as Error).message);}finally{setBusy(false);}}
 return <section className="settings-card"><div className="section-heading"><h2>项目运行环境</h2><span className={`status ${status.configured?'published':''}`}>{status.configured?'已连接':'尚未连接'}</span></div><p className="muted">用你自己的 Coolify 服务器运行多个项目。Token 仅保存在管理端，界面不会回显。</p>{status.configured?<div className="connection-row"><strong>{status.url}</strong>{status.source!=='environment'&&<button className="button" disabled={busy} onClick={()=>void disconnect()}><Unplug size={14}/>断开连接</button>}</div>:<div className="connection-fields"><label>Coolify HTTPS 地址<input placeholder="https://coolify.example.com" value={url} onChange={e=>setUrl(e.target.value)}/></label><label>API Token<input type="password" autoComplete="new-password" placeholder="在 Coolify 的 Keys & Tokens 中创建" value={token} onChange={e=>setToken(e.target.value)}/></label><button className="button primary" disabled={busy||!url||!token} onClick={()=>void connect()}><Plug size={15}/>{busy?'正在验证…':'验证并连接'}</button></div>}<a className="text-button" href="https://coolify.io/docs/api-reference/authorization" target="_blank" rel="noreferrer">获取 API Token<ExternalLink size={12}/></a></section>;
}
