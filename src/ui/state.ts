import {z} from 'zod';
export type JSONValue=string|number|boolean|null|JSONValue[]|{[key:string]:JSONValue};
export type UIState=Record<string,JSONValue>;
/** One budget for initial data, worker replies, saved views and tool payloads. */
export function assertUIState(value:unknown,internal=false):asserts value is UIState{
 let count=0;const blocked=new Set(['__proto__','prototype','constructor']);
 const walk=(v:unknown,depth:number)=>{
  if(depth>6||++count>6000)throw new Error('界面状态超过嵌套深度或数据数量限制');
  if(v===null||typeof v==='string'||typeof v==='boolean')return;
  if(typeof v==='number'&&Number.isFinite(v))return;
  if(Array.isArray(v)){if(v.length>1000)throw new Error('列表最多包含 1000 项');v.forEach(x=>walk(x,depth+1));return;}
  if(typeof v!=='object'||!v)throw new Error('界面状态只能包含有效 JSON 数据');
  for(const [k,x]of Object.entries(v)){if(blocked.has(k)||k.startsWith('__dser')&&!(internal&&depth===0&&['__dserPage','__dserPlayback','__dserEffects','__dserRuntime'].includes(k)))throw new Error('非法界面状态名称');if(internal&&depth===0&&k==='__dserRuntime'){if(typeof x!=='string'||x.length>196608)throw Error('程序运行快照无效');continue;}walk(x,depth+1);}
 };
 if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).length>(internal?104:100))throw new Error('界面状态最多包含 100 个顶层字段');
 walk(value,0);if(new TextEncoder().encode(JSON.stringify(internal?Object.fromEntries(Object.entries(value as any).filter(([k])=>k!=='__dserRuntime')):value)).length>65536)throw new Error('界面状态超过 64 KiB');
}
export const JSONSchema=z.custom<JSONValue>(value=>{try{assertUIState({value});return true;}catch{return false;}},'动作值必须是受限 JSON 数据');
export const UIStateSchema=z.custom<UIState>(value=>{try{assertUIState(value);return true;}catch{return false;}},'界面状态必须是有限 JSON：最多 100 个字段、深度 6、64 KiB');
