import {z} from 'zod';
import type {Editor,JSONContent} from '@tiptap/core';
import {getRendererSettings} from '../settings';
import {migrateRichContent} from './migrate';
import {id} from '../protocol';
import {closeHistory} from '@tiptap/pm/history';
import {SYMBOLS,selectionText} from './selection';
import {validateRichContent} from './wire';
export const OperationSchema=z.discriminatedUnion('kind',[
 z.object({kind:z.literal('replace'),fragmentId:z.string().max(100),from:z.number().int().min(0),to:z.number().int().min(0),text:z.string().max(30000),category:z.enum(['symbol','expression','translation','rewrite','correction']).optional()}).strict(),
 z.object({kind:z.literal('insert'),afterFragmentId:z.string().max(100),node:z.any()}).strict()
]);
export const RecommendationSchema=z.object({slot:z.number().int().min(0).max(29),status:z.enum(['ready','empty']),label:z.string().max(100).optional(),intent:z.string().max(500).optional(),operations:z.array(OperationSchema).max(40).optional()}).strict();
export const BatchSchema=z.object({plans:z.array(RecommendationSchema).max(30)}).strict();
export type Recommendation=z.infer<typeof RecommendationSchema>;
export type SelectionSnapshot=ReturnType<typeof selectionText>;
export function validateRecommendation(plan:Recommendation,snapshot:SelectionSnapshot,mode='recommendation'){
 if(plan.status==='empty')return; if(!plan.label?.trim()||!plan.intent?.trim()||!plan.operations?.length)throw new Error('推荐缺少名称、意图或完整操作');
 const intervals=new Map<string,{from:number;to:number}[]>();for(const op of plan.operations){if(op.kind==='replace'){const fragment=snapshot.fragments.find(f=>f.id===op.fragmentId);if(!fragment||op.to<op.from||op.to>fragment.text.length)throw new Error('替换范围超出选区');if(mode==='text-information'&&(!['symbol','expression','correction'].includes(op.category||'')||op.category==='symbol'&&(!/^[\p{L}\p{N}\s-]{1,80}$/u.test(fragment.text.slice(op.from,op.to))||op.text.length>30)))throw new Error('文本信息操作不符合局部替换要求');if(mode==='text-information'){const word=fragment.text.slice(op.from,op.to).toLowerCase(),canonical=SYMBOLS[word];if(canonical&&op.text!==canonical)throw new Error('明确数学符号必须替换为其规范字符');}const ranges=intervals.get(op.fragmentId)||[];if(ranges.some(r=>op.from<r.to&&op.to>r.from))throw new Error('同一方案的替换范围重叠');ranges.push({from:op.from,to:op.to});intervals.set(op.fragmentId,ranges);}else{if(mode!=='recommendation')throw new Error('此操作只允许替换文本');if(!snapshot.fragments.some(f=>f.id===op.afterFragmentId))throw new Error('插入位置不属于选区');if(!['textBox','codeBlock','canvasBlock','mathBlock','uiBlock','musicBlock','visualTextBlock','formula'].includes(op.node?.type))throw new Error('不支持的插入组件');validateRichContent({type:'doc',content:[op.node]});}}
}
export function operationFingerprint(plan:Recommendation){return JSON.stringify((plan.operations||[]).map(op=>op.kind==='replace'?{kind:op.kind,fragmentId:op.fragmentId,from:op.from,to:op.to,text:op.text}:op).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))));}
export function readyRecommendations(raw:unknown,snapshot:SelectionSnapshot,slots:number[],mode='recommendation'){
 const batch=BatchSchema.parse(raw),seen=new Set<string>(),used=new Set<number>();return batch.plans.filter(plan=>{if(!slots.includes(plan.slot)||used.has(plan.slot)||plan.status!=='ready')return false;validateRecommendation(plan,snapshot,mode);const key=operationFingerprint(plan);if(seen.has(key))return false;seen.add(key);used.add(plan.slot);if(mode==='text-information'){const op=plan.operations?.find(o=>o.kind==='replace');if(op?.kind==='replace'){const f=snapshot.fragments.find(f=>f.id===op.fragmentId)!;plan.label=`${f.text.slice(op.from,op.to)} → ${op.text}`;}}return true;});
}
export function applyRecommendation(editor:Editor,snapshot:SelectionSnapshot,plan:Recommendation){validateRecommendation(plan,snapshot);for(const f of snapshot.fragments)if(editor.state.doc.textBetween(f.from,f.to,'\n')!==f.text)throw new Error('选区内容已经变化，请重新打开菜单');const edits:{from:number;to:number;text?:string;node?:JSONContent}[]=[];for(const op of plan.operations||[]){if(op.kind==='replace'){const f=snapshot.fragments.find(f=>f.id===op.fragmentId)!;edits.push({from:f.from+op.from,to:f.from+op.to,text:op.text});}else{const f=snapshot.fragments.find(f=>f.id===op.afterFragmentId)!;edits.push({from:f.to,to:f.to,node:op.node});}}const tr=closeHistory(editor.state.tr);for(const edit of edits.sort((a,b)=>b.from-a.from||b.to-a.to)){if(edit.node){const value=migrateRichContent(edit.node);if(value.attrs?.document){if(value.type==='canvasBlock')value.attrs.document.canvasId=id();else value.attrs.document.id=id();value.attrs.document.mode='editable';}const node=editor.schema.nodeFromJSON(value);node.check();tr.replaceRangeWith(edit.from,edit.from,node);}else tr.insertText(edit.text||'',edit.from,edit.to);}editor.view.dispatch(tr);editor.commands.focus();}
export function selectionRequest(snapshot:SelectionSnapshot,mode:string,slots:number[],language='中文'){return {mode,maxReviewCorrections:getRendererSettings().maxReviewCorrections,fragments:snapshot.fragments.map(({id,text})=>({id,text})),slots,targetLanguage:language};}
