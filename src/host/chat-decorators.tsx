import React,{useEffect,useRef,useSyncExternalStore} from 'react';
import {decorateEntries} from './decorate-client';import {observeStream,useBatchedNode} from '../stream';import {usePluginPreferences} from './settings-ui';
type Decorator=React.ComponentType<{children:React.ReactNode;node:any;sessionId?:string;groupPart?:string}>;
let revision=0;const decorators=new Map<string,Decorator>(),listeners=new Set<()=>void>();
export function registerReasoningDecorator(id:string,component:Decorator){if(!id||decorators.has(id))throw Error('请使用唯一的扩展 ID');decorators.set(id,component);revision++;listeners.forEach(fn=>fn());return()=>{if(decorators.get(id)===component){decorators.delete(id);revision++;listeners.forEach(fn=>fn());}};}
export function registerAssistantPresentation(ctx:any){return decorateEntries(ctx,'conversation.chat.node',e=>e.options.key==='assistant-step',Native=>function Assistant(props:any){
 const settings=usePluginPreferences(),node=useBatchedNode(props.node),el=useRef<HTMLDivElement>(null);useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},()=>revision,()=>revision);
 useEffect(()=>{if(settings.streamAnimation&&node.data.status==='running'&&el.current)return observeStream(el.current);},[node.data.status,settings.streamAnimation]);
 let child:React.ReactNode=<Native {...props} node={node}/>;if(props.groupPart!=='response')for(const [id,Component]of decorators)child=<Component key={id} node={node} sessionId={props.sessionId} groupPart={props.groupPart}>{child}</Component>;
 return <div className="dser-native-stream" ref={el}>{child}</div>;
});}
