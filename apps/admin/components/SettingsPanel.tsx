'use client';
import { useEffect,useState } from 'react';
import { Save,ExternalLink } from 'lucide-react';
import { api } from '../lib/client';
import ImportExport from './ImportExport';
import CoolifyConnection from './CoolifyConnection';
export default function SettingsPanel({notify,onImported}:{notify:(text:string)=>void;onImported:()=>void}){
  const [profile,setProfile]=useState({name:'橘子',tagline:'',bio:'',github:'https://github.com/fsan10'}),[connections,setConnections]=useState({coolify:false}),[saving,setSaving]=useState(false);
  useEffect(()=>{api('/api/settings').then(data=>{setProfile(data.profile);setConnections(data.connections);}).catch(e=>notify(e.message));},[]);
  async function save(){setSaving(true);try{await api('/api/settings',{method:'PUT',body:JSON.stringify({profile})});notify('个人资料已保存，前台会读取新的内容');}catch(e){notify((e as Error).message);}finally{setSaving(false);}}
  return <><div className="page-intro"><div><p className="eyebrow">让这个空间更像你</p><h1>设置</h1><p>个人资料、内容迁移和外部服务。</p></div><button className="button primary" disabled={saving} onClick={()=>void save()}><Save size={16}/>保存资料</button></div><section className="settings-card profile-fields"><h2>个人资料</h2><label>显示名称<input value={profile.name} onChange={e=>setProfile({...profile,name:e.target.value})}/></label><label>首页介绍<input value={profile.tagline} onChange={e=>setProfile({...profile,tagline:e.target.value})}/></label><label>关于自己<textarea value={profile.bio} onChange={e=>setProfile({...profile,bio:e.target.value})}/></label><label>GitHub 主页<input value={profile.github} onChange={e=>setProfile({...profile,github:e.target.value})}/></label></section><section className="settings-card"><h2>导入与备份</h2><p className="muted">完整 ZIP 包含 Markdown 源文、图片视频和资源清单。导入为草稿，当前设置保留。</p><ImportExport notify={notify} onImported={onImported}/></section><CoolifyConnection notify={notify}/><section className="settings-card"><h2>写作平台连接</h2><div className="connection-row"><strong>多平台同步扩展</strong><span className="status">由当前浏览器检测</span><a className="text-button" href="https://github.com/wechatsync/Wechatsync" target="_blank" rel="noreferrer">开源项目<ExternalLink size={12}/></a></div></section></>;
}
