export function hslToHex(h:number,s:number,l:number):string {
  s/=100;l/=100;const a=s*Math.min(l,1-l);
  const channel=(n:number)=>{const k=(n+h/30)%12,v=l-a*Math.max(-1,Math.min(k-3,9-k,1));return Math.round(255*v).toString(16).padStart(2,'0');};
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}
