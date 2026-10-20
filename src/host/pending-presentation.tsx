import {decorateEntries} from './decorate-client';
import React from 'react';
import {readRichWire} from '../composer/wire';
/** Presentation projection only. The admitted prompt and queue actions keep the full document. */
export function visiblePrompt(text:string){const doc=readRichWire(text);if(!doc)return text;return doc.plainText.trim()||doc.content.content?.map(n=>n.attrs?.document?.title||({canvasBlock:'画布',mathBlock:'函数图像',uiBlock:'界面预览'} as any)[n.type||'']).filter(Boolean).join('、')||'富文本消息';}
export function cleanPending(item:any){if('requestId' in item)return {...item,text:visiblePrompt(item.text)};return {...item,content:item.content.map((b:any)=>b.type==='text'?{...b,text:visiblePrompt(b.text)}:b)};}
export function registerPendingPresentation(ctx:any){
 decorateEntries(ctx,'conversation.view',e=>e.options.id==='chat',Native=>{
  const sessions=new WeakMap<object,any>(),inboxes=new WeakMap<object,any>();
  const sessionView=(s:any)=>{if(!s||!s.pendingSubmissions?.length)return s;let value=sessions.get(s);if(!value){value={...s,pendingSubmissions:s.pendingSubmissions.map((item:any)=>ctx.slots.factory?.('conversation.chat.user.content')&&item.placement==='transcript'?item:cleanPending(item))};sessions.set(s,value);}return value;};
  const inboxView=(s:any)=>{if(!s||typeof s!=='object')return s;let value=inboxes.get(s);if(!value){value=Object.fromEntries(Object.entries(s).map(([key,rows]:any)=>[key,Array.isArray(rows)?rows.map(cleanPending):rows]));inboxes.set(s,value);}return value;};
  const Wrapped=(props:any)=><Native {...props} useSession={(selector:any)=>props.useSession((s:any)=>selector(sessionView(s)))} useProjection={(key:string,selector?:any)=>props.useProjection(key,(value:any)=>{const next=key==='inbox'&&!ctx.slots.factory?.('conversation.chat.user.content')?inboxView(value):value;return selector?selector(next):next;})}/>;
  return Wrapped;
 });
 decorateEntries(ctx,'conversation.input.dock',e=>e.options.id==='queue',Native=>function Queue(props:any){
  const original=new Map<string,any>();
  return <Native {...props} {...(props.renderFactorySlot?{renderFactorySlot:(name:string,owner:any,...rest:any[])=>props.renderFactorySlot(name,name==='conversation.user.text'?{...owner,text:visiblePrompt(owner.text||'')}:owner,...rest)}:{})} useSession={(selector:any)=>props.useSession((s:any)=>selector({...s,pendingSubmissions:s.pendingSubmissions?.map(cleanPending)||[]}))} useProjection={(key:string,selector?:any)=>props.useProjection(key,(value:any)=>{const next=key==='inbox'&&value?Object.fromEntries(Object.entries(value).map(([k,rows]:any)=>[k,Array.isArray(rows)?rows.map((r:any)=>{original.set(r.id,r);return cleanPending(r);}):rows])):value;return selector?selector(next):next;})} updateQueue={(id:string,action:any)=>{if(action.kind==='edit'&&original.get(id)?.content.some((b:any)=>b.type==='text'&&readRichWire(b.text)))throw new Error('请先将富文本消息复制到输入框后修改；移除或立即发送仍可直接使用。');return props.updateQueue(id,action);}}/>;
 });
}
