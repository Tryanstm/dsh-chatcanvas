import {prepareRichTransport,formatRichWire,canvasSubmissionSnapshot} from '../composer/wire';
import {enrichCanvasPreviews} from '../canvas/raster';
import type {ComposerSnapshot} from '../composer/extensions';import type {CanvasDocument} from '../protocol';
/** Use the native attachment and prompt admission path; never write session files. */
export async function sendRichSnapshot(ctx:any,sessionId:string,snapshot:ComposerSnapshot,attachments:string[]=[],questionId?:string){const c=ctx.get('conversation'),binding=ctx.sessions.binding(sessionId);if(!c||!binding)throw new Error('Conversation 服务不可用');snapshot=await enrichCanvasPreviews(snapshot);const owned=c.resolveDraftAttachments(attachments),existingImages=owned.filter((a:any)=>a.kind==='image').length,{envelope,images}=prepareRichTransport(snapshot,existingImages,questionId);
 const files=images.map(image=>{const encoded=image.data.slice(image.data.indexOf(',')+1),binary=atob(encoded),bytes=Uint8Array.from(binary,ch=>ch.charCodeAt(0));return new File([bytes.buffer],image.name,{type:image.mime});});const generated=c.createDrafts(sessionId,files),ids=[...attachments,...generated.map((a:any)=>a.id)];let accepted=false;
 try{const result=await c.sendSession(binding.session,formatRichWire(envelope),ids,'queue',new AbortController().signal);if(result.kind!=='success')throw new Error('宿主未接收提交，编辑草稿已保留');accepted=true;for(const id of attachments)c.releaseDraftAttachment(id);}finally{for(const a of generated)c.releaseDraftAttachment(a.id);}return envelope;
}
export function sendCanvasSnapshot(ctx:any,sessionId:string,canvas:CanvasDocument,questionId?:string){return sendRichSnapshot(ctx,sessionId,canvasSubmissionSnapshot(canvas),[],questionId);}
