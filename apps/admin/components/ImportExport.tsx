'use client';
import { useRef,useState } from 'react';
import JSZip from 'jszip';
import { Download,Upload } from 'lucide-react';
import { api,upload } from '../lib/client';
import { parseMarkdown,serializeMarkdown,safeArchivePath,rewriteMedia } from '../lib/portable';
import type { Content } from '../lib/content';
const MAX_EXPANDED=96*1024*1024;
export function download(blob:Blob,name:string){const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);}
export function downloadMarkdown(item:Content){download(new Blob([serializeMarkdown(item)],{type:'text/markdown;charset=utf-8'}),`${item.slug}.md`);}
export default function ImportExport({notify,onImported}:{notify:(message:string)=>void;onImported:()=>void}){
  const [busy,setBusy]=useState(false),[progress,setProgress]=useState('');const input=useRef<HTMLInputElement>(null);
  async function backup(){setBusy(true);setProgress('整理内容…');try{
    const data=await api('/api/export'),zip=new JSZip();
    if(data.media.reduce((n:number,m:any)=>n+m.size,0)>MAX_EXPANDED)throw new Error('本次媒体超过 96 MB，请先分批导出或使用自托管备份命令');
    const media=data.media.map((item:any)=>({...item,path:`media/${item.id}.${item.mime.split('/')[1].replace('jpeg','jpg')}`}));
    const manifest={format:data.format,version:data.version,exportedAt:data.exportedAt,settings:data.settings,media,contents:data.contents.map((item:Content)=>({id:item.id,path:`${item.kind==='article'?'articles':'projects'}/${item.slug}.md`}))};
    for(const item of data.contents){let markdown=serializeMarkdown(item);for(const asset of media)markdown=rewriteMedia(markdown,asset.url,`../${asset.path}`);zip.file(`${item.kind==='article'?'articles':'projects'}/${item.slug}.md`,markdown);}
    for(let i=0;i<media.length;i++){setProgress(`下载素材 ${i+1}/${media.length}`);const response=await fetch(media[i].url);if(!response.ok)throw new Error(`素材下载失败：${media[i].name}`);zip.file(media[i].path,await response.arrayBuffer(),{compression:'STORE'});}
    zip.file('manifest.json',JSON.stringify(manifest,null,2));zip.file('README.md','本归档包含 Markdown 源文、媒体和资源清单。导入后为草稿，需另行发布。设置在清单中保留，导入不会覆盖当前站点设置。');
    setProgress('打包归档…');download(await zip.generateAsync({type:'blob',compression:'DEFLATE',compressionOptions:{level:5}}),`creative-space-${new Date().toISOString().slice(0,10)}.zip`);notify('完整备份已生成，包含 Markdown 和媒体');
  }catch(e){notify((e as Error).message);}finally{setBusy(false);setProgress('');}}
  async function importFiles(files:FileList|null){if(!files)return;setBusy(true);let imported=0;try{
    const existing:Content[]=(await api('/api/content')).items,used=new Set(existing.map(i=>`${i.kind}:${i.slug}`));
    async function add(source:string,name:string){const parsed=parseMarkdown(source,name),base=parsed.slug as string;let slug=base,index=2;while(used.has(`${parsed.kind}:${slug}`))slug=`${base}-${index++}`;used.add(`${parsed.kind}:${slug}`);
      const {item}=await api('/api/content',{method:'POST',body:JSON.stringify({...parsed,id:undefined,slug,expectedRevision:undefined,relatedIds:[]})});imported++;return {item,originalId:parsed.id,relatedIds:parsed.relatedIds};}
    for(const file of Array.from(files)){
      if(file.name.toLowerCase().endsWith('.zip')){
        if(file.size>MAX_EXPANDED)throw new Error('归档过大，请分批导入');
        const zip=await JSZip.loadAsync(file),paths=Object.keys(zip.files).filter(path=>!zip.files[path].dir);
        if(paths.length>1000||paths.some(path=>!safeArchivePath(path)))throw new Error('归档路径或文件数量不符合要求');
        const expanded=paths.reduce((sum,path)=>sum+Number((zip.files[path] as any)._data?.uncompressedSize??0),0);
        if(expanded>MAX_EXPANDED)throw new Error('解压后的归档超过 96 MB');
        const manifestFile=zip.file('manifest.json');if(!manifestFile)throw new Error('ZIP 缺少 manifest.json 资源清单');
        const manifest=JSON.parse(await manifestFile.async('string'));
        if(manifest.format!=='creative-space'||manifest.version!==1||!Array.isArray(manifest.media)||!Array.isArray(manifest.contents))throw new Error('不支持这个归档格式');
        const mappings:{from:string;to:string}[]=[];let total=0;
        for(let i=0;i<manifest.media.length;i++){
          const asset=manifest.media[i];if(!safeArchivePath(asset.path))throw new Error('资源路径不合法');const entry=zip.file(asset.path);if(!entry)throw new Error(`缺少素材：${asset.name}`);
          setProgress(`导入素材 ${i+1}/${manifest.media.length}`);const bytes=await entry.async('uint8array');total+=bytes.byteLength;if(total>MAX_EXPANDED)throw new Error('素材总量过大');
          const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',Uint8Array.from(bytes).buffer)),b=>b.toString(16).padStart(2,'0')).join('');if(hash!==asset.sha256)throw new Error(`素材校验失败：${asset.name}`);
          const uploaded=await upload(new File([bytes as BlobPart],asset.name,{type:asset.mime}));mappings.push({from:`../${asset.path}`,to:uploaded.url},{from:asset.url,to:uploaded.url});
        }
        const saved:any[]=[];
        for(const entry of manifest.contents){if(!safeArchivePath(entry.path))throw new Error('文章路径不合法');const md=zip.file(entry.path);if(!md)throw new Error(`缺少文章：${entry.path}`);let text=await md.async('string');for(const map of mappings)text=rewriteMedia(text,map.from,map.to);setProgress(`导入内容 ${imported+1}`);saved.push(await add(text,entry.path));}
        const idMap=new Map(saved.map(row=>[row.originalId,row.item.id]));
        for(const row of saved){const related=(Array.isArray(row.relatedIds)?row.relatedIds:[]).map((id:string)=>idMap.get(id)).filter(Boolean);if(related.length)await api('/api/content',{method:'POST',body:JSON.stringify({...row.item,relatedIds:related,expectedRevision:row.item.revision})});}
      }else if(file.name.toLowerCase().endsWith('.md')){if(file.size>2*1024*1024)throw new Error('单篇 Markdown 文件过大');setProgress(`导入 ${file.name}`);await add(await file.text(),file.name);}
      else throw new Error('请选择 .md 或本站导出的 .zip 归档');
    }notify(`已导入 ${imported} 项内容，均保存为草稿`);onImported();
  }catch(e){notify(`${imported?`已导入 ${imported} 项；`:''}${(e as Error).message}`);onImported();}finally{setBusy(false);setProgress('');if(input.current)input.current.value='';}}
  return <div className="import-export"><button className="button" disabled={busy} onClick={()=>input.current?.click()}><Upload size={15}/>导入 Markdown / ZIP</button><button className="button" disabled={busy} onClick={()=>void backup()}><Download size={15}/>完整备份</button><input hidden ref={input} type="file" accept=".md,.zip" multiple onChange={e=>void importFiles(e.target.files)}/>{progress&&<span role="status" className="muted">{progress}</span>}</div>;
}
