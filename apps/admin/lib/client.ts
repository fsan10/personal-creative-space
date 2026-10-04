'use client';
import type { MediaItem } from './media';
export async function api<T=any>(path:string,init:RequestInit={}):Promise<T>{
  const response=await fetch(path,{...init,headers:{...(init.body instanceof FormData?{}:{'Content-Type':'application/json'}),...init.headers}});
  const data=await response.json() as Record<string,any>;
  if(!response.ok)throw new Error(typeof data.error==='string'?data.error:'操作未完成，请稍后重试');
  return data as T;
}
export async function upload(file:File){const form=new FormData();form.set('file',file);return (await api('/api/media',{method:'POST',body:form})).item as MediaItem;}
