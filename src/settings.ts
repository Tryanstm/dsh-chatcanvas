import {useSyncExternalStore} from 'react';
export interface RendererSettings {
 componentSize:number;contentMaxWidth:number;uiMaxHeight:number;
 showDeleteButtons:boolean;showAskSidebar:boolean;showFormatToolbar:boolean;
 programSlots:boolean[];aiSlots:boolean[];recommendationTimeoutMs:number;maxReviewCorrections:number;
}
const defaults:RendererSettings={componentSize:300,contentMaxWidth:952,uiMaxHeight:24000,showDeleteButtons:true,showAskSidebar:false,showFormatToolbar:false,programSlots:[true,true,false,false,false],aiSlots:[true,false,false,false,false],recommendationTimeoutMs:20000,maxReviewCorrections:1};
let settings:RendererSettings=structuredClone(defaults);const listeners=new Set<()=>void>();
export function getRendererSettings(){return settings;}
export function configureRenderer(patch:Partial<RendererSettings>){const next={...settings,...patch};for(const key of ['showDeleteButtons','showAskSidebar','showFormatToolbar'] as const)if(typeof next[key]!=='boolean')throw new Error('设置开关必须为布尔值');for(const key of ['programSlots','aiSlots'] as const){if(next[key].length!==5||next[key].some(v=>typeof v!=='boolean'))throw new Error('推荐槽位必须是五个开关');next[key]=[...next[key]];}for(const key of ['componentSize','contentMaxWidth','uiMaxHeight','recommendationTimeoutMs','maxReviewCorrections'] as const)if(!Number.isFinite(next[key])||next[key]<0)throw new Error('设置数值无效');if(!Number.isInteger(next.maxReviewCorrections))throw new Error('审核修正次数必须为整数');if(next.componentSize<100||next.contentMaxWidth<200||next.uiMaxHeight<10||next.maxReviewCorrections>3)throw new Error('设置数值超出范围');settings=next;listeners.forEach(fn=>fn());return settings;}
export function useRendererSettings(){return useSyncExternalStore(fn=>{listeners.add(fn);return()=>{listeners.delete(fn);};},getRendererSettings,getRendererSettings);}
export interface SidebarSelection {text:string;scope:string;}
export interface RendererIntegrations {askSidebar?:(selection:SidebarSelection)=>void|Promise<void>;recommend?:(input:any,signal:AbortSignal)=>Promise<any>;}
let integrations:RendererIntegrations={};
export function getRendererIntegrations(){return integrations;}
export function configureRendererIntegrations(patch:RendererIntegrations){integrations={...integrations,...patch};settings={...settings};listeners.forEach(fn=>fn());}
