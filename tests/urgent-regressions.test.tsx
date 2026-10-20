import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';import {createRequire} from 'node:module';
import React,{act} from 'react';import {createRoot} from 'react-dom/client';import {renderToStaticMarkup} from 'react-dom/server';import {JSDOM} from 'jsdom';
import {nativeDependency} from './native-sdk.mjs';
const signal=()=>new AbortController().signal;
const {SlotCore}=nativeDependency('@deepseek-ai/dsh-client-ui-slots');
function client(withFactory=false){
 const dom=new JSDOM('<!doctype html><html><head></head><body></body></html>',{url:'http://localhost'}),core=new SlotCore(),cleanup:any[]=[],services=new Map();
 core.register({name:'root',children:{'conversation.chat.node':{kind:'keyed',scope:'session'},'tool.call.toolview':{kind:'keyed',scope:'session'},'conversation.composer':{kind:'chain',scope:'session'},'conversation.input.model':{kind:'single',scope:'session'},'conversation.composer.bar':{kind:'single',scope:'session-maybe'},'conversation.input.dock':{kind:'list',scope:'session'},'conversation.chat.flow':{kind:'single',scope:'session'},'conversation.view':{kind:'list',scope:'session'},'settings.section':{kind:'list',scope:'none'}}},()=>null);
 const Native=(p:any)=>React.createElement('div',{'data-native':'official'},p.node?.data?.blocks?.[0]?.text||'official');
 core.register({name:'conversation.composer.bar'},Native);core.register({name:'conversation.view',id:'chat'},Native);for(const key of ['assistant-step','user','steering'])core.register({name:'conversation.chat.node',key},Native);
 const ctx:any={inject(){},emit(){},effect(fn:any){const dispose=fn();if(typeof dispose==='function')cleanup.push(dispose);return dispose;},slots:{factory:(n:string)=>core.factory(n),subscribeFactory:(n:string,f:any)=>core.subscribeFactory(n,f),entries:(k:string)=>core.entries(k),entriesOfSlot:(k:string)=>core.entriesOfSlot(k),subscribe:(k:string,f:any)=>core.subscribe(k,f),inject:(_key:string,fn:any)=>fn(),register(options:any,component:any){const dispose=core.register(options,component);cleanup.push(dispose);return dispose;}},uiConversation:{events:{register(){}}},reflect:{provide(k:string,v:any){services.set(k,v);}},sessions:{scope(){throw Error('not used');}},get:()=>undefined};
 let exported:any;dom.window.__ModuleLoader__={load({factory}:any){exported=factory((n:string)=>n==='@deepseek-ai/dsh-client-ui-primitives'?{writeClipboard:async()=>true}:createRequire(import.meta.url)(n));}};
 const sandbox:any={console,document:dom.window.document,window:dom.window,navigator:dom.window.navigator,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,MutationObserver:dom.window.MutationObserver,Blob,URL,crypto,structuredClone,TextEncoder,TextDecoder,setTimeout,clearTimeout,queueMicrotask,AbortController,localStorage:dom.window.localStorage,requestAnimationFrame:(fn:any)=>setTimeout(()=>fn(Date.now()),1),cancelAnimationFrame:clearTimeout};
 vm.runInNewContext(fs.readFileSync('dist/client.js','utf8'),sandbox);
 const loadPlugin=(source:string,fetch:any)=>{sandbox.fetch=fetch;vm.runInNewContext(source,sandbox);return exported;};
 if(withFactory)core.registerFactory({name:'conversation.chat.user.content',scope:'session'},(p:any)=>React.createElement('article',{'data-shared-bubble':true},p.renderFactorySlot('conversation.user.text',{text:p.content.text,facts:p.facts,interactive:true})));
 exported.apply(ctx);return {core,ctx,cleanup,services,dom,loadPlugin,setFetch:(f:any)=>{sandbox.fetch=f;}};
}
test('晚注册的思考翻译仍是有效消息入口，思考分组与回复分组都保留第三方入口',()=>{
 const f=client();try{f.core.register({name:'conversation.chat.node',key:'assistant-step',priority:-1},(p:any)=>React.createElement('div',{'data-translator':'active'},p.groupPart));
 const entry=f.core.entriesOfSlot('conversation.chat.node').find((e:any)=>e.options.key==='assistant-step');
 for(const groupPart of ['reasoning','response']){const html=renderToStaticMarkup(React.createElement(entry.component,{groupPart,node:{data:{status:'ready',blocks:[{kind:'reasoning',text:'thinking'}]}}}));assert.match(html,/data-translator="active"/);}
 }finally{f.cleanup.reverse().forEach(d=>d());f.dom.window.close();}
});

