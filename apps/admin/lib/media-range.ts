export type MediaRange = {kind:'full'}|{kind:'unsatisfiable'}|{kind:'partial';offset:number;length:number};

// Resolve one byte range against the stored size. Unsupported syntax is ignored.
export function mediaRange(value:string|null,size:number):MediaRange {
  if(!value)return {kind:'full'};
  const match=/^bytes=(\d*)-(\d*)$/.exec(value.trim());
  if(!match||(!match[1]&&!match[2]))return {kind:'full'};
  const first=match[1]?Number(match[1]):null,last=match[2]?Number(match[2]):null;
  if((first!==null&&!Number.isSafeInteger(first))||(last!==null&&!Number.isSafeInteger(last))||size<=0)return {kind:'unsatisfiable'};
  if(first===null){
    if(last===null||last<=0)return {kind:'unsatisfiable'};
    const length=Math.min(last,size);return {kind:'partial',offset:size-length,length};
  }
  if(first>=size||(last!==null&&last<first))return {kind:'unsatisfiable'};
  const end=last===null?size-1:Math.min(last,size-1);
  return {kind:'partial',offset:first,length:end-first+1};
}
