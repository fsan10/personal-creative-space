import { cache } from 'react';
import { cms } from './cms';
import type { RankedItem } from './recommendation';
import { defaultRecommendation,type RecommendationOptions } from './recommendation';
export type Publication=RankedItem&{slug:string;markdown:string;excerpt:string;cover:string;accent:string;demoContent:boolean;projectStatus?:string;createdAt?:string};
export type Profile={name:string;tagline:string;bio:string;github:string};
export const getPublicData=cache(async():Promise<{items:Publication[];profile:Profile;available:boolean;recommendation:RecommendationOptions}>=>{
  const fallback={name:'橘子',tagline:'把想法写下来，把喜欢的东西做出来。',bio:'这里是我的文章、作品与持续进行的实验。',github:'https://github.com/fsan10'};
  try{const response=await cms('/api/public/content');if(!response.ok)throw new Error('CMS_HTTP_'+response.status);const data=await response.json() as {items:Publication[];profile:Profile;recommendation:RecommendationOptions};if(!Array.isArray(data.items))throw new Error('内容格式不正确');return {...data,available:true};}
  catch(error){console.error('CMS_PUBLIC_READ_FAILED',error instanceof Error?error.message:'unknown');return {items:[],profile:fallback,available:false,recommendation:defaultRecommendation};}
});
export function safeLink(url:unknown):string|undefined{if(typeof url!=='string')return undefined;if(url.startsWith('/')&&!url.startsWith('//'))return url;try{const u=new URL(url);return u.protocol==='https:'&&!u.username&&!u.password?u.href:undefined;}catch{return undefined;}}
