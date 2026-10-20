import type {RendererHostAdapter,RendererSnapshot} from '../src/renderer/RendererView';
import type {ComposerSnapshot} from '../src/composer/extensions';
import type {CanvasDocument} from '../src/protocol';

export interface OwnedChatBridge {
 snapshot():RendererSnapshot;
 subscribe(listener:()=>void):()=>void;
 renderNative:RendererHostAdapter['renderNative'];
 send(document:ComposerSnapshot):Promise<void>;
 sendCanvas(document:CanvasDocument,questionId?:string):Promise<void>;
 stop?():void;
 retry?():void;
}

/** Pass one already-selected branch bridge; this factory never chooses or changes branches. */
export function createChatFlowAdapter(identity:{viewId:string;sessionId:string;branchId:string;region:RendererHostAdapter['region']},bridge:OwnedChatBridge):RendererHostAdapter {
 return {...identity,getSnapshot:()=>bridge.snapshot(),subscribe:listener=>bridge.subscribe(listener),renderNative:bridge.renderNative,submit:document=>bridge.send(document),submitCanvas:(document,id)=>bridge.sendCanvas(document,id),stop:bridge.stop,retry:bridge.retry,active:true};
}
