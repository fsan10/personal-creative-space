// Codex orchestration function; evaluate in functions.exec after preparing a checkpoint.
// Uses the connected GitHub Git-data API. No credentials are read or persisted.
async function syncCheckpoint(directory,message){
  const cwd='/workspace/scratch/9941cbc94aa0/personal-creative-space',repository='fsan10/personal-creative-space';
  const quote=value=>"'"+value.replace(/'/g,"'\\''")+"'";
  const shell=async cmd=>{const r=await tools.exec_command({cmd,workdir:cwd,max_output_tokens:20000});if(r.exit_code!==0)throw new Error('Checkpoint command failed');return r.output;};
  const extract=result=>{if(result.isError)throw new Error(JSON.stringify(result.structuredContent));const value=result.structuredContent;if(value?.sha)return value;if(value?.content){try{return JSON.parse(value.content);}catch{}}for(const c of result.content??[])if(c.type==='text'){try{const parsed=JSON.parse(c.text);if(parsed.sha)return parsed;}catch{}}throw new Error('Unexpected GitHub response');};
  const meta=JSON.parse(await shell('cat '+quote(directory+'/meta.json'))),base=(await shell('git rev-parse HEAD^{tree}')).trim();
  const collected=[];
  for(let start=0;start<meta.chunks;start+=8){const results=await Promise.allSettled(Array.from({length:Math.min(8,meta.chunks-start)},(_,offset)=>shell('cat '+quote(directory+'/'+(start+offset)+'.json'))));for(const result of results){if(result.status==='rejected')throw result.reason;collected.push(...JSON.parse(result.value));}}
  const grouped=new Map();for(const item of collected){if(!grouped.has(item.path))grouped.set(item.path,[]);grouped.get(item.path).push(item);}
  const entries=[];for(const [path,parts] of grouped){const first=parts[0];if(first.sha===null){entries.push({path,mode:first.mode,type:'blob',sha:null});continue;}const content=parts.sort((a,b)=>a.part-b.part).map(p=>p.content).join('');if(first.encoding==='base64'){const blob=extract(await tools.mcp__codex_apps__github_create_blob({repository_full_name:repository,content,encoding:'base64'}));entries.push({path,mode:first.mode,type:'blob',sha:blob.sha});}else entries.push({path,mode:first.mode,type:'blob',content});}
  const tree=extract(await tools.mcp__codex_apps__github_create_tree({repository_full_name:repository,base_tree_sha:base,tree_elements:entries}));if(tree.sha!==meta.tree_sha)throw new Error('Remote tree differs from staged source');
  const commit=extract(await tools.mcp__codex_apps__github_create_commit({repository_full_name:repository,parent_sha:meta.parent_sha,tree_sha:tree.sha,message}));
  const ref=await tools.mcp__codex_apps__github_update_ref({repository_full_name:repository,branch_name:'main',sha:commit.sha,force:false});if(ref.isError)throw new Error('Remote fast-forward failed');
  const local=await tools.exec_command({cmd:'git fetch origin main && git update-ref refs/heads/main '+quote(commit.sha)+' '+quote(meta.parent_sha)+' && git status --short',workdir:cwd,yield_time_ms:1000,max_output_tokens:1000});
  store('last_remote_commit',commit.sha);text({sha:commit.sha,message,files:meta.files,local});return commit.sha;
}
