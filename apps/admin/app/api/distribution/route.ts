import {z} from 'zod';
import {env} from 'cloudflare:workers';
import {authorize,json,db} from '../../../lib/server';
import {findContent} from '../../../lib/content';
import {renderMarkdown} from '../../../lib/markdown';
import {absoluteMedia,externalPlatformLink,type DistributionJob} from '../../../lib/distribution';
const account=z.object({platform:z.enum(['zhihu','juejin','csdn','xiaohongshu']),accountId:z.string().min(1).max(200),accountTitle:z.string().max(100)});
function job(row:any):DistributionJob{return {id:row.id,contentId:row.content_id,platform:row.platform,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,data:JSON.parse(row.data_json)};}
export async function GET(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);const rows=await db().prepare("SELECT * FROM jobs WHERE kind='distribution' ORDER BY created_at DESC LIMIT 100").all();return json({items:rows.results.map(job)});}
export async function POST(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  try{const input=z.object({contentId:z.string().uuid(),revision:z.number().int().positive(),accounts:z.array(account).min(1).max(4)}).parse(await request.json());
    const content=await findContent(input.contentId);
    if(!content||content.trashedAt||content.kind!=='article')return json({error:'请选择有效文章'},404);
    if(content.revision!==input.revision)return json({error:'文章已更新，请重新选择'},409);
    if(!content.isPublic||content.hasUnpublishedChanges)return json({error:'先发布文章的最新版本，让同步使用的图片和视频地址可公开访问'},400);
    const webOrigin=env.WEB_ORIGIN??'',now=new Date().toISOString(),items:DistributionJob[]=[];
    const markdown=absoluteMedia(content.markdown,webOrigin),payload={title:content.title,desc:content.excerpt,markdown,content:renderMarkdown(markdown),thumb:content.cover.startsWith('/')?webOrigin+content.cover:content.cover};
    for(const selected of input.accounts){
      const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(selected.platform+':'+selected.accountId));const accountKey=Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('');
      const key=`distribution:${content.id}:${content.revision}:${selected.platform}:${accountKey}`,id=crypto.randomUUID();
      const data={title:content.title,revision:content.revision,accountKey,accountTitle:selected.accountTitle,payload,attempts:0};
      await db().prepare('INSERT OR IGNORE INTO jobs (id,kind,content_id,platform,status,idempotency_key,data_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,'distribution',content.id,selected.platform,'queued',key,JSON.stringify(data),now,now).run();
      const row=await db().prepare('SELECT * FROM jobs WHERE idempotency_key=?').bind(key).first();items.push(job(row));
    }
    return json({items});
  }catch{return json({error:'同步任务参数不正确'},400);}
}
export async function PATCH(request:Request){
  if(!await authorize(request))return json({error:'请先登录'},401);
  try{const input=z.object({id:z.string().uuid(),action:z.enum(['start','report','verify','requeue']),attempt:z.string().uuid().optional(),status:z.enum(['running','draft','failed','login_expired','needs_input','unknown']).optional(),message:z.string().max(600).default(''),url:z.string().max(2000).default('')}).parse(await request.json());
    const row=await db().prepare("SELECT * FROM jobs WHERE id=? AND kind='distribution'").bind(input.id).first<any>();if(!row)return json({error:'任务不存在'},404);
    const current=job(row),now=new Date().toISOString();let status=current.status,data={...current.data};
    if(input.action==='start'){
      if(!['queued','failed','login_expired','needs_input'].includes(current.status))return json({error:'这个版本已同步或结果待核对，请先到平台检查，避免重复创建'},409);
      status='running';data={...data,attempt:crypto.randomUUID(),attempts:(data.attempts??0)+1,message:'已交给当前浏览器扩展',url:''};
    }else if(input.action==='requeue'){
      if(current.status!=='unknown'&&!(current.status==='running'&&Date.now()-Date.parse(current.updatedAt)>300000))return json({error:'仅结果不明或超过五分钟的任务可核对后重排'},409);
      status='queued';data={...data,message:'本人已核对平台未生成草稿，允许重试',attempt:undefined};
    }else if(input.action==='verify'){
      const url=externalPlatformLink(input.url,current.platform);if(!url)return json({error:'请输入对应平台的 HTTPS 发布链接'},400);
      status='published';data={...data,url,message:'本站主人手动核实正式发布链接',verifiedBy:'owner'};
    }else{
      if(current.status!=='running'||!input.attempt||input.attempt!==data.attempt)return json({error:'任务状态已变化'},409);
      status=input.status??'unknown';const url=externalPlatformLink(input.url,current.platform);
      if(status==='draft'&&!url)status='unknown';data={...data,url,message:input.message};
    }
    const result=await db().prepare('UPDATE jobs SET status=?,data_json=?,updated_at=? WHERE id=? AND status=? AND data_json=?').bind(status,JSON.stringify(data),now,current.id,current.status,row.data_json).run();
    if(!result.meta.changes)return json({error:'任务已由其他窗口更新'},409);
    return json({item:{...current,status,data,updatedAt:now}});
  }catch{return json({error:'任务更新格式不正确'},400);}
}
