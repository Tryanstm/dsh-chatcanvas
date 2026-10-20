import {test} from 'node:test';
import assert from 'node:assert/strict';
import {JSDOM} from 'jsdom';
import 'fake-indexeddb/auto';
import React,{act} from 'react';
import {createRoot} from 'react-dom/client';
import {Simulate} from 'react-dom/test-utils';
import {UISchema,UIViewSchema} from '../src/protocol';

const dom=new JSDOM('<!doctype html><body></body>',{url:'http://localhost'});
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
Object.assign(globalThis,{window:dom.window,document:dom.window.document,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,Node:dom.window.Node,MutationObserver:dom.window.MutationObserver,localStorage:dom.window.localStorage,getComputedStyle:dom.window.getComputedStyle,requestAnimationFrame:(f:FrameRequestCallback)=>setTimeout(()=>f(0),0),cancelAnimationFrame:clearTimeout,IS_REACT_ACT_ENVIRONMENT:true});
Object.assign(dom.window.HTMLDialogElement.prototype,{showModal(this:HTMLDialogElement){this.setAttribute('open','');},close(this:HTMLDialogElement){this.removeAttribute('open');}});
Object.assign(globalThis,{IntersectionObserver:class{constructor(private cb:any){}observe(){this.cb([{isIntersecting:true}]);}disconnect(){}},ResizeObserver:class{observe(){}disconnect(){}}});
let copied='';Object.defineProperty(navigator,'clipboard',{value:{writeText:async(value:string)=>{copied=value;}},configurable:true});
const text='第一行\n第二行';const code='const a = 1;\n\n  console.log(a);\n';
const content:any={type:'doc',content:[{type:'textBox',content:[{type:'text',text:'第一行'},{type:'hardBreak'},{type:'text',text:'第二行'}]},{type:'codeBlock',attrs:{language:'javascript'},content:[{type:'text',text:code}]}]};
async function mount(element:React.ReactElement){const seat=document.createElement('div');document.body.append(seat);const root=createRoot(seat);await act(async()=>{root.render(element);});return {seat,dispose:async()=>{await act(async()=>root.unmount());seat.remove();}};}
test('输入草稿的两个复制图标复制整框正文，更新后读取最新内容',async()=>{
 const {Composer}=await import('../src/composer/Composer');let editor:any;
 const view=await mount(React.createElement(Composer,{scope:'refinement-copy',initial:content,onSubmit(){},onEditor:value=>{editor=value;}}));
 try{for(const [label,expected]of [['复制文本',text],['复制代码',code]]){const button=view.seat.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);assert.ok(button,`${label}图标缺失`);assert.ok(button.querySelector('svg'));await act(async()=>button.click());assert.equal(copied,expected);}
 await act(async()=>editor.commands.setContent({type:'doc',content:[{type:'codeBlock',content:[{type:'text',text:'updated\n  whole code'}]}]}));
 await act(async()=>view.seat.querySelector<HTMLButtonElement>('button[aria-label="复制代码"]')!.click());assert.equal(copied,'updated\n  whole code');
 }finally{await view.dispose();}
});
test('已发送消息中的复制不带按钮文案、标签或结构 JSON',async()=>{
 const {SentDocument}=await import('../src/renderer/SentDocument');const view=await mount(React.createElement(SentDocument,{scope:'sent-copy',envelope:{schemaVersion:1,type:'dser-document',documentId:'copy-proof',plainText:'',content}}));
 try{for(const [label,expected]of [['复制文本',text],['复制代码',code]]){const button=view.seat.querySelector<HTMLButtonElement>(`button[aria-label="${label}"]`);assert.ok(button,`${label}入口缺失`);await act(async()=>button.click());assert.equal(copied,expected);}}finally{await view.dispose();}
});

