import React,{useEffect,useMemo,useRef,useState,useSyncExternalStore} from 'react';
import {useBatchedNode,observeStream} from '../stream';
import {CanvasEditor} from '../canvas/CanvasEditor';
import {Composer} from '../composer/Composer';
import type {CanvasDocument} from '../protocol';
import type {ComposerSnapshot} from '../composer/extensions';
import {ErrorBoundary,CreationCard} from './ErrorBoundary';
export interface RendererMessage {key:string;kind:string;nativeProps?:Record<string,any>;canvas?:CanvasDocument;state?:string;error?:{code:string;message:string};}
export interface RendererSnapshot {messages:readonly RendererMessage[];thinking?:boolean;busy?:boolean;loading?:boolean;error?:{code:string;message:string};}
/** Branch selection and event assembly remain owned by the caller. */
export interface RendererHostAdapter {
 viewId:string;sessionId:string;branchId:string;region:'main'|'sidebar'|'floating';
 getSnapshot:()=>RendererSnapshot;subscribe:(listener:()=>void)=>()=>void;
 renderNative:(message:RendererMessage)=>React.ReactNode;
 submit:(document:ComposerSnapshot)=>Promise<void>|void;
 submitCanvas:(document:CanvasDocument,questionId?:string)=>Promise<void>|void;
 retry?:()=>void;attach?:(files:File[])=>Promise<void>|void;openModelConfig?:()=>void;stop?:()=>void;
 active?:boolean;historyEvents?:readonly unknown[];streamingSource?:{subscribe:(listener:(event:unknown)=>void)=>()=>void};
}
const NativeSeat=React.memo(function NativeSeat({message,adapter}:{message:RendererMessage;adapter:RendererHostAdapter}){const ref=useRef<HTMLDivElement>(null);useEffect(()=>{if(message.nativeProps?.node?.data?.status==='running'&&ref.current)return observeStream(ref.current);},[message.nativeProps?.node?.data?.status]);return <div ref={ref} className="dser-native-seat">{adapter.renderNative(message)}</div>;});
export function RendererView({adapter}:{adapter:RendererHostAdapter}){
 const snapshot=useSyncExternalStore(adapter.subscribe,adapter.getSnapshot),scope=`${adapter.sessionId}/${adapter.branchId}/${adapter.viewId}`;const scroll=useRef<HTMLDivElement>(null),following=useRef(true),initialized=useRef(false),composer=useRef<HTMLDivElement>(null);const [atBottom,setAtBottom]=useState(true),[historyMenu,setHistoryMenu]=useState<{text:string;x:number;y:number}>();
 useEffect(()=>{const el=scroll.current!;const ob=new ResizeObserver(()=>{if(following.current)el.scrollTop=el.scrollHeight;});ob.observe(el.firstElementChild!);const saved=sessionStorage.getItem(`dser-scroll/${scope}`);el.scrollTop=saved?Number(saved):el.scrollHeight;following.current=el.scrollHeight-el.clientHeight-el.scrollTop<64;setAtBottom(following.current);initialized.current=true;return()=>{sessionStorage.setItem(`dser-scroll/${scope}`,String(el.scrollTop));ob.disconnect();};},[scope]);
 useEffect(()=>{if(following.current&&initialized.current)scroll.current!.scrollTop=scroll.current!.scrollHeight;},[snapshot.messages]);
 const copy=(canvas:CanvasDocument)=>composer.current?.querySelector('[data-dser-composer]')?.dispatchEvent(new CustomEvent('dser-insert',{detail:{canvas}}));
 return <div className={`dser-view dser-region-${adapter.region}`} data-view={adapter.viewId}><div className="dser-chat-scroll" ref={scroll} onScroll={()=>{const el=scroll.current!;following.current=el.scrollHeight-el.clientHeight-el.scrollTop<64;setAtBottom(following.current);setHistoryMenu(undefined);}} onContextMenu={e=>{if((e.target as HTMLElement).closest('.dser-canvas'))return;const text=window.getSelection()?.toString();if(text){e.preventDefault();setHistoryMenu({text,x:e.clientX,y:e.clientY});}}}>
 <div className="dser-chat-column">{snapshot.loading&&<div className="dser-loading">正在恢复消息…</div>}{snapshot.messages.map(message=><ErrorBoundary key={message.key}>{message.canvas?<CanvasEditor document={{...message.canvas,mode:message.canvas.question&&message.canvas.mode==='editable'?'editable':'readonly'}} scope={`${scope}/${message.key}`} active={adapter.active} onCopy={copy} onSubmit={adapter.submitCanvas}/>:message.kind==='dser-canvas'?<CreationCard state={message.state||'creating'} error={message.error} onRetry={adapter.retry}/>:<NativeSeat message={message} adapter={adapter}/>}</ErrorBoundary>)}{snapshot.thinking&&<div className="dser-loading">正在思考…</div>}{snapshot.error&&<div className="dser-error" role="alert">{snapshot.error.code}: {snapshot.error.message}{adapter.retry&&<button onClick={adapter.retry}>重试</button>}</div>}</div></div>{!atBottom&&<button className="dser-to-bottom" onClick={()=>{following.current=true;scroll.current!.scrollTop=scroll.current!.scrollHeight;setAtBottom(true);}}>↓ 最新消息</button>}<div className="dser-composer-seat" ref={composer}><ErrorBoundary><Composer scope={scope} onSubmit={adapter.submit} onAttach={adapter.attach} onModelConfig={adapter.openModelConfig} onStop={adapter.stop} busy={snapshot.busy}/></ErrorBoundary></div>{historyMenu&&<div className="dser-context" style={{left:Math.min(historyMenu.x,window.innerWidth-310),top:Math.min(historyMenu.y,window.innerHeight-140)}} onMouseDown={e=>e.preventDefault()}><button onClick={()=>{navigator.clipboard.writeText(historyMenu.text);setHistoryMenu(undefined);}}>复制</button><button onClick={()=>{composer.current?.querySelector('[data-dser-composer]')?.dispatchEvent(new CustomEvent('dser-insert',{detail:{text:historyMenu.text}}));setHistoryMenu(undefined);}}>复制为可编辑草稿</button><button onClick={()=>setHistoryMenu(undefined)}>关闭</button></div>}</div>;
}

