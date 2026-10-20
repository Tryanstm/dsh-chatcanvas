import {registerRendererTool} from './tool-registry';
import {PublishedDocuments} from './documents';
import {id,validateCanvas} from '../protocol';
import {hydratePublishedCanvas} from './assets';
import {CANVAS_PARAMETERS} from './tool-schema';
import {CanvasReferenceSchema} from './references';
import type {PublishedSnapshots} from './snapshots';
export {questionReference,readCanvasAnswer} from './canvas-question-protocol';
import {readCanvasAnswer,OPEN,CLOSE} from './canvas-question-protocol';
export function registerCanvasQuestions(ctx:any,store:PublishedSnapshots){
 const answers=new PublishedDocuments();
 ctx.inject(['connection'],(c:any)=>c.connection.fetch.register({path:'/api/dser.canvas-answer',methods:['POST'],requestBody:'buffered',async fetch(request:Request){try{const text=await request.text();if(text.length>16000000)return new Response('回答数据超过 16 MB',{status:413});const value=JSON.parse(text),canvas=validateCanvas(value.canvas);if(canvas.question?.id!==value.questionId)throw Error('提问画布标识不匹配');const reference=await answers.put(value.sessionId,{schemaVersion:1,type:'dser-document',documentId:id(),plainText:'提问画布快照',content:{type:'doc',content:[{type:'canvasBlock',attrs:{document:canvas}}]},previews:Array.isArray(value.previews)?value.previews.slice(0,1):[]},canvas.title);return Response.json({reference},{headers:{'Cache-Control':'no-store'}});}catch(e){return new Response(String(e),{status:400});}}}));
 ctx.inject(['userQuestions'],(c:any)=>registerRendererTool(c,{name:'canvas_question',description:'弹出可编辑画布提问并等待用户回答。用于确认布局、图画、UI 交互；返回选项、补充文字和完整画布，即使用户没有修改。所有结构已在 schema 中，无需搜索应用目录。',parameters:{...CANVAS_PARAMETERS,properties:{...CANVAS_PARAMETERS.properties,question:{type:'string'},options:{type:'array',maxItems:8,items:{type:'object',properties:{label:{type:'string'},description:{type:'string'}},required:['label'],additionalProperties:false}},multiSelect:{type:'boolean'}},required:['canvas','question']},
  output:{schema:{type:'object',additionalProperties:true},render:(_args:any,result:any)=>{const {images,...data}=result;return [{type:'text',text:JSON.stringify(data)},...(images||[]).map((attachment:any)=>({type:'image',attachment}))];}},
  async execute(args:any,exec:any){
   exec.signal.throwIfAborted();const sessionId=exec.agent?.session?.id;if(!sessionId)throw new Error('需要合法会话');
   const questionId=String(args.canvas.canvasId),canvas=await hydratePublishedCanvas(c,validateCanvas({...args.canvas,mode:'editable',question:{id:questionId,text:args.question}}),exec),reference=await store.put(sessionId,canvas);
   const answer=await c.userQuestions.ask({questions:[{id:questionId,header:canvas.title,question:args.question,detail:OPEN+JSON.stringify(reference)+CLOSE,options:args.options||[],multiSelect:!!args.multiSelect}],agent:exec.agent,signal:exec.signal});
   const item=answer.answers.find((a:any)=>a.id===questionId);if(!item)throw new Error('画布提问未收到回答');
   const encoded=JSON.parse(item.custom||'{}');let result;if(encoded.type==='dser-canvas-answer-ref'){if(encoded.questionId!==questionId)throw Error('回答与提问不匹配');const envelope=await answers.get(sessionId,encoded.reference);result={text:String(encoded.text||''),canvas:validateCanvas(envelope.content.content![0]!.attrs!.document),previews:envelope.previews||[]};}else result=readCanvasAnswer(item.custom,questionId);const images=[];for(const preview of result.previews){if(typeof preview.data!=='string'||preview.data.length>6000000||!/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/.test(preview.data))throw new Error('无效的画布预览图');images.push(await c.attachments.saveImage({data:Buffer.from(preview.data.split(',')[1],'base64'),mediaType:preview.data.startsWith('data:image/png')?'image/png':'image/jpeg',name:'画布提问回答'}));}return {questionId,selected:item.selected,text:result.text,canvas:result.canvas,images};
  }
 }));
}