test('写作框可以展开返回并复制，提交时记录的字号在首次显示就保留',async()=>{const {SentDocument}=await import('../src/renderer/SentDocument');const writing:any={type:'doc',content:[{type:'textBox',attrs:{variant:'writing'},content:[{type:'paragraph',content:[{type:'text',text:'完整写作内容'}]}]}]};const view=await mount(React.createElement(SentDocument,{scope:'writing-copy',envelope:{schemaVersion:1,type:'dser-document',documentId:'writing-proof',plainText:'完整写作内容',content:writing,layout:[{path:[0,0,0],fontSize:'23px',fontWeight:'400',fontStyle:'normal',color:'rgb(30, 40, 50)',fontFamily:'sans-serif'}]}}));try{assert.equal(view.seat.querySelector<HTMLElement>('.dser-textbox-content span')!.style.fontSize,'23px');await act(async()=>view.seat.querySelector<HTMLButtonElement>('button[aria-label="展开写作框"]')!.click());const dialog=document.querySelector('dialog[open]')!;assert.ok(dialog.textContent!.includes('完整写作内容'));await act(async()=>dialog.querySelector<HTMLButtonElement>('button[aria-label="复制文本"]')!.click());assert.equal(copied,'完整写作内容');await act(async()=>dialog.querySelector<HTMLButtonElement>('button[aria-label="返回消息"]')!.click());assert.equal(document.querySelector('dialog[open]'),null);assert.ok(view.seat.textContent!.includes('完整写作内容'));}finally{await view.dispose();}});
test('画布提问使用独立普通弹窗，收起不取消官方提问',async()=>{
 const {CanvasQuestion}=await import('../src/host/CanvasQuestion');const originalFetch=globalThis.fetch;globalThis.fetch=(()=>new Promise(()=>{})) as typeof fetch;let dismissed=0;const snapshot={channel:'local'};
 const reference={schemaVersion:1,renderId:'5fb6bcc4-7e09-47aa-bbc3-727364bd118a',canvasId:'modal',title:'布局确认',sha256:'a'.repeat(64)};
 const pending={key:'modal',sessionId:'test',questions:[{id:'modal',header:'布局确认',question:'请检查',detail:'<dser-canvas-question>'+JSON.stringify(reference)+'</dser-canvas-question>',options:[]}],subscribe:()=>()=>{},getSnapshot:()=>snapshot,takeTime(){},dismiss:async()=>{dismissed++;}};
 const view=await mount(React.createElement(CanvasQuestion,{pending}));try{const dialog=document.querySelector<HTMLDialogElement>('dialog.dser-canvas-question-dialog');assert.ok(dialog);assert.equal(dialog.classList.contains('dser-fullscreen-dialog'),false);const close=dialog.querySelector<HTMLButtonElement>('button[aria-label="收起画布提问"]');assert.ok(close);await act(async()=>close.click());assert.equal(dismissed,0);assert.equal(dialog.open,false);assert.match(view.seat.textContent||'',/继续回答/);}finally{await view.dispose();globalThis.fetch=originalFetch;}
});
test('UI 的列表和对象状态在初始协议与查看快照中一致保留',()=>{
 const state={items:[{id:'a',title:'第一条',selected:false}],profile:{name:'测试'},count:0};const document={initialPage:'home',state,pages:[{id:'home',name:'首页',root:{id:'root',type:'container'}}]};assert.deepEqual(UISchema.parse(document).state,state);assert.deepEqual(UIViewSchema.parse({page:'home',state}).state,state);
});
test('UI 多选属性一致作用于全部元素，并能撤销',async()=>{
 const {UIEditor}=await import('../src/ui/UIEditor');const {defaultUI}=await import('../src/protocol');let doc=defaultUI(),seat:ReturnType<typeof createRoot>;
 const el=document.createElement('div');document.body.append(el);seat=createRoot(el);const render=()=>seat.render(React.createElement(UIEditor,{document:doc,full:true,onChange:next=>{doc=next;render();}}));
 await act(async()=>render());try{const options=el.querySelectorAll<HTMLButtonElement>('[role=option]');await act(async()=>options[0]!.click());await act(async()=>options[3]!.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,ctrlKey:true})));assert.match(el.textContent||'',/已选 2 个/);const input=el.querySelector<HTMLInputElement>('input[aria-label="文字颜色"]')!;await act(async()=>Simulate.change(input,{target:{value:'#123456'}} as any));const children=doc.pages[0]!.root.children!;assert.equal(children[0]!.style!.color,'#123456');assert.equal(children[3]!.style!.color,'#123456');await act(async()=>el.querySelector<HTMLButtonElement>('button[aria-label="撤销 UI 修改"]')!.click());assert.notEqual(doc.pages[0]!.root.children![0]!.style!.color,'#123456');}finally{await act(async()=>seat.unmount());el.remove();}
});
test('主角代码页只显示自己的程序；取消不写入，应用后才提交',async()=>{
 const {GraphEditor}=await import('../src/ui/GraphEditor');const {defaultUI}=await import('../src/protocol');const doc=defaultUI(),target=doc.pages[0]!.root.children![3]!.id;let written:any;const view=await mount(React.createElement(GraphEditor,{document:doc,targets:[target],onChange(d){written=d;},onClose(){}}));try{const dialog=document.querySelector<HTMLElement>('[aria-label="交互逻辑"]')!;assert.ok(dialog);assert.equal(dialog.querySelector('[aria-label="触发元素"]'),null);const add=dialog.querySelector<HTMLSelectElement>('[aria-label="在第 1 列新建程序"]')!;await act(async()=>Simulate.change(add,{target:{value:'pointerup'}} as any));assert.ok(!written);const socket=dialog.querySelector<HTMLSelectElement>('[aria-label="触发对象参数"]')!;assert.equal(socket.value,target);assert.ok(Array.from(socket.options).some(o=>o.text.includes('打开第二页')));await act(async()=>Array.from(dialog.querySelectorAll('button')).find(b=>b.textContent==='应用并关闭')!.click());assert.equal(written.programs.at(-1).owner.id,target);assert.equal(written.programs.at(-1).trigger.target,target);}finally{await view.dispose();}
});