import {formatRichWire} from '../src/composer/wire';
test('发送回显与正式消息共用富文本展示，文件名经同一原生工厂而不是裸路径显示',()=>{
 const f=client(true);try{const envelope:any={schemaVersion:1,type:'dser-document',documentId:'files-fixture',plainText:'请看 @[file](C:/example/a.txt)',content:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'请看 @[file](C:/example/a.txt)'}]}]}},wire=formatRichWire(envelope),facts={fileNames:{a:'a.txt'}},factory=f.core.factory('conversation.chat.user.content')!;
 const renderFactorySlot=(name:string,p:any)=>{assert.equal(name,'conversation.user.text');assert.equal(p.facts,facts);assert.equal(p.interactive,true);assert.equal(p.text,envelope.plainText);return React.createElement('a',{'data-file-chip':true},'a.txt');};
 const props={sessionId:'files-session',content:{text:wire,attachments:[],extraBlocks:[]},facts,renderFactorySlot};
 const echo=renderToStaticMarkup(React.createElement(factory.component,{...props,pending:true})),durable=renderToStaticMarkup(React.createElement(factory.component,{...props,pending:false}));assert.equal(echo,durable);assert.match(echo,/dser-sent-document/);assert.match(echo,/data-file-chip/);assert.doesNotMatch(echo,/C:\/|C:\/example|schemaVersion/);
 }finally{f.cleanup.reverse().forEach(d=>d());f.dom.window.close();}
});

test('独立设置页注册，推荐数量可达且没有执行审核设置',()=>{const f=client();try{const settings=f.core.entries('settings.section').find((e:any)=>e.options.id==='chatcanvas');assert.ok(settings);const html=renderToStaticMarkup(React.createElement(settings.component));for(const label of ['程序推荐选项','AI 推荐选项','保存设置'])assert.ok(html.includes(label));assert.ok(f.services.get('enhancedRenderer').registerReasoningDecorator);for(const label of ['工具白名单','Skill 白名单','免审白名单'])assert.ok(!html.includes(label));}finally{f.cleanup.reverse().forEach(d=>d());f.dom.window.close();}});

test('普通设置不暴露内部审核额度、推荐插槽及未接入的侧栏功能',()=>{const f=client();try{const settings=f.core.entries('settings.section').find((e:any)=>e.options.id==='chatcanvas');const html=renderToStaticMarkup(React.createElement(settings.component));for(const label of ['审核输出额度','推荐等待时间','推荐最多修正次数','第 1 项','第 5 项','侧栏提问入口','UI 最大高度','富文本输入框','富文本与组件消息展示','流式文字淡入','组件删除按钮','显示格式工具栏','启用“帮我审核”','官方文件读取与搜索工具免审','本插件工具免审'])assert.ok(!html.includes(label),label);}finally{f.cleanup.reverse().forEach(d=>d());f.dom.window.close();}});

