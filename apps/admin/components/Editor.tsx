'use client';
import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Save, Eye, Columns2, Code2, ImagePlus, Video, History, Send } from 'lucide-react';
import type { Content } from '../lib/content';
import { renderMarkdown, readingMinutes, embedVideo } from '../lib/markdown';

export async function api<T=any>(path:string,init:RequestInit={}):Promise<T> {
  const response=await fetch(path,{...init,headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers}});
  const data=await response.json() as Record<string,any>;
  if(!response.ok) throw new Error(data.error??'操作未完成，请稍后重试');
  return data as T;
}
export function blankContent(kind:'article'|'project'):Content {
  return {id:'',kind,title:kind==='article'?'未命名文章':'未命名作品',slug:`${kind}-${Date.now().toString(36)}`,excerpt:'',markdown:'',cover:'',tags:[],accent:'blue',editorial:3,github:'',demo:'',tech:[],projectStatus:'building',deploymentUuid:'',relatedIds:[],series:'',demoContent:false,revision:0,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),status:'draft',isPublic:false,hasUnpublishedChanges:false,publicAt:null};
}
export default function Editor({initial,onBack,onSaved,notify,beforeLeaveRef}:{initial:Content;onBack:()=>void;onSaved:()=>void;notify:(text:string)=>void;beforeLeaveRef:React.MutableRefObject<(()=>Promise<boolean>)|null>}) {
  const [draft,setDraft]=useState(initial),[view,setView]=useState('split'),[saving,setSaving]=useState(false),[saveLabel,setSaveLabel]=useState(''),[history,setHistory]=useState<any[]|null>(null),[schedule,setSchedule]=useState(''),[videoUrl,setVideoUrl]=useState('');
  const current=useRef(draft),dirty=useRef(!initial.id),busy=useRef(false),paused=useRef(false),version=useRef(0),mounted=useRef(true),textarea=useRef<HTMLTextAreaElement>(null);
  current.current=draft;
  function change(field:string,value:unknown){dirty.current=true;paused.current=false;version.current++;setDraft(d=>({...d,[field]:value}));setSaveLabel('有未保存的修改');}
  async function save(quiet=false):Promise<Content|null>{
    if(busy.current)return null;if(!dirty.current&&current.current.id)return current.current;
    busy.current=true;setSaving(true);setSaveLabel('正在保存…');const submitted=current.current,v=version.current;
    try{const {item}=await api('/api/content',{method:'POST',body:JSON.stringify({...submitted,id:submitted.id||undefined,expectedRevision:submitted.revision||undefined})});
      if(!mounted.current)return item;
      if(v===version.current){dirty.current=false;setDraft(item);current.current=item;setSaveLabel(`已保存 · 版本 ${item.revision}`);}
      else{setDraft(d=>({...d,id:item.id,revision:item.revision,status:item.status,isPublic:item.isPublic}));current.current={...current.current,id:item.id,revision:item.revision};setSaveLabel('有新的修改等待保存');}
      onSaved();if(!quiet)notify('已保存到内容库');return item;
    }catch(e){paused.current=true;if(mounted.current){setSaveLabel('保存失败，修改仍在当前页面');notify((e as Error).message);}return null;}
    finally{busy.current=false;if(mounted.current)setSaving(false);}
  }
  useEffect(()=>{beforeLeaveRef.current=async()=>{const item=await save(true);if(!item||dirty.current){notify('还有修改正在保存，请稍后切换');return false;}return true;};});
  useEffect(()=>{if(!dirty.current||paused.current)return;const timer=setTimeout(()=>void save(true),1400);return()=>clearTimeout(timer);},[draft,saving]);
  useEffect(()=>{mounted.current=true;const warn=(e:BeforeUnloadEvent)=>{if(dirty.current){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',warn);return()=>{mounted.current=false;window.removeEventListener('beforeunload',warn);};},[]);
  async function publish(action='publish'){
    const item=await save(true);if(!item||dirty.current){notify('请等待最新修改保存后发布');return;}
    try{const r=await api(`/api/content/${item.id}`,{method:'PATCH',body:JSON.stringify({action,date:schedule,expectedRevision:item.revision})});setDraft(r.item);current.current=r.item;notify(action==='schedule'?'已设置定时发布':action==='unpublish'?'已撤回发布':'内容已发布');onSaved();}catch(e){notify((e as Error).message);}
  }
  function insert(text:string){const node=textarea.current,start=node?.selectionStart??draft.markdown.length,end=node?.selectionEnd??start;change('markdown',draft.markdown.slice(0,start)+text+draft.markdown.slice(end));requestAnimationFrame(()=>{node?.focus();node?.setSelectionRange(start+text.length,start+text.length);});}
  async function openHistory(){if(!draft.id)return;try{setHistory((await api(`/api/content/${draft.id}/revisions`)).items);}catch(e){notify((e as Error).message);}}
  async function restore(revision:number){const item=await save(true);if(!item)return;try{const r=await api(`/api/content/${item.id}/revisions`,{method:'POST',body:JSON.stringify({revision,expectedRevision:item.revision})});setDraft(r.item);current.current=r.item;dirty.current=false;setHistory(null);notify('已恢复为新版本；发布版本需另行更新');onSaved();}catch(e){notify((e as Error).message);}}
  return <div className="editor-workspace">
    <div className="editor-top"><button className="icon-btn" aria-label="返回列表" onClick={async()=>{if(await beforeLeaveRef.current?.())onBack();}}><ArrowLeft size={19}/></button><div><span className="eyebrow">{draft.kind==='article'?'写作空间':'作品档案'}</span><span className="save-state" aria-live="polite">{saveLabel||`版本 ${draft.revision||'尚未保存'}`}</span></div><div className="editor-actions"><button className="button subtle" onClick={openHistory} disabled={!draft.id}><History size={16}/>历史版本</button><button className="button" onClick={()=>void save()} disabled={saving}><Save size={16}/>{saving?'保存中':'保存'}</button><button className="button primary" onClick={()=>void publish()} disabled={saving}><Send size={16}/>{draft.isPublic?'更新发布':'发布'}</button></div></div>
    <div className="editor-meta"><input className="title-input" aria-label="标题" value={draft.title} onChange={e=>change('title',e.target.value)}/><div className="meta-fields"><label>链接名称<input value={draft.slug} onChange={e=>change('slug',e.target.value)}/></label><label>标签<input placeholder="用逗号分隔" value={draft.tags.join(', ')} onChange={e=>change('tags',e.target.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean))}/></label><label>摘要<input placeholder="用一两句话介绍内容" value={draft.excerpt} onChange={e=>change('excerpt',e.target.value)}/></label></div></div>
    {draft.kind==='project'&&<div className="project-fields"><label>GitHub 仓库<input value={draft.github} placeholder="https://github.com/…" onChange={e=>change('github',e.target.value)}/></label><label>在线演示<input value={draft.demo} placeholder="https://…" onChange={e=>change('demo',e.target.value)}/></label><label>技术栈<input value={draft.tech.join(', ')} onChange={e=>change('tech',e.target.value.split(/[,，]/).map(x=>x.trim()).filter(Boolean))}/></label><label>项目状态<select value={draft.projectStatus} onChange={e=>change('projectStatus',e.target.value)}><option value="idea">构想中</option><option value="building">开发中</option><option value="live">已上线</option><option value="paused">暂停</option></select></label></div>}
    <div className="writing-toolbar"><div className="segmented"><button aria-pressed={view==='source'} onClick={()=>setView('source')}><Code2 size={15}/>源码</button><button aria-pressed={view==='split'} onClick={()=>setView('split')}><Columns2 size={15}/>分栏</button><button aria-pressed={view==='preview'} onClick={()=>setView('preview')}><Eye size={15}/>预览</button></div><div className="format-tools"><button onClick={()=>insert('**粗体文字**')} title="插入粗体">B</button><button onClick={()=>insert('\n## 小标题\n')} title="插入标题">H₂</button><button onClick={()=>insert('\n![图片说明](https://图片地址)\n')} title="插入图片链接"><ImagePlus size={17}/></button><button onClick={()=>setVideoUrl(videoUrl?'':'https://')} title="插入视频"><Video size={17}/></button><span>{readingMinutes(draft.markdown)} 分钟阅读</span></div></div>
    {videoUrl&&<div className="inline-form"><label>视频地址<input value={videoUrl} onChange={e=>setVideoUrl(e.target.value)} placeholder="MP4/WebM 或平台嵌入地址"/></label><button className="button" onClick={()=>{try{insert('\n'+embedVideo(videoUrl)+'\n');setVideoUrl('');}catch(e){notify((e as Error).message);}}}>插入视频</button></div>}
    <div className={`writing-area ${view}`}>{view!=='preview'&&<textarea ref={textarea} className="markdown-input" aria-label="Markdown 源文" spellCheck={false} value={draft.markdown} placeholder="从一个想法开始。支持 Markdown、图片与视频…" onChange={e=>change('markdown',e.target.value)}/>} {view!=='source'&&<div className="markdown-preview prose" dangerouslySetInnerHTML={{__html:renderMarkdown(draft.markdown)||'<p class="muted">这里会实时显示文章的样子。</p>'}}/>}</div>
    <div className="editor-bottom"><label>封面地址<input value={draft.cover} onChange={e=>change('cover',e.target.value)} placeholder="图片 URL 或媒体库地址"/></label><label>定时发布<input type="datetime-local" value={schedule} onChange={e=>setSchedule(e.target.value)}/></label><button className="button" disabled={!schedule||saving} onClick={()=>void publish('schedule')}>设置时间</button>{draft.publicAt&&<button className="button subtle" onClick={()=>void publish('unpublish')}>撤回发布</button>}</div>
    {history&&<section className="history-panel"><div className="section-heading"><h3>历史版本</h3><button className="button subtle" onClick={()=>setHistory(null)}>关闭</button></div><p className="muted">恢复会创建新版本，原来的记录继续保留。</p>{history.map(item=><div className="history-row" key={item.revision}><span>版本 {item.revision}</span><time>{new Date(item.createdAt).toLocaleString('zh-CN')}</time><button className="button" disabled={item.revision===draft.revision} onClick={()=>void restore(item.revision)}>恢复</button></div>)}</section>}
  </div>;
}
