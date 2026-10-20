import type {Editor} from '@tiptap/core';
import {readRichWire} from './wire';
/** Merge host-inserted references/commands without replacing embedded components. */
export function adoptNativeDraft(editor:Editor,next:string){
 const rich=readRichWire(next);if(rich){editor.commands.setContent(rich.content);return;}
 const doc=editor.state.doc,old=doc.textBetween(0,doc.content.size,'\n','');if(old===next)return;
 let prefix=0,suffix=0;while(prefix<old.length&&prefix<next.length&&old[prefix]===next[prefix])prefix++;
 while(suffix<old.length-prefix&&suffix<next.length-prefix&&old[old.length-1-suffix]===next[next.length-1-suffix])suffix++;
 const position=(offset:number)=>{let a=0,b=doc.content.size;while(a<b){const m=Math.floor((a+b)/2);if(doc.textBetween(0,m,'\n','').length<offset)a=m+1;else b=m;}return Math.max(1,Math.min(doc.content.size-1,a));};
 const from=position(prefix),to=position(old.length-suffix);let protectedBlock=false;doc.nodesBetween(from,to,node=>{if(node.isAtom&&!node.isText){protectedBlock=true;return false;}});
 if(protectedBlock)throw new Error('宿主操作涉及组件，请先在输入框定位光标后重试');
 const replacement=next.slice(prefix,next.length-suffix);if(replacement)editor.commands.insertContentAt({from,to},{type:'text',text:replacement});else editor.commands.deleteRange({from,to});
}
