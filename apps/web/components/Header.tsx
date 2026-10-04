'use client';
import { usePathname } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
export default function Header({name,github}:{name:string;github:string}){
  const path=usePathname();return <header className="site-header"><a className="wordmark" href="/"><span className="brand-asterisk">✳</span><span>{name}<small>的创作桌</small></span></a><nav aria-label="主导航">{[['/','首页'],['/articles','文章'],['/projects','作品'],['/about','关于']].map(([url,label])=><a key={url} href={url} aria-current={url==='/'?path==='/'?'page':undefined:path.startsWith(url)?'page':undefined}>{label}</a>)}</nav><a className="header-github" href={github} target="_blank" rel="noreferrer">GitHub<ArrowUpRight size={15}/></a></header>;
}
