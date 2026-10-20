import {nativeFile,nativeDependency} from './native-sdk.mjs';
import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {JSDOM} from 'jsdom';
import {canvasDefinition} from '../dist/core.js';
const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'http://localhost'});
function loadNative(name,extra=''){
 let exported;
 const window=dom.window;window.__ModuleLoader__={load({factory}){exported=factory(n=>nativeDependency(n));}};const sandbox={window,document:window.document,navigator:window.navigator,console,URL,TextEncoder,TextDecoder,performance,crypto,setTimeout,clearTimeout};let source=fs.readFileSync(nativeFile(name),'utf8');source=source.replace('return module.exports;',extra+'\nreturn module.exports;');vm.runInNewContext(source,sandbox);return exported;
}
test('官方 Conversation assembler 与 Chat builder 恢复真实 Canvas 事件',()=>{
 const {ConversationNodeAssembler}=loadNative('dsh-client-ui-conversation'),chat=loadNative('dsh-client-ui-chat','exports.testView=chatViewDefinition;');
 const registry={entries:()=>[canvasDefinition],fallbackEntry:()=>undefined},views={entries:()=>[chat.testView]};
 const doc={schemaVersion:1,canvasId:'native-canvas-1',title:'Replay',mode:'readonly',revision:0,objects:[],assets:{},preview:{x:0,y:0,zoom:1,rotation:0},views:{},status:'ready'};
 const event=(seq,type,data)=>({event:{seq,type,time:seq,data}}),entries=[event(0,'turn/start',{turn:0}),event(1,'step/start',{turn:0,step:0}),event(2,'tool/call',{turn:0,step:0,callId:'native-call',name:'canvas_publish',arguments:JSON.stringify({canvas:doc})}),event(3,'tool/result',{turn:0,step:0,message:{callId:'native-call',role:'tool',content:[],isError:false},meta:{dserCanvas:doc}})];
 const assembler=new ConversationNodeAssembler(registry,views);assembler.activateTarget('chat');assembler.replaceWindow(entries,false);assembler.flush();const result=assembler.snapshot('chat');assert.equal(result.order.length,1);const node=result.nodes.get(result.order[0]);assert.equal(node.kind,'dser-canvas');assert.equal(node.location.kind,'session');assert.equal(node.data.status,'ready');assert.equal(node.data.document.canvasId,doc.canvasId);
 const live=new ConversationNodeAssembler(registry,views);live.activateTarget('chat');entries.forEach(e=>{live.append(e);live.flush();});const restored=live.snapshot('chat');assert.equal(restored.order.length,1);assert.equal(restored.nodes.get(restored.order[0]).data.document.title,'Replay');assert.equal(live.append(entries[3]),'none');
});

test('新增独立组件通过官方 assembler 恢复，不生成额外 Canvas 节点',async()=>{
 const {documentDefinition,formatDocumentReference}=await import('../dist/core.js');
 const {ConversationNodeAssembler}=loadNative('dsh-client-ui-conversation'),chat=loadNative('dsh-client-ui-chat','exports.testView=chatViewDefinition;');
 const assembler=new ConversationNodeAssembler({entries:()=>[canvasDefinition,documentDefinition],fallbackEntry:()=>undefined},{entries:()=>[chat.testView]});assembler.activateTarget('chat');
 const ref={schemaVersion:1,renderId:'d3eb9064-4d7b-4cf0-8504-df3a6bce3749',documentId:'doc-1',title:'独立函数',sha256:'a'.repeat(64)},event=(seq,type,data)=>({event:{seq,type,time:seq,data}});
 const entries=[event(0,'turn/start',{turn:0}),event(1,'step/start',{turn:0,step:0}),event(2,'tool/call',{turn:0,step:0,callId:'rich-call',name:'math_publish',arguments:'{}'}),event(3,'tool/result',{turn:0,step:0,message:{callId:'rich-call',role:'tool',content:[{type:'text',text:formatDocumentReference(ref)}],isError:false},meta:{dserDocumentRef:ref}})];
 assembler.replaceWindow(entries,false);assembler.flush();const result=assembler.snapshot('chat');assert.equal(result.order.length,1);const node=result.nodes.get(result.order[0]);assert.equal(node.kind,'dser-rich');assert.equal(node.data.status,'ready');assert.equal(node.data.reference.documentId,'doc-1');
});