test('混合字号与颜色不伪装为单一格式',async()=>{
 const {Composer}=await import('../src/composer/Composer');const {FormatControls}=await import('../src/composer/FormatControls');let editor:any;const draft=await mount(React.createElement(Composer,{scope:'mixed-format',onSubmit(){},onEditor:value=>editor=value,initial:{type:'doc',content:[{type:'paragraph',content:[{type:'text',text:'甲',marks:[{type:'textStyle',attrs:{fontSize:'12px',color:'#ff0000'}}]},{type:'text',text:'乙',marks:[{type:'textStyle',attrs:{fontSize:'24px',color:'#0000ff'}}]}]}]}}));await act(async()=>editor.commands.selectAll());const controls=await mount(React.createElement(FormatControls,{editor}));try{const size=controls.seat.querySelector<HTMLInputElement>('[aria-label="字号"]')!;assert.equal(size.value,'');assert.equal(size.placeholder,'混合');assert.ok(controls.seat.querySelector('.dser-format-color.is-mixed'));}finally{await controls.dispose();await draft.dispose();}
});
test('自动适合内容按旋转后的边界居中；模拟器与图形动作共用执行逻辑',async()=>{
 const {fitCamera}=await import('../src/canvas/fit');const {objectBase,defaultUI}=await import('../src/protocol');const {simulateUI}=await import('../src/ui/simulate');const item:any={...objectBase(500,100,100,60),type:'text',text:'x',fontSize:16,color:'#000',bold:false};const camera=fitCamera([item],320,320);assert.ok(Math.abs((550*camera.zoom+camera.x)-160)<1e-8);assert.ok(Math.abs((130*camera.zoom+camera.y)-160)<1e-8);const d=defaultUI();d.pages[0]!.root.children![3]!.actions=[{type:'show',key:'shown'},{type:'set',key:'profile.name',value:'新值'},{type:'navigate',key:'detail'}];d.state.profile={name:'原值'};const result=await simulateUI(d,[{id:d.pages[0]!.root.children![3]!.id,type:'click'}]);assert.equal(result.page,'detail');assert.deepEqual(result.state.profile,{name:'新值'});assert.equal(result.state.shown,true);
});
test('短窗口等比调整预览相机，重复项模拟输入与真实绑定一致',async()=>{
 const {resizeCamera}=await import('../src/canvas/fit');const {defaultUI}=await import('../src/protocol');const {simulateUI}=await import('../src/ui/simulate');const resized=resizeCamera({x:160,y:160,zoom:1,rotation:0},320,320,172,172,true);assert.equal(resized.x,86);assert.equal(resized.y,86);assert.equal(resized.zoom,172/320);const d=defaultUI();d.state={items:[{id:'a',title:'甲'},{id:'b',title:'乙'}]};d.pages[0]!.root.children=[{id:'row',type:'input',bind:'item.title',repeat:{over:'items',as:'item',key:'item.id'}}];const value=await simulateUI(d,[{id:'row',type:'input',value:'乙已修改',context:{item:{id:'b',title:'乙'},index:1}}]);assert.deepEqual(value.state.items,[{id:'a',title:'甲'},{id:'b',title:'乙已修改'}]);
});
