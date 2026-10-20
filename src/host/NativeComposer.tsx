import {usePluginPreferences} from './settings-ui';
import {mountNativeReferences} from '../composer/native-references';
import {routeCanvasImages} from '../canvas/ImageImport';
import {useAdaptiveComposer} from './adaptive-composer';
import React,{useEffect,useRef,useState} from 'react';
import type {Editor} from '@tiptap/core';
import {CommandMenuContext} from './CommandMenu';
import {Composer} from '../composer/Composer';
import {sendRichSnapshot} from './send';
import {ErrorBoundary} from '../renderer/ErrorBoundary';
import {adoptNativeDraft} from '../composer/native-draft';
import {decorateEntries} from './decorate-client';

/** Replace the bar, preserving the official hero, workspace row, input dock and chain. */
export function registerNativeComposer(ctx:any){
 return decorateEntries(ctx,'conversation.composer.bar',e=>(e.options.priority??0)===0,Native=>function NativeBar(props:any){
   const features=usePluginPreferences();if(!features.nativeComposer||!props.sessionId||props.disabled)return <Native {...props}/>;
   return <ErrorBoundary><RichBar {...props} ctx={ctx}/></ErrorBoundary>;
 });
}
function RichBar(p:any){const bar=useRef<HTMLDivElement>(null);useAdaptiveComposer(bar);
 const input=p.useInput((s:any)=>s),running=p.useSession((s:any)=>s.running),removed=p.useSession((s:any)=>s.removed),uploads=p.useFileUploads((s:any)=>s),notices=p.useNotices((s:any)=>s),menuOpen=p.useMenuLauncher((source:any)=>source!==undefined),[editor,setEditor]=useState<Editor>(),mirror=useRef(''),lastNative=useRef<string>(),[error,setError]=useState('');
 const attachments=p.resolveDraftAttachments?.(input?.attachmentIds||[])||[],locked=removed||!!p.blocked||!input,machineBusy=['adjudicating','submitting'].includes(input?.phase),uploadPending=attachments.some((a:any)=>a.kind==='file'&&uploads[a.id]?.status!=='ready');
 const slot=(name:string,props:any={})=>p.renderSlot(name,props);
 useEffect(()=>{if(!editor||!p.renderFactorySlot)return;return mountNativeReferences(editor,p.ctx.uiConversation?.userText,raw=>p.renderFactorySlot('conversation.user.text',{text:raw,facts:{},interactive:true}));},[editor,p.renderFactorySlot]);
 useEffect(()=>{if(!editor)return;lastNative.current=input.draft;const sync=()=>{mirror.current=editor.state.doc.textBetween(0,editor.state.doc.content.size,'\n','');p.inputActions.setDraft(mirror.current);};if(editor.isEmpty&&input.draft)adoptNativeDraft(editor,input.draft);sync();editor.on('update',sync);const dismiss=()=>p.keyboard.dismissPopup();editor.view.dom.addEventListener('pointerdown',dismiss);return()=>{editor.off('update',sync);editor.view.dom.removeEventListener('pointerdown',dismiss);};},[editor]);
 useEffect(()=>{if(!editor)return;const dom=editor.view.dom,key=(e:KeyboardEvent)=>{const name=({ArrowUp:'up',ArrowDown:'down',Enter:'enter',Escape:'escape',Tab:e.shiftKey?'tabBack':'tab'} as Record<string,string>)[e.key];if(name&&p.keyboard.arbitrate(name,e.isComposing)!=='pass'){e.preventDefault();e.stopPropagation();}else if(e.key===' '&&!e.isComposing&&p.keyboard.space()){e.preventDefault();e.stopPropagation();}};dom.addEventListener('keydown',key,true);return()=>dom.removeEventListener('keydown',key,true);},[editor]);
 useEffect(()=>{if(!editor)return;const ctx=p.ctx,scope=ctx.sessions.scope(p.sessionId),controller=ctx.get?.('inputTriggers')?.sessionOf(scope);if(!controller)return;const track=()=>{const text=editor.state.doc.textBetween(0,editor.state.doc.content.size,'\n',''),caret=editor.state.doc.textBetween(0,editor.state.selection.from,'\n','').length;controller.track(text,caret,{tier:locked?'frozen':'plain'},input.draftRev);};editor.on('selectionUpdate',track);track();return()=>{editor.off('selectionUpdate',track);};},[editor,input.draft,input.draftRev,locked]);
 useEffect(()=>{if(!editor||input.draft===lastNative.current)return;lastNative.current=input.draft;if(input.draft===mirror.current)return;try{adoptNativeDraft(editor,input.draft);mirror.current=input.draft;}catch(e){setError(String(e));}},[input.draft,editor]);
 return <CommandMenuContext.Provider value={{ctx:p.ctx,sessionId:p.sessionId,editor}}><div ref={bar} className="dser-native-bar" data-variant={p.variant}>
  {notices&&<div className={notices.level==='error'?'dser-error':'dser-native-notice'} role="status">{notices.text}</div>}
  <Composer scope={`${p.sessionId}/native`} busy={running} disabled={locked||machineBusy} sendBlocked={uploadPending} hasAttachments={attachments.length>0} onStop={p.stop}
   onEditor={setEditor}
   bindFilePicker={picker=>p.keyboard.bindFilePicker(picker)}
   onCommands={()=>{if(!p.toggleCommandMenu){setError('当前会话未提供官方命令菜单');return;}editor?.commands.focus();const span=editor?{start:editor.state.doc.textBetween(0,editor.state.selection.from,'\n','').length,end:editor.state.doc.textBetween(0,editor.state.selection.to,'\n','').length}:p.keyboard.caretSpan();p.toggleCommandMenu(span);}}
   onAttach={files=>{if(routeCanvasImages(files))return;const reason=p.addFiles?.(files);if(reason)throw new Error(reason);}}
   leading={<div className="dser-native-leading">{slot('conversation.input.permission',{locked})}{slot('conversation.input.plan',{locked})}{slot('conversation.input.left')}</div>}
   footer={<>{slot('conversation.input.right')}{slot('conversation.input.model',{locked:removed})}{slot('conversation.input.activity',{locked,onActiveChange:()=>{}})}</>}
   accessory={<><div data-composer-overlay>{slot('conversation.input.overlay')}</div><div className="dser-native-attachments">{slot('conversation.input.attachments',{attachments,canAcceptDrop:!locked&&!machineBusy,onAddFiles:(files:File[])=>{if(routeCanvasImages(files))return;const reason=p.addFiles(files);if(reason)setError(reason);},onRemoveAttachment:p.removeAttachment,uploads,onRetryFile:p.retryFileUpload})}</div></>}
   onSubmit={async value=>{const ids=attachments.map((a:any)=>a.id);await sendRichSnapshot(p.ctx,p.sessionId,value,ids);ids.forEach((id:string)=>p.removeAttachment?.(id));}}
  />
  {error&&<div className="dser-error">{error}</div>}
  {p.variant==='composer'&&<div className="dser-native-dock">{slot('conversation.composer.dock')}</div>}
 </div></CommandMenuContext.Provider>;
}
