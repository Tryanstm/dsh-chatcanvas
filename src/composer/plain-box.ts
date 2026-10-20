import type {JSONContent} from '@tiptap/core';
/** Textarea-like text: preserve lines, discard marks and nested visual containers. */
export function plainBoxContent(node:JSONContent):JSONContent[]{
 const inline=new Set(['text','hardBreak','formula','image']);
 const children=(n:JSONContent):string=>{let value='',previousBlock=false,first=true;for(const child of n.content||[]){const block=!inline.has(child.type||'');if(!first&&(previousBlock||block))value+='\n';value+=text(child);previousBlock=block;first=false;}return value;};
 const text=(n:JSONContent):string=>n.type==='text'?n.text||'':n.type==='hardBreak'?'\n':n.type==='formula'?String(n.attrs?.expression||''):n.type==='image'?String(n.attrs?.alt||''):n.attrs?.document?String(n.attrs.document.text||n.attrs.document.title||''):children(n);
 const lines=children(node).split('\n');
 return lines.map(line=>({type:'paragraph',...(line?{content:[{type:'text',text:line}]}:{})}));
}
export function isPlainBox(node:{type?:any;attrs?:any}){return (typeof node.type==='string'?node.type:node.type?.name)==='textBox'&&node.attrs?.variant!=='writing';}
