export type RankedItem={id:string;kind:string;title:string;tags:string[];markdown?:string;excerpt?:string;cover?:string;github?:string;demo?:string;tech?:string[];editorial?:number;publicAt?:string|null;status?:string;isPublic?:boolean;relatedIds?:string[];series?:string;views?:number;reads?:number;[key:string]:unknown};
export const defaultRecommendation={weights:{editorial:.30,completeness:.25,freshness:.20,engagement:.15,relevance:.10},pins:[] as string[],exploration:.15};
export type RecommendationOptions=typeof defaultRecommendation;
export function normaliseOptions(input:Partial<RecommendationOptions>={}):RecommendationOptions {
  const weights={...defaultRecommendation.weights,...input.weights};let sum=0;
  for(const key of Object.keys(weights) as (keyof typeof weights)[]){weights[key]=Number.isFinite(weights[key])?Math.max(0,weights[key]):0;sum+=weights[key];}
  if(sum===0)return {...defaultRecommendation,pins:input.pins??[]};
  for(const key of Object.keys(weights) as (keyof typeof weights)[])weights[key]/=sum;
  return {weights,pins:Array.from(new Set(input.pins??[])),exploration:Math.min(.2,Math.max(0,input.exploration??.15))};
}
function hash(text:string){let h=2166136261;for(let i=0;i<text.length;i++){h^=text.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
export function recommend(items:RankedItem[],input:Partial<RecommendationOptions>={},context:{count?:number;seed?:string;topics?:string[];now?:number}={}) {
  const options=normaliseOptions(input),count=Math.max(1,Math.min(30,context.count??6)),now=context.now??Date.now(),topics=context.topics??[],seed=context.seed??'default';
  const live=items.filter(item=>item.isPublic===true&&item.status==='published');
  const ranked=live.map(item=>{
    const completeness=[!!item.excerpt,!!item.markdown,!!item.cover,item.tags.length>0,item.kind==='project'?!!(item.github||item.demo):!!item.publicAt].filter(Boolean).length/5;
    const days=Math.max(0,(now-new Date(item.publicAt??'1970-01-01').getTime())/86400000);
    const factors={editorial:Math.min(1,Math.max(0,(item.editorial??3)/5)),completeness,
      freshness:Number.isFinite(days)?Math.exp(-days/90):0,engagement:Math.min(1,((item.reads??0)+3)/((item.views??0)+30)),
      relevance:topics.length?item.tags.filter(t=>topics.includes(t)).length/Math.max(1,item.tags.length):.5};
    const score=Object.entries(factors).reduce((sum,[key,value])=>sum+value*options.weights[key as keyof typeof factors],0);
    const reason=topics.length&&factors.relevance>0?'与你选择的主题相关':factors.freshness>.8?'最近的创作':factors.completeness>=.8?'值得完整看看的作品':'编辑精选';
    return {...item,score,reason,factors,coldStart:(item.views??0)<30};
  }).sort((a,b)=>b.score-a.score||hash(seed+a.id)-hash(seed+b.id));
  const selected:typeof ranked=[];
  for(const id of options.pins){const item=ranked.find(item=>item.id===id);if(item&&selected.length<count)selected.push({...item,reason:'置顶精选'});}
  while(selected.length<Math.min(count,ranked.length)){
    let pool=ranked.filter(item=>!selected.some(s=>s.id===item.id));
    const needProject=selected.length===count-1&&!selected.some(item=>item.kind==='project')&&count>=3;
    const needArticle=selected.length===count-1&&!selected.some(item=>item.kind==='article')&&count>=3;
    const quota=pool.filter(item=>needProject?item.kind==='project':needArticle?item.kind==='article':true);
    if(quota.length)pool=quota;
    const diverse=pool.filter(item=>!item.tags[0]||selected.filter(s=>s.tags[0]===item.tags[0]).length<2);
    if(diverse.length)pool=diverse;
    let chosen=pool[0];
    if(!needProject&&!needArticle&&ranked.length>=10&&selected.length===count-1&&options.exploration>0&&hash(seed)%100<Math.round(options.exploration*100)){
      const exploration=pool.filter(item=>ranked.indexOf(item)>=Math.floor(ranked.length/2));
      if(exploration.length)chosen={...exploration[hash(seed+'explore')%exploration.length],reason:'探索另一种创作'};
    }
    if(!chosen)break;selected.push(chosen);
  }
  return selected;
}
export function relatedContent(item:RankedItem,items:RankedItem[],count=4) {
  return items.filter(candidate=>candidate.id!==item.id&&candidate.isPublic===true&&candidate.status==='published').map(candidate=>{
    const explicit=item.relatedIds?.includes(candidate.id)||candidate.relatedIds?.includes(item.id);
    const shared=candidate.tags.filter(tag=>item.tags.includes(tag)).length;
    return {...candidate,relationScore:(explicit?100:0)+(item.series&&candidate.series===item.series?20:0)+shared*5+(candidate.kind!==item.kind?2:0),reason:explicit?'这篇创作的相关作品':'同一主题的创作'};
  }).filter(candidate=>candidate.relationScore>2).sort((a,b)=>b.relationScore-a.relationScore||a.id.localeCompare(b.id)).slice(0,count);
}
