'use client';
import { useState } from 'react';
import { Search } from 'lucide-react';
import type { Publication } from '../lib/public-data';
import { ProjectCard,ArticleRow } from './Cards';
export default function Collection({items,kind}:{items:Publication[];kind:'article'|'project'}){
  const [query,setQuery]=useState(''),[tag,setTag]=useState('');const tags=Array.from(new Set(items.flatMap(item=>item.tags)));
  const filtered=items.filter(item=>`${item.title} ${item.excerpt} ${item.tags.join(' ')}`.toLowerCase().includes(query.toLowerCase())&&(!tag||item.tags.includes(tag)));
  return <><div className="collection-tools"><div className="topic-pills"><button className={!tag?'selected':''} onClick={()=>setTag('')}>全部</button>{tags.map(t=><button key={t} className={tag===t?'selected':''} onClick={()=>setTag(tag===t?'':t)}>#{t}</button>)}</div><label className="collection-search"><Search size={16}/><input aria-label="搜索文章或作品" placeholder="搜搜标题、主题…" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>{filtered.length?<div className={kind==='project'?'portfolio-grid':'article-list'}>{filtered.map(item=>kind==='project'?<ProjectCard key={item.id} item={item}/>:<ArticleRow key={item.id} item={item}/>)}</div>:<div className="public-empty"><span>✳</span><h3>{query||tag?'这里暂时没有匹配的创作':'新的创作正在准备'}</h3><p>{query||tag?'换个主题或关键词再看看。':'完成后会把它放在这里。'}</p></div>}</>;
}
