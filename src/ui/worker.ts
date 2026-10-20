import variant from '@jitl/quickjs-singlefile-browser-release-sync';
import {newQuickJSWASMModuleFromVariant,type QuickJSWASMModule} from 'quickjs-emscripten-core';
import {createPreviewExecutor} from './quickjs';
let executor:ReturnType<typeof createPreviewExecutor>|undefined;
self.onmessage=async(event:MessageEvent)=>{try{if(event.data.type==='init'){executor?.dispose();const engine=await newQuickJSWASMModuleFromVariant(variant);executor=createPreviewExecutor(engine,event.data.code);self.postMessage({ready:true});return;}if(!executor)throw new Error('预览引擎未就绪');self.postMessage({state:executor.run(event.data.state,event.data.event),seq:event.data.seq});}catch(error){self.postMessage({error:String(error),seq:event.data.seq});}};
