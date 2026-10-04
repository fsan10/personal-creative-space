import type {SyncAccount,SyncPayload,AccountResult} from './distribution';
type Bridge={getAccounts:(cb:(accounts:SyncAccount[])=>void)=>void;addTask:(task:{post:SyncPayload;accounts:SyncAccount[]},status:(task:{accounts?:AccountResult[]})=>void,cb:()=>void)=>void};
declare global{interface Window{$syncer?:Bridge;$poster?:Bridge}}
export function getBridge(){return window.$syncer??window.$poster;}
export function detectAccounts():Promise<SyncAccount[]>{return new Promise((resolve,reject)=>{const bridge=getBridge();if(!bridge){reject(new Error('请安装文章同步助手扩展，允许它访问此网站，然后刷新页面'));return;}const timer=setTimeout(()=>reject(new Error('扩展没有响应，请检查扩展权限或重新刷新')),12000);bridge.getAccounts(accounts=>{clearTimeout(timer);Array.isArray(accounts)?resolve(accounts):reject(new Error('扩展返回的账号格式不正确'));});});}
export function sendToExtension(payload:SyncPayload,accounts:SyncAccount[],update:(results:AccountResult[])=>void){const bridge=getBridge();if(!bridge)throw new Error('文章同步助手扩展尚未连接');bridge.addTask({post:payload,accounts},task=>{if(Array.isArray(task.accounts))update(task.accounts);},()=>{});}
