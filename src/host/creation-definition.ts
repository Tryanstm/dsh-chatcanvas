import {readCanvasReference} from './references';
import {readDocumentReference} from './document-references';
import {readableError} from '../errors';
const publish=new Set(['canvas_publish','document_publish','ui_publish','math_publish','text_publish','music_publish','table_publish']);
// PTC dispatch records omit turn coordinates; their globally unique root call was already logged.
const toolTurns=new Map<string,number>();
const payload=(value:any)=>{if(typeof value==='string')try{return JSON.parse(value);}catch{}return value||{};};
const textResult=(value:any)=>{for(const part of value?.content||[])if(part.type==='text')try{return JSON.parse(part.text);}catch{}return {};};
/** Only standard Harness events are persisted. One turn owns an ordered set of artifact jobs. */
export const creationDefinition={kind:'dser-creation',target:'chat',
 match(event:any){if(!['turn/start','turn/end','tool/call','tool/result','tool/ptc-dispatch-start','tool/ptc-dispatch'].includes(event.type))return null;const d=event.data||{},turn=d.turn??toolTurns.get(d.rootCallId||d.parentCallId);if(turn===undefined)return null;if(event.type==='tool/call'){toolTurns.set(String(d.callId),turn);if(toolTurns.size>5000)toolTurns.delete(toolTurns.keys().next().value!);}return {id:String(turn),role:'start'};},
 start(_ctx:any,m:any){return update({jobs:[],calls:{},turn:m.event.data.turn??toolTurns.get(m.event.data.rootCallId||m.event.data.parentCallId)??m.location?.turn?.turn},m.event);},
 update(ctx:any,m:any){return update(ctx.state,m.event);},publication:()=> 'immediate',
 buildViewNode(ctx:any){if(!ctx.state?.jobs.length)return null;return {key:ctx.key,kind:'dser-creation',id:ctx.id,target:'chat',anchorSeq:ctx.state.jobs[0].anchorSeq,location:{kind:'session'},visibility:'visible',data:ctx.state};}
};
function update(previous:any,event:any){const state=structuredClone(previous),d={...event.data,turn:event.data?.turn??previous.turn};
 if(event.type==='tool/call'||event.type==='tool/ptc-dispatch-start'){
  const callId=String(d.callId||d.subCallId),args=payload(d.arguments);state.calls[callId]={name:d.name,id:args.creationId};if(!publish.has(d.name))return state;
  const pending=!args.creationId&&state.jobs.find((j:any)=>j.tool===d.name&&j.status==='creating'&&j.error);
  const id=String(args.creationId||pending?.id||callId);state.calls[callId].id=id;let job=state.jobs.find((j:any)=>j.id===id);
  if(!job){job={id,kind:d.name==='canvas_publish'?'canvas':'document',tool:d.name,callId,status:'creating',anchorSeq:event.seq,sourceLocation:{turn:d.turn}};state.jobs.push(job);}return state;
 }
 if(event.type==='turn/end'){for(const j of state.jobs)if(j.status==='creating'){j.status=/abort|cancel/.test(JSON.stringify(d.reason))?'cancelled':'failed';j.error??={code:'CREATION_INCOMPLETE',message:'本轮创作已结束，未获得可用作品。'};}return state;}
 if(!['tool/result','tool/ptc-dispatch'].includes(event.type))return state;
 const result=d.message||d.result||d,callId=String(result.toolCallId||result.callId||result.source?.callId||d.callId||d.subCallId),call=state.calls[callId],body=textResult(result),creation=d.meta?.dserCreation||body.creation||(body.status==='needs-revision'?{id:body.creationId,status:'creating',error:{code:'CREATION_INVALID',message:body.error?.details||body.error?.summary||'请修正载荷'}}:call?.name==='creation_decide'?body:undefined);
 if(call?.name==='creation_decide'&&creation?.id){const job=state.jobs.find((j:any)=>j.id===creation.id);if(job)Object.assign(job,{status:creation.status,error:creation.error});return state;}
 if(!call||!publish.has(call.name))return state;
 let job=state.jobs.find((j:any)=>j.id===call.id);if(!job)return state;
 if(creation?.id&&job.id!==creation.id){const existing=state.jobs.find((j:any)=>j.id===creation.id);if(existing){state.jobs=state.jobs.filter((j:any)=>j!==job);job=existing;}else job.id=creation.id;call.id=creation.id;}
 if(creation){Object.assign(job,{status:creation.status,reference:creation.reference,error:creation.error});return state;}
 const reference=d.meta?.dserCanvasRef||d.meta?.dserDocumentRef||readCanvasReference(result.content)||readDocumentReference(result.content);
 if(reference){job.status='ready';job.reference=reference;}else if(d.meta?.dserCanvas){job.status='ready';job.document=d.meta.dserCanvas;}else{job.error={code:'CREATION_INVALID',message:readableError(result.content).details};}
 return state;
}
