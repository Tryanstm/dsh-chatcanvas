import React from 'react';
import {readRichWire,richImageOrdinals} from '../composer/wire';import {copyRichContent} from '../composer/clipboard';
import {SentDocument} from '../renderer/SentDocument';import {usePluginPreferences} from './settings-ui';
/** One native Factory is shared by optimistic echoes, steering and durable messages. */
export function registerUserPresentation(ctx:any){
 if(typeof ctx.slots.factory!=='function'||typeof ctx.slots.subscribeFactory!=='function')return;
 ctx.effect(()=>{const owned=new Map<any,{native:any;wrapped:any}>();
  const refresh=()=>{const definition=ctx.slots.factory('conversation.chat.user.content');if(!definition||owned.has(definition))return;const Native=definition.component;
   function RichUserContent(props:any){const settings=usePluginPreferences(),wire=props.content?.text||'',envelope=readRichWire(wire);if(!envelope)return <Native {...props}/>;
    const images=(props.content.attachments||[]).filter((a:any)=>a.type==='image').map((a:any)=>a.image),used=richImageOrdinals(envelope);let ordinal=0;
    const content={...props.content,attachments:(props.content.attachments||[]).filter((a:any)=>a.type!=='image'||!used.has(ordinal++))};
    const resolve=async(documentId:string,index:number)=>{if(documentId!==envelope.documentId)throw Error('图像文档不匹配');const image=images[index];if(image?.preview?.url){const blob=await(await fetch(image.preview.url)).blob();return await dataURL(blob);}if(!image?.attachment||!props.loadImage)throw Error('图像附件不可用');const url=await props.loadImage(image.attachment);return dataURL(await(await fetch(url)).blob());};
    const submit=(canvas:any,id?:string)=>ctx.get('enhancedRenderer')?.submitCanvas(props.sessionId,canvas,id);
    return <div className="dser-rich-user-content" onCopyCapture={e=>{const selected=globalThis.getSelection?.()?.toString();if(!selected){e.preventDefault();void copyRichContent(envelope.content);}}}><Native {...props} content={content} renderFactorySlot={(name:string,owner:any,...rest:any[])=>{
     if(name!=='conversation.user.text')return props.renderFactorySlot(name,owner,...rest);
     if(!settings.richMessages)return props.renderFactorySlot(name,{...owner,text:envelope.plainText},...rest);
     return <SentDocument envelope={envelope} scope={`${props.sessionId||'native'}/sent/${envelope.documentId}`} resolveImage={resolve} renderNativeText={text=>props.renderFactorySlot(name,{...owner,text},...rest)} onSubmit={submit} onCopyComponent={node=>insert(ctx,props.sessionId,{node})} onCopy={canvas=>insert(ctx,props.sessionId,{canvas})}/>;
    }}/></div>;
   }
   definition.component=RichUserContent;owned.set(definition,{native:Native,wrapped:RichUserContent});ctx.emit?.('slots/changed','conversation.chat.user.content');
  };
  const stop=ctx.slots.subscribeFactory('conversation.chat.user.content',refresh);refresh();return()=>{stop();for(const [d,pair]of owned)if(d.component===pair.wrapped){d.component=pair.native;ctx.emit?.('slots/changed','conversation.chat.user.content');}};
 });
}
function insert(_ctx:any,sessionId:string,detail:any){document.querySelector(`[data-dser-composer="${CSS.escape(`${sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail}));}
function dataURL(blob:Blob){return new Promise<string>((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result));reader.onerror=()=>reject(reader.error);reader.readAsDataURL(blob);});}
