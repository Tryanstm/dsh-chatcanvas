import {test} from 'node:test';import assert from 'node:assert/strict';
import {mkdtemp} from 'node:fs/promises';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {JSDOM} from 'jsdom';import {Editor,Node} from '@tiptap/core';import StarterKit from '@tiptap/starter-kit';
import {emptyCanvas,defaultUI,objectBase} from '../src/protocol';
import {registerCanvasQuestions,questionReference} from '../src/host/canvas-questions';
import {PublishedSnapshots} from '../src/host/snapshots';
import {titleText,registerRichTitles} from '../src/host/titles';
import {formatRichWire,readRichWire} from '../src/composer/wire';
import {visiblePrompt,cleanPending} from '../src/host/pending-presentation';
import {adoptNativeDraft} from '../src/composer/native-draft';
import {previewRuntime} from '../src/ui/runtime-v2';
const dom=new JSDOM('<!doctype html><body></body>',{url:'http://localhost'});Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,Node:dom.window.Node,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(fn:any)=>setTimeout(fn,0),cancelAnimationFrame:clearTimeout});
const envelope:any={schemaVersion:1,type:'dser-document',documentId:'user-doc',plainText:'制作一个方形手表界面',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'制作一个方形手表界面'}]}]}};
test('发送回显和排队预览在首次渲染就只有正文，原协议仍能恢复',()=>{const wire=formatRichWire(envelope);assert.ok(wire.startsWith(envelope.plainText));assert.equal(readRichWire(wire)!.documentId,envelope.documentId);assert.equal(visiblePrompt(wire),envelope.plainText);assert.equal(cleanPending({requestId:'request',text:wire}).text,envelope.plainText);assert.equal(cleanPending({id:'queue',content:[{type:'text',text:wire}]}).content[0].text,envelope.plainText);assert.equal(titleText(envelope),envelope.plainText);});
test('原生提问通道等待回答，未编辑也完整返回画布和选项',async()=>{
 const store=new PublishedSnapshots(await mkdtemp(join(tmpdir(),'dser-question-'))),tools=new Map<string,any>(),canvas=emptyCanvas('布局草案');canvas.objects.push({...objectBase(),type:'text',text:'AI 已预先放置的内容',fontSize:20,color:'#4d6bfe',bold:false});
 const ctx:any={connection:{fetch:{register(){}}},tools:{register:(d:any)=>tools.set(d.name,d)},userQuestions:{async ask(request:any){const q=request.questions[0],ref=questionReference(q.detail)!;assert.equal(q.question,'这样排布可以吗？');assert.equal(request.agent.session.id,'session-A');assert.equal(ref.canvasId,canvas.canvasId);const current=await store.get('session-A',ref);assert.equal(current.mode,'editable');return {answers:[{id:q.id,selected:['布局合适'],custom:JSON.stringify({type:'dser-canvas-answer',questionId:q.id,text:'继续制作',canvas:current})}]};}},inject(_services:any,fn:any){return fn(ctx);}};
 registerCanvasQuestions(ctx,store);const tool=tools.get('canvas_question'),result=await tool.execute({canvas,question:'这样排布可以吗？',options:[{label:'布局合适'}]},{agent:{session:{id:'session-A'}},signal:new AbortController().signal});assert.equal(result.canvas.canvasId,canvas.canvasId);assert.deepEqual(result.canvas.objects,canvas.objects);assert.deepEqual(result.selected,['布局合适']);assert.equal(result.text,'继续制作');assert.equal(tool.output.render({},result)[0].type,'text');
});
test('宿主插入文件引用不会清空已有组件或正文，清空文本仍合法',()=>{
 const block=Node.create({name:'canvasBlock',group:'block',atom:true,renderHTML:()=>['section']});const ed=new Editor({element:document.createElement('div'),extensions:[StarterKit,block],content:{type:'doc',content:[{type:'canvasBlock'},{type:'paragraph',content:[{type:'text',text:'正文'}]}]}});
 const old=ed.state.doc.textBetween(0,ed.state.doc.content.size,'\n','');adoptNativeDraft(ed,old+' @file:test.md');assert.equal(ed.getJSON().content![0]!.type,'canvasBlock');assert.match(ed.getText(),/正文 @file:test.md/);ed.destroy();
 const plain=new Editor({element:document.createElement('div'),extensions:[StarterKit],content:'<p>abc</p>'});adoptNativeDraft(plain,'');assert.equal(plain.getText(),'');plain.destroy();
});
test('UI 元素列表的选中与悬停高亮实时传入当前预览',()=>{
 const document=defaultUI(),node=document.pages[0]!.root.children![0]!,page=new JSDOM('<main id="root"></main><script id="payload" type="application/json"></script>',{url:'http://localhost',runScripts:'outside-only'}),w=page.window;
 Object.assign(w,{structuredClone,TextEncoder,requestAnimationFrame:()=>0,cancelAnimationFrame(){}});w.document.getElementById('payload')!.textContent=JSON.stringify({document,nonce:'feedback',edit:true});w.eval(previewRuntime);w.dispatchEvent(new w.MessageEvent('message',{source:w as unknown as Window, data:{protocol:'dser-ui-selection',nonce:'feedback',ids:[node.id],highlightId:node.id}}));assert.equal(w.document.querySelector<HTMLElement>(`[data-source-id="${node.id}"]`)!.style.outline,'3px solid #00b8d9');page.window.close();
});
test('富文本标题只提交任务含义并保留手动改名',async()=>{
 let listener:any,request:any,current:any;const appended:any[]=[],ctx:any={inject(_k:any,fn:any){fn(ctx);},effect(){},on(_k:any,fn:any){listener=fn;},sessionTitle:{get:()=>current},llm:{async *stream(options:any){request=options;yield {type:'text-delta',text:'方形手表界面设计'};yield {type:'finish',reason:{kind:'stop'}};}}};const session={append(type:string,data:any){appended.push({type,data});current=data;}};
 registerRichTitles(ctx);listener(session,{type:'user/message',seq:4,data:{content:[{type:'text',text:formatRichWire(envelope)}]}});listener(session,{type:'request/header',data:{header:{config:{provider:'test',model:'test'}}}});await new Promise(r=>setTimeout(r,10));assert.equal(request.messages[0].content[0].text,envelope.plainText);assert.doesNotMatch(request.messages[0].content[0].text,/schemaVersion|content|paragraph/);assert.equal(appended[0].data.source.kind,'provider');current={title:'我的手动标题',source:{kind:'user'}};listener(session,{type:'session/title',data:current});assert.equal(appended.length,1);
});
