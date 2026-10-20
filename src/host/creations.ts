import {registerRendererTool} from './tool-registry';
import {randomUUID} from 'node:crypto';
import {readableError} from '../errors';
export const CREATION_EVENT='dser/creation';
export interface CreationRecord {id:string;kind:'canvas'|'document';tool:string;callId:string;status:'creating'|'ready'|'failed'|'cancelled';revision:number;error?:{code:string;message:string};reference?:any;managed:boolean;}
/** Durable artifact state is independent of individual tool attempts. Errors remain in tool results. */
export class Creations {
 private sessions=new Map<string,Map<string,CreationRecord>>();
 private busy=new WeakSet<CreationRecord>();
 private emit(session:any,job:CreationRecord){job.revision++;}
 begin(args:any,exec:any,kind:CreationRecord['kind'],tool:string){const session=exec.agent?.session;if(!session?.id)throw Error('需要合法 Agent 会话');let jobs=this.sessions.get(session.id);if(!jobs)this.sessions.set(session.id,jobs=new Map());
  const requested=args?.creationId;if(requested!==undefined&&(typeof requested!=='string'||!/^[-\w]{1,100}$/.test(requested)))throw Error('creationId 仅允许 1–100 个字母、数字、下划线或连字符');
  let job=requested?jobs.get(requested):[...jobs.values()].find(j=>j.tool===tool&&j.status==='creating'&&j.error&&!this.busy.has(j));
  if(job&&this.busy.has(job))throw Error('该创作正在处理上一份载荷，请等待其结果再修正');
  if(job&&(job.status!=='creating'||job.tool!==tool))throw Error('该创作已结束或工具类型不同，请为新作品使用新的 creationId');
  if(!job){if(jobs.size>=128){for(const [id,j]of jobs)if(j.status!=='creating'){jobs.delete(id);break;}if(jobs.size>=128)throw Error('当前未完成的创作过多');}job={id:requested||String(exec.callId||randomUUID()),kind,tool,callId:String(exec.callId||randomUUID()),status:'creating',revision:0,managed:typeof session.append==='function'};jobs.set(job.id,job);}
  job.callId=String(exec.callId||job.callId);this.busy.add(job);this.emit(session,job);return job;
 }
 async run(args:any,exec:any,kind:CreationRecord['kind'],tool:string,make:()=>Promise<any>){
  exec.signal.throwIfAborted();const job=this.begin(args,exec,kind,tool),session=exec.agent.session;
  try{const result=await make();exec.signal.throwIfAborted();job.status='ready';job.reference=result.reference;delete job.error;this.emit(session,job);return {...result,status:'ready',creationId:job.id,creation:structuredClone(job)};}
  catch(error){const detail=readableError(error);job.error={code:'CREATION_INVALID',message:detail.details};if(exec.signal.aborted)job.status='cancelled';this.emit(session,job);if(exec.signal.aborted)throw error;return {status:'needs-revision',creationId:job.id,creation:structuredClone(job),error:{summary:detail.summary,issues:detail.fields,details:detail.details},next:`修正完整载荷后复用 creationId 重试；决定放弃用 creation_decide。需要字段契约与最小例子时调用 renderer_help({topic:"${tool}"})。`};}
  finally{this.busy.delete(job);}
 }
 decide(session:any,id:string,decision:'continue'|'abandon'){const job=this.sessions.get(session.id)?.get(id);if(!job||job.status!=='creating')throw Error('找不到当前会话中未完成的创作');if(decision==='abandon')job.status='failed';this.emit(session,job);return structuredClone(job);}
 finish(session:any,cancelled=false){for(const job of this.sessions.get(session.id)?.values()||[]){if(job.status!=='creating')continue;job.status=cancelled?'cancelled':'failed';job.error??={code:'CREATION_INCOMPLETE',message:'本轮创作已结束，未获得可用作品。'};this.emit(session,job);}return [...(this.sessions.get(session.id)?.values()||[])].map(j=>structuredClone(j));}
}
export const creationParameters=(parameters:any)=>({...parameters,properties:{...parameters.properties,creationId:{type:'string',pattern:'^[-\\w]{1,100}$',description:'同一作品修正重试时复用返回的 creationId；新作品使用新 ID 或省略。'}}});
export function registerCreations(ctx:any){const jobs=new Creations();ctx.on?.('session/event',(session:any,event:any)=>{if(event.type==='turn/end')jobs.finish(session,event.data?.reason?.kind==='aborted');});
 registerRendererTool(ctx,{name:'creation_decide',description:'对尚未完成的组件创作决定继续或放弃。继续修正可直接带原 creationId 再发布；放弃会把原构建卡片结算为失败。',parameters:{type:'object',properties:{creationId:{type:'string'},decision:{enum:['continue','abandon']}},required:['creationId','decision'],additionalProperties:false},output:{schema:{type:'object',additionalProperties:true},render:(_a:any,v:any)=>[{type:'text',text:JSON.stringify(v)}]},execute:(args:any,exec:any)=>{exec.signal.throwIfAborted();if(!exec.agent?.session||!['continue','abandon'].includes(args.decision))throw Error('无效的创作决定');return jobs.decide(exec.agent.session,args.creationId,args.decision);}});return jobs;}
export function creationResultText(result:any,ready:(v:any)=>string){return result.status==='needs-revision'?JSON.stringify({status:result.status,creationId:result.creationId,error:result.error,next:result.next}):ready(result);}
