import type {QuickJSWASMModule} from 'quickjs-emscripten-core';
import {assertUIState,type UIState} from './state';
/** Retain one isolated context per preview; no DOM, network or host bindings. */
export function createPreviewExecutor(engine:QuickJSWASMModule,code:string){
 const runtime=engine.newRuntime();runtime.setMemoryLimit(8*1024*1024);runtime.setMaxStackSize(256*1024);let deadline=Date.now()+180,disposed=false;runtime.setInterruptHandler(()=>Date.now()>deadline);const context=runtime.newContext();
 const evaluate=(script:string)=>{const result=context.evalCode(script,'ui-preview.js');if(result.error){const error=context.dump(result.error);result.error.dispose();throw new Error(`${error?.name||'PREVIEW_ERROR'}: ${error?.message||JSON.stringify(error)}`);}return result.value;};
 const dispose=()=>{if(!disposed){disposed=true;context.dispose();runtime.dispose();}};
 try{const result=evaluate('"use strict";\n'+code+'\n;typeof onAction');const type=context.getString(result);result.dispose();if(type!=='function')throw new Error('请定义 onAction(state,event)');}catch(e){dispose();throw e;}
 return {run(state:Record<string,unknown>,event:unknown):UIState{if(disposed)throw new Error('预览逻辑已关闭');assertUIState(state);deadline=Date.now()+180;
  const value=evaluate(`(()=>{const value=onAction(${JSON.stringify(state)},${JSON.stringify(event)});if(value&&typeof value.then==='function')throw Error('只支持同步状态处理');return JSON.stringify(value);})()`);
  try{const text=context.getString(value);if(text.length>262144)throw new Error('状态超过 64 KiB');const parsed=JSON.parse(text);assertUIState(parsed,true);return parsed;}finally{value.dispose();}
 },dispose};
}
export function executePreviewLogic(engine:QuickJSWASMModule,code:string,state:Record<string,unknown>,event:unknown){const executor=createPreviewExecutor(engine,code);try{return executor.run(state,event);}finally{executor.dispose();}}
