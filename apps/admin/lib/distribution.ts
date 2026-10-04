export const platforms=[{id:'zhihu',name:'知乎',host:'zhihu.com',login:'https://www.zhihu.com/'},{id:'juejin',name:'掘金',host:'juejin.cn',login:'https://juejin.cn/'},{id:'csdn',name:'CSDN',host:'csdn.net',login:'https://mp.csdn.net/'},{id:'xiaohongshu',name:'小红书',host:'xiaohongshu.com',login:'https://creator.xiaohongshu.com/'}] as const;
export type PlatformId=typeof platforms[number]['id'];
export type DistributionStatus='queued'|'running'|'draft'|'published'|'failed'|'login_expired'|'needs_input'|'unknown';
export const statusLabels:Record<DistributionStatus,string>={queued:'待同步',running:'正在同步',draft:'已生成平台草稿',published:'本人已核实发布',failed:'同步失败',login_expired:'请重新登录',needs_input:'待补充信息',unknown:'结果待核对'};
export type SyncAccount={type:PlatformId;title:string;uid?:string;icon?:string;home?:string;[key:string]:unknown};
export type AccountResult={type:string;status:string;msg?:string;error?:string;editResp?:{draftLink?:string}};
export type SyncPayload={title:string;content:string;markdown:string;desc:string;thumb:string};
export type DistributionJob={id:string;contentId:string;platform:PlatformId;status:DistributionStatus;createdAt:string;updatedAt:string;data:{title:string;revision:number;accountKey:string;accountTitle:string;payload:SyncPayload;message?:string;url?:string;attempt?:string;attempts?:number;verifiedBy?:string}};
export function externalPlatformLink(value:string,platform:PlatformId){try{const u=new URL(value);const host=platforms.find(p=>p.id===platform)?.host??'';return u.protocol==='https:'&&!u.username&&!u.password&&(u.hostname===host||u.hostname.endsWith('.'+host))?u.href:'';}catch{return '';}}
export function mapAccountResult(result:AccountResult):{status:DistributionStatus;message:string;url:string}{
  const p=result.type as PlatformId,url=externalPlatformLink(result.editResp?.draftLink??'',p);
  if(result.status==='done')return {status:url?'draft':'unknown',message:url?'扩展返回草稿链接，请到平台检查排版并发布':'扩展报告完成，但没有返回可核对链接',url};
  if(result.status==='failed'){const message=(result.error||'平台同步失败').slice(0,600);return {status:/登录|login|401|cookie|认证/i.test(message)?'login_expired':/封面|标题|分类|图片|参数|必填/.test(message)?'needs_input':'failed',message,url:''};}
  return {status:'running',message:(result.msg||'扩展正在处理').slice(0,600),url:''};
}
export function absoluteMedia(text:string,webOrigin:string){return text.replace(/([("'])\/media\//g,'$1'+webOrigin+'/media/');}
