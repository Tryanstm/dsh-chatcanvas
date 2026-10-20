import React from 'react';import {createRoot} from 'react-dom/client';import type {Editor} from '@tiptap/core';
import {Plugin,PluginKey} from '@tiptap/pm/state';import {Decoration,DecorationSet} from '@tiptap/pm/view';
const key=new PluginKey('dser-native-references');
/** Keep the exact native text in the document. Only its visual presentation becomes a chip. */
export function mountNativeReferences(editor:Editor,registry:any,render:(raw:string)=>React.ReactNode){
 if(!registry?.createEvaluator)return()=>{};const evaluate=registry.createEvaluator();let ranges:{from:number;to:number}[]=[];
 const position=(offset:number)=>{const doc=editor.state.doc;let a=0,b=doc.content.size;while(a<b){const m=Math.floor((a+b)/2);if(doc.textBetween(0,m,'\n','').length<offset)a=m+1;else b=m;}return Math.max(1,Math.min(doc.content.size-1,a));};
 const plugin=new Plugin({key,props:{decorations(state){const text=state.doc.textBetween(0,state.doc.content.size,'\n','');let nodes:any[];try{nodes=evaluate({text,facts:{}});}catch{return DecorationSet.empty;}const decorations:Decoration[]=[];ranges=[];
  for(const node of nodes){if(node.id==='text'||node.end<=node.start)continue;const from=position(node.start),to=position(node.end),raw=text.slice(node.start,node.end);if(to<=from)continue;ranges.push({from,to});decorations.push(Decoration.inline(from,to,{class:'dser-native-reference-raw','aria-hidden':'true'}));let root:ReturnType<typeof createRoot>|undefined;
   decorations.push(Decoration.widget(from,()=>{const dom=document.createElement('span');dom.className='dser-native-reference-chip';dom.contentEditable='false';root=createRoot(dom);root.render(<>{render(raw)}</>);return dom;},{side:-1,key:node.id+':'+from+':'+raw,destroy:()=>{const owned=root;queueMicrotask(()=>owned?.unmount());}}));
  }return DecorationSet.create(state.doc,decorations);
 },handleKeyDown(view,event){if(view.state.selection.empty&&['Backspace','Delete'].includes(event.key)){const pos=view.state.selection.from,r=ranges.find(r=>event.key==='Backspace'?pos>r.from&&pos<=r.to:pos>=r.from&&pos<r.to);if(r){event.preventDefault();view.dispatch(view.state.tr.delete(r.from,r.to));return true;}}return false;}}});
 editor.registerPlugin(plugin);const stop=registry.subscribe?.(()=>{if(!editor.isDestroyed)editor.view.dispatch(editor.state.tr.setMeta(key,true));});return()=>{stop?.();if(!editor.isDestroyed)editor.unregisterPlugin(key);};
}