// Opt-in to the actual installed translator; all requests stay inside a local fixture.
import {defaultPluginPreferences} from '../src/plugin-config';
test('设置页点击数字选择数量，保存后重新读取仍一致',async()=>{
 const f=client(),old={window:globalThis.window,document:globalThis.document,navigator:globalThis.navigator},previousAct=(globalThis as any).IS_REACT_ACT_ENVIRONMENT;let saved=defaultPluginPreferences(),writes=0;
 Object.defineProperty(globalThis,'navigator',{value:f.dom.window.navigator,configurable:true});Object.assign(globalThis,{window:f.dom.window,document:f.dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 f.setFetch(async(_url:string,options:any)=>{if(options?.method==='POST'){saved=JSON.parse(options.body).preferences;writes++;}return {ok:true,json:async()=>({preferences:saved,revision:writes,tools:[],skills:[{name:'fixture-skill',description:'测试用 Skill 预览说明'}]})};});
 const root=createRoot(document.body.appendChild(document.createElement('main')));
 const button=(label:string)=>document.querySelector<HTMLButtonElement>('button[aria-label="'+label+'"]')!;
 try{const settings=f.core.entries('settings.section').find((e:any)=>e.options.id==='chatcanvas');await act(async()=>{root.render(React.createElement(settings.component));});assert.match(button('程序推荐选项数量').textContent!,/2/);assert.match(button('AI 推荐选项数量').textContent!,/1/);assert.equal(document.querySelector('input[type=checkbox]'),null);
  await act(async()=>button('程序推荐选项数量').click());assert.ok(document.querySelector('[role=dialog]'));await act(async()=>{[...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find(b=>b.textContent==='4 项')!.click();});assert.equal(document.querySelector('[role=dialog]'),null);assert.match(button('程序推荐选项数量').textContent!,/4/);
  await act(async()=>button('AI 推荐选项数量').click());await act(async()=>{[...document.querySelectorAll<HTMLButtonElement>('[role=dialog] button')].find(b=>b.textContent==='0 项')!.click();});
  await act(async()=>{[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='保存设置')!.click();});assert.equal(writes,1);assert.equal(saved.renderer.programSlots.filter(Boolean).length,4);assert.equal(saved.renderer.aiSlots.filter(Boolean).length,0);assert.equal(Object.hasOwn(saved,'review'),false);
  await act(async()=>{[...document.querySelectorAll<HTMLButtonElement>('button')].find(b=>b.textContent==='重新读取')!.click();});assert.match(button('程序推荐选项数量').textContent!,/4/);
 }finally{await act(async()=>root.unmount());f.cleanup.reverse().forEach(d=>d());f.dom.window.close();Object.assign(globalThis,{window:old.window,document:old.document,IS_REACT_ACT_ENVIRONMENT:previousAct});Object.defineProperty(globalThis,'navigator',{value:old.navigator,configurable:true});}
});

test('本机思考翻译插件：译文展开/收起保留翻译入口和增强外层，未请求真实模型', {skip:!process.env.DSER_TRANSLATOR_CLIENT},async()=>{
 const f=client(),old={window:globalThis.window,document:globalThis.document,navigator:globalThis.navigator},previousAct=(globalThis as any).IS_REACT_ACT_ENVIRONMENT;
 Object.defineProperty(globalThis,'navigator',{value:f.dom.window.navigator,configurable:true});Object.assign(globalThis,{window:f.dom.window,document:f.dom.window.document,IS_REACT_ACT_ENVIRONMENT:true});
 const root=createRoot(document.body.appendChild(document.createElement('main')));let requests=0;
 try{
  f.loadPlugin(fs.readFileSync(process.env.DSER_TRANSLATOR_CLIENT!,'utf8'),async(url:string)=>{assert.equal(url,'/xlate/api/translate');requests++;return {ok:true,json:async()=>({ok:true,text:'翻译后的思考',translation:'翻译后的思考'})};}).apply(f.ctx);
  await new Promise<void>(resolve=>queueMicrotask(resolve));
  const entry=f.core.entriesOfSlot('conversation.chat.node').find((e:any)=>e.options.key==='assistant-step');
  await act(async()=>{root.render(React.createElement(entry.component,{groupPart:'reasoning',node:{data:{status:'ready',blocks:[{kind:'reasoning',text:'Thinking about this.'}]}}}));await new Promise(r=>setTimeout(r,5));});
  assert.ok(document.querySelector('.dser-native-stream .xlx-row'),document.body.innerHTML);assert.ok(requests>0);
  for(let i=0;i<2;i++){await act(async()=>{document.querySelector<HTMLButtonElement>('.xlx-row')!.click();});assert.ok(document.querySelector('.dser-native-stream .xlx-row'));assert.equal(!!document.querySelector('.xlx-body'),i===0);if(i===0)assert.match(document.querySelector('.xlx-body')!.textContent!,/翻译后的思考/);assert.equal(document.querySelector('[data-native="official"]'),null);}
 }finally{await act(async()=>root.unmount());f.cleanup.reverse().forEach(d=>d());f.dom.window.close();Object.assign(globalThis,{window:old.window,document:old.document,IS_REACT_ACT_ENVIRONMENT:previousAct});Object.defineProperty(globalThis,'navigator',{value:old.navigator,configurable:true});}
});