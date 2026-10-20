import {readRichWire,hydrateRichContent,type RichEnvelope} from '../composer/wire';
import type {CanvasDocument} from '../protocol';
export function findSubmittedDocument(messages:readonly any[],documentId?:string,canvasId?:string):{envelope:RichEnvelope;images:any[]}|undefined{
 for(let i=messages.length-1;i>=0;i--){const message=messages[i];if(message.role!=='user'||!Array.isArray(message.content))continue;for(const block of message.content){if(block.type!=='text'||typeof block.text!=='string'||documentId&&!block.text.includes(documentId))continue;const envelope=readRichWire(block.text);if(!envelope||documentId&&envelope.documentId!==documentId)continue;let contains=!canvasId;const walk=(n:any)=>{if(n.type==='canvasBlock'&&n.attrs?.document?.canvasId===canvasId)contains=true;n.content?.forEach(walk);};walk(envelope.content);if(contains)return {envelope,images:message.content.filter((b:any)=>b.type==='image'&&b.attachment).map((b:any)=>b.attachment)};}}
}
/** Resolve only images admitted in the calling agent's user history. */
export async function hydratePublishedCanvas(ctx:any,canvas:CanvasDocument,exec:any){
 const content={type:'doc',content:[{type:'canvasBlock',attrs:{document:canvas}}]},messages=exec.agent?.session?.deriveMessages?.(),cache=new Map<string,Promise<string>>();
 const hydrated=await hydrateRichContent(content,(documentId,ordinal)=>{const key=`${documentId}:${ordinal}`;let pending=cache.get(key);if(!pending){pending=(async()=>{if(!messages)throw new Error('图片引用需要合法 Agent 会话');const ref=findSubmittedDocument(messages,documentId)?.images[ordinal];if(!ref)throw new Error('图像来源不存在于当前会话，请用户重新提交对应画布');const image=await ctx.attachments.readImage(ref,exec.signal);return `data:${image.ref.mediaType};base64,${Buffer.from(image.data).toString('base64')}`;})();cache.set(key,pending);}return pending;});
 return hydrated.content![0]!.attrs!.document as CanvasDocument;
}
