import {z} from 'zod';
import {authorize,json,db} from '../../../lib/server';
import {findContent,saveContent} from '../../../lib/content';
import {connectionStatus,coolify,redactLogs} from '../../../lib/coolify';
import {safeApplication,safeImages,deploymentState,githubRepository} from '../../../lib/deployment';
function job(row:any){return {id:row.id,contentId:row.content_id,status:row.status,createdAt:row.created_at,updatedAt:row.updated_at,data:JSON.parse(row.data_json)};}
const identifier=z.string().min(1).max(100).regex(/^[A-Za-z\d_-]+$/);
export async function GET(request:Request){
 if(!await authorize(request))return json({error:'请先登录'},401);
 try{const query=new URL(request.url).searchParams,id=z.string().uuid().parse(query.get('contentId')),content=await findContent(id);if(!content||content.kind!=='project'||content.trashedAt)return json({error:'作品不存在'},404);
 const status=await connectionStatus(),rows=await db().prepare("SELECT * FROM jobs WHERE kind='deployment' AND content_id=? ORDER BY created_at DESC LIMIT 20").bind(id).all<any>(),jobs=rows.results.map(job);
 if(!status.configured||!content.deploymentUuid)return json({connection:status,application:null,jobs,images:[]});
 const uuid=identifier.parse(content.deploymentUuid);
 if(query.get('mode')==='logs'){const result=await coolify(`/applications/${uuid}/logs?lines=100&show_timestamps=true`);return json({logs:await redactLogs(String(result.logs??''))});}
 const application=safeApplication(await coolify(`/applications/${uuid}`));let images:any[]=[];const warnings:string[]=[];
 try{images=safeImages(await coolify(`/applications/${uuid}/rollback-images`)).images;}catch(e){warnings.push((e as Error).message);}
 for(const item of jobs.slice(0,5)){if(item.data.deploymentUuid&&!['finished','failed','cancelled','created'].includes(item.status))try{const remote=await coolify('/deployments/'+identifier.parse(item.data.deploymentUuid));item.status=deploymentState(String(remote.status));item.data.commit=String(remote.commit??'');item.data.message='已读取部署服务的实际状态';await db().prepare('UPDATE jobs SET status=?,data_json=?,updated_at=? WHERE id=?').bind(item.status,JSON.stringify(item.data),new Date().toISOString(),item.id).run();}catch(e){warnings.push((e as Error).message);}}
 return json({connection:status,application,jobs,images,warnings});
 }catch(e){return json({error:(e as Error).message.length<220?(e as Error).message:'项目状态读取失败'},400);}
}
export async function POST(request:Request){
 if(!await authorize(request))return json({error:'请先登录'},401);
 const shape=z.object({contentId:z.string().uuid(),requestId:z.string().uuid(),action:z.enum(['deploy','rollback','create']),commit:z.string().max(200).optional(),projectUuid:identifier.optional(),serverUuid:identifier.optional(),environment:z.string().min(1).max(100).default('production'),branch:z.string().min(1).max(100).regex(/^[A-Za-z\d_.\/-]+$/).default('main'),buildPack:z.enum(['nixpacks','static','dockerfile']).default('nixpacks'),port:z.number().int().min(1).max(65535).default(3000),baseDirectory:z.string().max(200).regex(/^\/[A-Za-z\d_.\/-]*$/).default('/'),buildCommand:z.string().max(500).default(''),startCommand:z.string().max(500).default('')});
 let id='';let data:any={};let remoteAttempted=false;
 try{const input=shape.parse(await request.json()),content=await findContent(input.contentId);if(!content||content.kind!=='project'||content.trashedAt)return json({error:'作品不存在'},404);
 if(!(await connectionStatus()).configured)return json({error:'尚未连接 Coolify，请先在设置中连接'},409);
 const key=`deployment:${content.id}:${input.requestId}`,previous=await db().prepare('SELECT * FROM jobs WHERE idempotency_key=?').bind(key).first();if(previous)return json({item:job(previous),reused:true});
 const active=await db().prepare("SELECT id FROM jobs WHERE content_id=? AND kind='deployment' AND status IN ('submitting','queued','running','unknown') LIMIT 1").bind(content.id).first();if(active)return json({error:'此作品还有未完成或待核对的部署，请刷新状态并到 Coolify 核对'},409);
 const applicationUuid=content.deploymentUuid?identifier.parse(content.deploymentUuid):'';
 if(input.action==='create'){if(applicationUuid)return json({error:'作品已经关联应用'},409);if(!input.projectUuid||!input.serverUuid||!githubRepository(content.github))return json({error:'请填写公开 GitHub 仓库、服务器和项目标识'},400);if(input.baseDirectory.split('/').includes('..'))return json({error:'项目目录不能向上跳转'},400);}
 else if(!applicationUuid)return json({error:'先关联或创建 Coolify 应用'},400);
 if(input.action==='rollback'){const available=safeImages(await coolify(`/applications/${applicationUuid}/rollback-images`));if(!input.commit||!available.images.some((i:any)=>i.tag===input.commit&&!i.current))return json({error:'请选择服务仍保留的历史镜像'},400);}
 id=crypto.randomUUID();data={action:input.action,applicationUuid,title:content.title,commit:input.commit??'',message:'请求已记录，等待服务响应'};const now=new Date().toISOString();
 await db().prepare('INSERT INTO jobs (id,kind,content_id,platform,status,idempotency_key,data_json,created_at,updated_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(id,'deployment',content.id,'coolify','submitting',key,JSON.stringify(data),now,now).run();
 let state='queued';
 if(input.action==='create'){
 const repository=githubRepository(content.github),path=new URL(repository).pathname.replace(/\.git$/,'');const check=await fetch('https://api.github.com/repos'+path,{headers:{Accept:'application/vnd.github+json','User-Agent':'CreativeSpace'},redirect:'error'});if(!check.ok)throw new Error('无法确认此仓库公开可读，请检查仓库地址');const info=await check.json() as {private?:boolean};if(info.private!==false)throw new Error('请选择公开仓库');
 remoteAttempted=true;const result=await coolify('/applications/public','POST',{project_uuid:input.projectUuid,server_uuid:input.serverUuid,environment_name:input.environment,git_repository:repository,git_branch:input.branch,build_pack:input.buildPack,name:content.title,ports_exposes:String(input.port),base_directory:input.baseDirectory,build_command:input.buildCommand||undefined,start_command:input.startCommand||undefined,instant_deploy:false,is_auto_deploy_enabled:false,docker_images_to_keep:5});
 data.applicationUuid=identifier.parse(result.uuid);state='created';data.message='应用已创建，配置所需环境变量后再点击部署';
 try{await saveContent({...content,deploymentUuid:data.applicationUuid,expectedRevision:content.revision});}catch{data.message='应用已创建，但作品关联保存失败；请手动填写应用标识 '+data.applicationUuid;}
 }else{remoteAttempted=true;const result=input.action==='rollback'?await coolify(`/applications/${applicationUuid}/rollback`,'POST',{commit:input.commit}):await coolify('/deploy','POST',{uuid:applicationUuid,force:false});
 const uuid=input.action==='rollback'?result.deployment_uuid:result.deployments?.find((d:any)=>d.resource_uuid===applicationUuid)?.deployment_uuid;
 if(!uuid)throw new Error('服务没有返回部署标识，请到 Coolify 核对请求');data.deploymentUuid=identifier.parse(uuid);data.message='服务已接收任务，刷新可读取实际构建结果';}
 await db().prepare('UPDATE jobs SET status=?,data_json=?,updated_at=? WHERE id=?').bind(state,JSON.stringify(data),new Date().toISOString(),id).run();return json({item:job(await db().prepare('SELECT * FROM jobs WHERE id=?').bind(id).first()),content:input.action==='create'?await findContent(content.id):null});
 }catch(e){const message=(e as Error).message.length<240?(e as Error).message:'部署参数不正确';if(id)await db().prepare('UPDATE jobs SET status=?,data_json=?,updated_at=? WHERE id=?').bind(remoteAttempted?'unknown':'failed',JSON.stringify({...data,message}),new Date().toISOString(),id).run();return json({error:message},400);}
}

export async function PATCH(request:Request){if(!await authorize(request))return json({error:'请先登录'},401);try{const input=z.object({id:z.string().uuid(),contentId:z.string().uuid()}).parse(await request.json());const row=await db().prepare("SELECT * FROM jobs WHERE id=? AND content_id=? AND kind='deployment'").bind(input.id,input.contentId).first<any>();if(!row||row.status!=='unknown')return json({error:'仅待核对任务可以结束跟踪'},409);const data=JSON.parse(row.data_json);await db().prepare("UPDATE jobs SET status='failed',data_json=?,updated_at=? WHERE id=? AND status='unknown'").bind(JSON.stringify({...data,message:'主人已在 Coolify 核对并结束本站跟踪'}),new Date().toISOString(),input.id).run();return json({ok:true});}catch{return json({error:'操作参数不正确'},400);}}
