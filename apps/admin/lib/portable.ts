import { parse,stringify } from 'yaml';
export type PortableContent={id?:string;kind?:string;title?:string;slug?:string;markdown?:string;excerpt?:string;cover?:string;tags?:string[];[key:string]:unknown};
export function serializeMarkdown(item:PortableContent):string {
  const fields=['id','kind','title','slug','excerpt','cover','tags','accent','editorial','github','demo','tech','projectStatus','relatedIds','series','demoContent','createdAt'];
  const front:Object=Object.fromEntries(fields.filter(key=>item[key]!==undefined).map(key=>[key,item[key]]));
  return `---\n${stringify(front,{lineWidth:0})}---\n${item.markdown??''}`;
}
export function parseMarkdown(source:string,filename:string):PortableContent {
  const text=source.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n');
  const matched=text.match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  let front:Record<string,unknown>={};
  if(matched){const value=parse(matched[1],{maxAliasCount:0});if(!value||typeof value!=='object'||Array.isArray(value))throw new Error('Front Matter 需要是字段列表');front=value;}
  const title=typeof front.title==='string'?front.title:filename.replace(/\.[^.]+$/,'');
  const slug=(typeof front.slug==='string'?front.slug:title).trim().replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,130)||`import-${Date.now().toString(36)}`;
  return {...front,title,slug,kind:front.kind==='project'?'project':'article',markdown:matched?text.slice(matched[0].length):text,
    tags:Array.isArray(front.tags)?front.tags.filter((tag):tag is string=>typeof tag==='string'):[],
    excerpt:typeof front.excerpt==='string'?front.excerpt:'',cover:typeof front.cover==='string'?front.cover:''};
}
export function safeArchivePath(path:string):boolean{return !!path&&!path.startsWith('/')&&!path.includes('\\')&&!path.split('/').some(part=>part==='..'||part==='');}
export function rewriteMedia(text:string,from:string,to:string):string{return text.split(from).join(to);}
