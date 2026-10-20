import {plainBoxContent,isPlainBox} from './plain-box';
import type {JSONContent} from '@tiptap/core';
/** Legacy inline content keeps its lines; writing boxes keep marks, plain boxes discard them. */
export function migrateRichContent(node:JSONContent):JSONContent {
 const next=structuredClone(node);const walk=(n:JSONContent)=>{if(isPlainBox(n)){n.content=plainBoxContent(n);return;}if(['textBox','tableCell','tableHeader'].includes(n.type||'')&&n.content?.some(c=>['text','hardBreak','formula','image'].includes(c.type||''))){const content:JSONContent[]=[];let inline:JSONContent[]=[];const flush=()=>{if(inline.length){content.push({type:'paragraph',content:inline});inline=[];}};for(const child of n.content){if(['text','hardBreak','formula','image'].includes(child.type||''))inline.push(child);else{flush();content.push(child);}}flush();n.content=content.length?content:[{type:'paragraph'}];}if(['tableCell','tableHeader'].includes(n.type||'')&&!n.content?.length)n.content=[{type:'paragraph'}];n.content?.forEach(walk);};walk(next);return next;
}
