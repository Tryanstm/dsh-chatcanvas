import {validateCanvas,type CanvasDocument} from '../protocol';import {CanvasReferenceSchema,readCanvasReference,type CanvasReference} from './references';
export interface HostEvent {type:string;seq:number;time?:number;data:any}
export interface CanvasNodeState {callId:string;document?:CanvasDocument;reference?:CanvasReference;status:'creating'|'ready'|'failed'|'cancelled';error?:{code:string;message:string};}
export const canvasDefinition={
 kind:'dser-canvas',target:'chat',
 match(event:HostEvent){const d=event.data;if(event.type==='dser/creation'&&d?.kind==='canvas')return {id:String(d.callId),role:'update'};if(event.type==='tool/call'&&d?.name==='canvas_publish')return {id:String(d.callId),role:'start'};
  if(event.type==='tool/ptc-dispatch-start'&&d?.name==='canvas_publish')return {id:String(d.subCallId),role:'start'};
  if(event.type==='tool/ptc-dispatch'&&d?.name==='canvas_publish')return {id:String(d.subCallId),role:'update'};
  if(event.type==='tool/result'&&(d?.message?.toolCallId||d?.message?.callId))return {id:String(d.message.toolCallId||d.message.callId),role:'update'};return null;
 },
 start(_context:any,match:any):CanvasNodeState{const d=match.event.data;return {callId:String(d.callId||d.subCallId),status:'creating'};},
 update(context:any,match:any):CanvasNodeState{if(match.event.type==='dser/creation')return {...context.state,managed:true} as any;try{const d=match.event.data,result=d?.message||d?.result||d;if(result?.isError)return {...context.state,status:/abort|cancel|取消/i.test(JSON.stringify(result))?'cancelled':'failed',error:{code:d.error?.code||'CANVAS_TOOL_FAILED',message:JSON.stringify(result.content||[]).slice(0,1000)}};
  const reference=d?.meta?.dserCanvasRef||readCanvasReference(result?.content);if(reference)return {...context.state,reference:CanvasReferenceSchema.parse(reference),status:'ready'};
  const legacy=d?.meta?.dserCanvas||d?.result?.meta?.dserCanvas||(match.event.type==='tool/ptc-dispatch'&&d?.arguments?.canvas);if(legacy)return {...context.state,document:validateCanvas(legacy),status:'ready'};
  return {...context.state,status:'failed',error:{code:'CANVAS_METADATA_MISSING',message:'工具结果缺少画布引用；请重新发布画布。'}};
 }catch(e){return {...context.state,status:'failed',error:{code:'INVALID_CANVAS',message:String(e)}};}},
 publication:(match:any)=>match.event.type==='tool/call'?'animation-frame':'immediate',
 // Canvas is an independent artifact, not a foldable internal tool-process row.
 buildViewNode(context:any){if(!context.state)return null;return {key:context.key,kind:'dser-canvas',id:context.id,target:'chat',anchorSeq:context.start?.event.seq??context.matches[0]?.event.seq??0,location:{kind:'session'},visibility:context.state.managed?'hidden':'visible',data:{...context.state,sourceLocation:context.start?.location??context.matches[0]?.location}};}
};
