import {test} from 'node:test';
import assert from 'node:assert/strict';
import React,{act} from 'react';
import {renderToStaticMarkup} from 'react-dom/server';
import {JSDOM} from 'jsdom';
import {Editor} from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import {Rect} from 'fabric';
import {TextBox} from '../src/composer/extensions';
import {sceneStack} from '../src/canvas/stacking';
import {snapSceneTarget} from '../src/canvas/alignment';
import {CanvasStore} from '../src/persistence';
import {emptyCanvas,objectBase,newTableDocument} from '../src/protocol';
import {CANVAS_PARAMETERS} from '../src/host/tool-schema';
import {registerPublishedDocuments} from '../src/host/documents';
import {TableBlockView} from '../src/renderer/MediaBlocks';
import {installRightPan} from '../src/renderer/right-pan';

test('第2层在第1层上方，同层后加入的在上方，选择和保存不能偷偷提层',()=>{
 const doc=emptyCanvas();doc.mode='editable';
 doc.objects=[{...objectBase(),id:'top',z:2,type:'geometry',geometry:'rect',fill:'red',stroke:'red',strokeWidth:0},{...objectBase(),id:'bottom',z:1,type:'text',text:'文字也服从层级',fontSize:20,color:'blue',bold:false},{...objectBase(),id:'later',z:2,type:'geometry',geometry:'rect',fill:'green',stroke:'green',strokeWidth:0}];
 assert.deepEqual(sceneStack(doc.objects).map(o=>o.id),['bottom','top','later']);
 const store=new CanvasStore(doc);try{store.captureFocus('bottom');assert.deepEqual(store.snapshot().objects.map(o=>o.z),[2,1,2]);}finally{store.dispose();}
});

test('吸附先刷新Fabric过期边界，实际坐标与辅助线一致',()=>{
 const rect=new Rect({left:20,top:30,width:40,height:20,strokeWidth:0});rect.setCoords();rect.set({left:99,top:19});
 const result=snapSceneTarget(rect,[{x:100,y:20,width:40,height:20}],1);
 assert.equal(rect.left,100);assert.equal(rect.top,20);assert.equal(rect.getBoundingRect().left,100);assert.equal(rect.getBoundingRect().top,20);assert.equal(result.guides.length,2);
});

test('新建工具不再暴露增强表格，历史表格仍保留普通表格内容',()=>{
 const tools=new Map<string,any>();registerPublishedDocuments({inject(){},tools:{register:(t:any)=>tools.set(t.name,t)}});
 assert.equal(tools.has('table_publish'),false);
 assert.ok(!CANVAS_PARAMETERS.properties.canvas.properties.objects.items.anyOf.some((v:any)=>v.properties?.type?.const==='table'||v.properties?.type?.enum?.includes('table')));
 assert.equal(CANVAS_PARAMETERS.$defs.Table,undefined);
 const html=renderToStaticMarkup(<TableBlockView document={newTableDocument()}/>);
 assert.ok(html.includes('<table'));assert.ok(html.includes('列 1'));assert.ok(!html.includes('dser-component-frame'));assert.ok(!html.includes('<button'));
});

test('缩小组件位于富文本输入框中时可右键平移，真正文本区域仍交给输入框',()=>{
 const dom=new JSDOM('<main contenteditable="true"><section contenteditable="false"><span>预览</span></section><p>正文</p></main>');
 Object.assign(globalThis,{window:dom.window,document:dom.window.document});const root=document.querySelector('main')!,deltas:number[]=[];
 const stop=installRightPan(root,x=>deltas.push(x));const fire=(target:Element,type:string,x:number)=>target.dispatchEvent(new dom.window.MouseEvent(type,{bubbles:true,cancelable:true,button:2,clientX:x,clientY:10}));
 try{const inner=root.querySelector('span')!;fire(inner,'pointerdown',10);fire(inner,'pointermove',30);fire(inner,'pointerup',30);assert.deepEqual(deltas,[20]);const p=root.querySelector('p')!;fire(p,'pointerdown',10);fire(p,'pointermove',30);fire(p,'pointerup',30);assert.deepEqual(deltas,[20]);}finally{stop();dom.window.close();}
});

test('纯文本框实时剥离新插入的格式和嵌套框，复制按钮保留；写作操作在右侧同组',async()=>{
 const dom=new JSDOM('<div id="seat"/>',{url:'http://localhost',pretendToBeVisual:true}),w=dom.window;
 Object.assign(globalThis,{window:w,document:w.document,HTMLElement:w.HTMLElement,Element:w.Element,Node:w.Node,getComputedStyle:w.getComputedStyle,MutationObserver:w.MutationObserver,IS_REACT_ACT_ENVIRONMENT:true});Object.defineProperty(globalThis,'navigator',{value:w.navigator,configurable:true});
 let e:Editor|undefined;
 try{await act(async()=>{e=new Editor({element:document.getElementById('seat')!,extensions:[StarterKit,TextBox],content:{type:'doc',content:[{type:'textBox',attrs:{variant:'plain'},content:[{type:'paragraph',content:[{type:'text',text:'原文'}]}]},{type:'textBox',attrs:{variant:'writing'},content:[{type:'paragraph',content:[{type:'text',text:'写作'}]}]}]}});});
 await act(async()=>{e!.commands.insertContentAt(2,{type:'textBox',attrs:{variant:'writing'},content:[{type:'paragraph',content:[{type:'text',text:'新粘贴',marks:[{type:'bold'}]}]}]});});
 const plain=e!.getJSON().content![0]!;assert.equal(JSON.stringify(plain).includes('"marks"'),false);assert.equal(JSON.stringify(plain.content).includes('textBox'),false);assert.ok(JSON.stringify(plain).includes('新粘贴'));
 const boxes=document.querySelectorAll('.dser-editable-text');assert.ok(boxes[0]!.querySelector('[aria-label="复制文本"]'));assert.equal((boxes[0]!.querySelector('[aria-label="展开写作框"]') as HTMLButtonElement).hidden,true);
 const actions=boxes[1]!.querySelector('.dser-writing-actions')!;assert.ok(actions.querySelector('[aria-label="复制文本"]'));assert.ok(actions.querySelector('[aria-label="展开写作框"]'));assert.equal((boxes[1]!.querySelector('[aria-label="展开写作框"]') as HTMLButtonElement).hidden,false);
 }finally{await act(async()=>e?.destroy());await act(async()=>await Promise.resolve());w.close();}
});
