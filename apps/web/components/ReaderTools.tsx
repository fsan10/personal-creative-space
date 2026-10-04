'use client';
import { useEffect,useState } from 'react';
import { Download,Copy,Check } from 'lucide-react';
export default function ReaderTools({id,markdown,slug}:{id:string;markdown:string;slug:string}){
  const [enabled,setEnabled]=useState(false),[copied,setCopied]=useState(false);
  useEffect(()=>{setEnabled(localStorage.getItem('anonymous-reading')==='on'&&navigator.doNotTrack!=='1');},[]);
  useEffect(()=>{
    if(!enabled)return;let session=sessionStorage.getItem('reading-session');if(!session){session=crypto.randomUUID();sessionStorage.setItem('reading-session',session);}
    const send=(kind:string)=>fetch('/api/read-event',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contentId:id,session,kind})}).catch(()=>{});
    void send('view');let read=false,elapsed=false;
    const scroll=()=>{if(!read&&elapsed&&document.visibilityState==='visible'&&window.scrollY+window.innerHeight>=document.documentElement.scrollHeight*.85){read=true;void send('read');}};
    const timer=setTimeout(()=>{elapsed=true;scroll();},30000);window.addEventListener('scroll',scroll,{passive:true});return()=>{clearTimeout(timer);window.removeEventListener('scroll',scroll);};
  },[enabled,id]);
  return <div className="reader-tools"><button onClick={()=>{const url=URL.createObjectURL(new Blob([markdown],{type:'text/markdown;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download=`${slug}.md`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}}><Download size={15}/>下载 Markdown</button><button onClick={async()=>{try{await navigator.clipboard.writeText(location.href);setCopied(true);setTimeout(()=>setCopied(false),2000);}catch{setCopied(false);}}}>{copied?<Check size={15}/>:<Copy size={15}/>}复制链接</button><label><input type="checkbox" checked={enabled} onChange={e=>{setEnabled(e.target.checked);localStorage.setItem('anonymous-reading',e.target.checked?'on':'off');}}/>允许匿名阅读反馈</label></div>;
}
