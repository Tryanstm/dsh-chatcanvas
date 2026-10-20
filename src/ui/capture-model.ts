import type {UIDocument,UIViewState} from '../protocol';
import {buildPreviewDocument} from './UIPreview';
/** Snapshot uses the same bindings/repeat renderer, without executing custom logic. */
export async function captureUIModel(document:UIDocument,viewState:UIViewState|undefined,width:number,height:number){
 const frame=globalThis.document.createElement('iframe'),nonce=crypto.randomUUID().replaceAll('-','');frame.sandbox.add('allow-scripts');frame.title='生成界面预览图';frame.setAttribute('aria-hidden','true');Object.assign(frame.style,{position:'fixed',left:'-100000px',top:'0',width:width+'px',height:height+'px',border:'0',pointerEvents:'none'});
 frame.srcdoc=buildPreviewDocument({...document,code:undefined,events:undefined,clock:undefined},nonce,true,viewState,true,{viewport:{width,height}});
 return new Promise<string>((resolve,reject)=>{let timer:ReturnType<typeof setTimeout>;const clean=()=>{clearTimeout(timer);window.removeEventListener('message',message);frame.remove();},message=(e:MessageEvent)=>{if(e.source!==frame.contentWindow||e.data?.protocol!=='dser-ui-v1'||e.data.nonce!==nonce)return;if(e.data.type==='ready')frame.contentWindow?.postMessage({protocol:'dser-ui-capture',nonce},'*');if(e.data.type==='capture'){clean();resolve(e.data.data);}if(e.data.type==='capture-error'||e.data.type==='error'){clean();reject(new Error(e.data.message||'界面预览图生成失败'));}};window.addEventListener('message',message);timer=setTimeout(()=>{clean();reject(new Error('界面预览图生成超时'));},8000);globalThis.document.body.append(frame);});
}
