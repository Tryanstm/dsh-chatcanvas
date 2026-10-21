import {registerSettingsUI} from './settings-ui';
import {registerAssistantPresentation,registerReasoningDecorator} from './chat-decorators';
import {registerUserPresentation} from './user-presentation';
import {registerClipboardCompatibility} from './copy';
import {copyRichContent} from '../composer/clipboard';
import {CreationView,creationDefinition} from './CreationView';
import {registerPendingPresentation} from './pending-presentation';
import {registerCanvasQuestionUI} from './CanvasQuestion';
import {registerCommandMenu} from './CommandMenu';
import {registerNativeComposer} from './NativeComposer';
import React,{useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {createRoot,type Root} from 'react-dom/client';
import {CanvasEditor} from '../canvas/CanvasEditor';import {PublishedCanvas} from './PublishedCanvas';
import {PublishedDocument,documentDefinition} from './PublishedDocument';
import {configureRenderer,configureRendererIntegrations,getRendererSettings,getRendererIntegrations} from '../settings';
import {Composer} from '../composer/Composer';
import {modelText} from '../composer/extensions';
import {readRichWire,describeRichDocument,richImageOrdinals} from '../composer/wire';import {writeClipboard} from '@deepseek-ai/dsh-client-ui-primitives';import {SentDocument} from '../renderer/SentDocument';import {sendRichSnapshot,sendCanvasSnapshot} from './send';
import {canvasDefinition,type CanvasNodeState} from './conversation';
import {useBatchedNode,observeStream} from '../stream';
import {ErrorBoundary,CreationCard} from '../renderer/ErrorBoundary';
import {RendererView,type RendererHostAdapter} from '../renderer/RendererView';
import css from '../styles.css';
export const inject=['slots','uiConversation','sessions','locale','remote','remote.skills','inputTriggers'];
export function apply(ctx:any){
 const style=document.createElement('style');style.dataset.plugin='dsh-chatcanvas';style.textContent=css;document.head.append(style);ctx.effect(()=>()=>style.remove());
 const previousRecommend=getRendererIntegrations().recommend;const recommend=async(input:any,signal:AbortSignal)=>{const response=await fetch('api/dser.recommend',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input),signal});const value=await response.json();if(!response.ok)throw new Error(value.error||'智能服务暂不可用');return value;};configureRendererIntegrations({recommend});ctx.effect(()=>()=>{if(getRendererIntegrations().recommend===recommend)configureRendererIntegrations({recommend:previousRecommend});});
 const mounts=new Set<Root>();ctx.effect(()=>()=>{mounts.forEach(root=>root.unmount());mounts.clear();});
 const renderCanvas=(props:any)=>{const node=props.node.data as CanvasNodeState;
  return <ErrorBoundary><PublishedCanvas node={node} sessionId={props.sessionId} scope={`${props.sessionId}/native/${props.node.key||node.callId}`} onCopy={canvas=>{const composer=document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`);if(composer)composer.dispatchEvent(new CustomEvent('dser-insert',{detail:{canvas}}));else void writeClipboard(JSON.stringify({type:'dser-canvas',document:canvas}));}} onSubmit={(canvas,questionId)=>props.submitCanvas(canvas,questionId)}/></ErrorBoundary>;};
 ctx.uiConversation.events.register(creationDefinition);
 ctx.slots.inject('conversation.chat.node',()=>ctx.slots.register({name:'conversation.chat.node',key:'dser-creation',inject:(sessionId:string)=>({sessionId})},(props:any)=><ErrorBoundary><CreationView node={props.node.data} sessionId={props.sessionId} scope={`${props.sessionId}/creation/${props.node.key}`} onCopyComponent={(node:any)=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{node}}))} onCopy={(canvas:any)=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{canvas}}))} onSubmit={(canvas:any,id?:string)=>sendCanvasSnapshot(ctx,props.sessionId,canvas,id)}/></ErrorBoundary>));
 ctx.slots.inject('conversation.chat.node',()=>ctx.slots.register({name:'conversation.chat.node',key:'dser-rich',inject:(sessionId:string)=>({sessionId})},(props:any)=><ErrorBoundary><PublishedDocument node={props.node.data} sessionId={props.sessionId} scope={`${props.sessionId}/published/${props.node.key}`} onCopyComponent={(node:any)=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{node}}))} onCopy={(canvas:any)=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{canvas}}))} onSubmit={(canvas:any,questionId?:string)=>sendCanvasSnapshot(ctx,props.sessionId,canvas,questionId)}/></ErrorBoundary>));
 ctx.slots.inject('conversation.chat.node',()=>ctx.slots.register({name:'conversation.chat.node',key:'dser-canvas',inject:(sessionId:string)=>({sessionId,submitCanvas:(canvas:any,questionId?:string)=>sendCanvasSnapshot(ctx,sessionId,canvas,questionId)})},renderCanvas));
 if(!ctx.slots.factory?.('conversation.chat.user.content'))for(const key of ['user','steering'])ctx.slots.inject('conversation.chat.node',()=>{const base=ctx.slots.entries('conversation.chat.node').find((e:any)=>e.options.key===key&&(e.options.priority??0)===0);if(!base)throw new Error(`官方 ${key} 渲染器不可用`);
  function SentNative(props:any){const [copyNotice,setCopyNotice]=useState(''),copyTimer=useRef<number>();useEffect(()=>()=>clearTimeout(copyTimer.current),[]);const content=props.node.data.content||[],block=content.find((b:any)=>b.type==='text'&&readRichWire(b.text||'')),envelope=block?readRichWire(block.text):undefined;if(!envelope)return <base.component {...props}/>;
   const images=content.filter((b:any)=>b.type==='image'&&b.attachment).map((b:any)=>b.attachment),viewNode={...props.node,data:{...props.node.data,content:content.filter((b:any)=>{if(b.type!=='image'||!b.attachment)return true;const ordinal=content.filter((x:any)=>x.type==='image'&&x.attachment).indexOf(b);return !richImageOrdinals(envelope).has(ordinal);}).map((b:any)=>b===block?{...b,text:''}:b)}};
   const resolve=async(documentId:string,ordinal:number)=>{if(documentId!==envelope.documentId)throw new Error('图像来源文档不匹配');const ref=images[ordinal];if(!ref||!props.loadImage)throw new Error('原生图像附件不存在');const url=await props.loadImage(ref),blob=await (await fetch(url)).blob();return new Promise<string>((accept,reject)=>{const r=new FileReader();r.onload=()=>accept(String(r.result));r.onerror=()=>reject(r.error);r.readAsDataURL(blob);});};
   const copy=(canvas:any)=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{canvas}}));
   return <div className="dser-sent-message"><div className="dser-sent-native" onClickCapture={e=>{const button=(e.target as Element).closest('button');if(button?.getAttribute('aria-label')!==(props.t?.('copy')||'复制'))return;e.stopPropagation();void copyRichContent(envelope.content).then(()=>{setCopyNotice(props.t?.('copied')||'已复制');clearTimeout(copyTimer.current);copyTimer.current=window.setTimeout(()=>setCopyNotice(''),1600);});}}><base.component {...props} node={viewNode}/>{copyNotice&&<small aria-live="polite">{copyNotice}</small>}</div><ErrorBoundary><SentDocument envelope={envelope} scope={`${props.sessionId}/sent/${envelope.documentId}`} resolveImage={resolve} onCopyComponent={node=>document.querySelector(`[data-dser-composer="${CSS.escape(`${props.sessionId}/native`)}"]`)?.dispatchEvent(new CustomEvent('dser-insert',{detail:{node}}))} onCopy={copy} onSubmit={async(canvas,id)=>{await sendCanvasSnapshot(ctx,props.sessionId,canvas,id);}}/></ErrorBoundary></div>;
  }
  return ctx.slots.register({name:'conversation.chat.node',key,priority:-10,locale:base.locale,inject:(sessionId:string)=>({sessionId})},SentNative);
 });
 // Keep the official tool transcript, while replacing only this tool's generic visual row.
 for(const key of ['canvas_publish','document_publish','math_publish','ui_publish','music_publish','text_publish'])ctx.slots.inject('tool.call.toolview',()=>ctx.slots.register({name:'tool.call.toolview',key},(props:any)=>props.phase==='preparing'?<CreationCard state="creating"/>:null));
 registerSettingsUI(ctx);registerUserPresentation(ctx);registerAssistantPresentation(ctx);
 registerClipboardCompatibility(ctx);registerPendingPresentation(ctx);registerCommandMenu(ctx);registerNativeComposer(ctx);registerCanvasQuestionUI(ctx);
 ctx.reflect.provide('enhancedRenderer',{
  mount(container:HTMLElement,adapter:RendererHostAdapter){const root=createRoot(container);mounts.add(root);root.render(<RendererView adapter={adapter}/>);return()=>{root.unmount();mounts.delete(root);};},
  version:3,registerReasoningDecorator,configure:configureRenderer,getSettings:getRendererSettings,configureIntegrations:configureRendererIntegrations,
  nativeEntries:()=>ctx.slots.entriesOfSlot('conversation.chat.node'),
  submitDocument:(sessionId:string,snapshot:any,attachmentIds:string[]=[],questionId?:string)=>sendRichSnapshot(ctx,sessionId,snapshot,attachmentIds,questionId),
  submitCanvas:(sessionId:string,canvas:any,questionId?:string)=>sendCanvasSnapshot(ctx,sessionId,canvas,questionId),
 });
}
const EMPTY_UPLOADS:Record<string,any>={};
// Exports share the host's React instance through ModuleLoader.
export {CanvasEditor,Composer,RendererView,SentDocument,registerReasoningDecorator};
export {prepareRichTransport,formatRichWire,readRichWire,describeCanvas} from '../composer/wire';

export {configureRenderer,configureRendererIntegrations,getRendererSettings} from '../settings';

export {MathBlockView,UIBlockView} from '../renderer/Standalone';
