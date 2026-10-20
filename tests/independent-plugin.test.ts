import {test} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,writeFileSync,readFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {apply} from '../src/host/index';
import {PreferenceStore,registerPreferenceRoute} from '../src/host/plugin-preferences';
import {defaultPluginPreferences} from '../src/plugin-config';

test('ChatCanvas独立注册展示工具，不接管工具执行或权限预设',()=>{
 const tools=new Map<string,any>(),services=new Map<string,any>();
 const ctx:any={inject(){},provide:(name:string,value:any)=>services.set(name,value),systemPrompt:{section(){}},tools:{register:(definition:any)=>tools.set(definition.name,definition)},on(name:string){if(name.startsWith('tools/'))throw Error('Presentation plugin must not install execution hooks');return()=>{};},permissionPresets:{registerAuto(){throw Error('Presentation plugin must not register a permission mode');}}};
 apply(ctx);assert.ok(tools.has('canvas_publish'));assert.ok(tools.has('ui_publish'));assert.ok(tools.has('music_publish'));
 const catalog=services.get('chatCanvasTools');assert.equal(catalog.owns(tools.get('ui_publish')),true);assert.equal(catalog.owns({...tools.get('ui_publish'),execute(){}}),false);
 assert.equal(Object.hasOwn(defaultPluginPreferences(),'review'),false);
});

test('从旧组合设置迁移时只提取显示选项，保留原文件且不暴露其他设置',()=>{const root=mkdtempSync(path.join(tmpdir(),'chatcanvas-migrate-'));try{const legacy=path.join(root,'dser-preferences.json'),source={...defaultPluginPreferences(),review:{tools:['private-fixture'],skills:['private-fixture']}};source.renderer.programSlots=[true,true,true,true,false];writeFileSync(legacy,JSON.stringify(source));const before=readFileSync(legacy,'utf8'),store=new PreferenceStore(path.join(root,'chatcanvas-preferences.json'));assert.equal(store.get().preferences.renderer.programSlots.filter(Boolean).length,4);assert.equal(JSON.stringify(store.get()).includes('private-fixture'),false);store.save(store.get().preferences,0);assert.equal(readFileSync(legacy,'utf8'),before);}finally{rmSync(root,{recursive:true,force:true});}});

test('公开设置只返回显示配置，拒绝混入执行策略，保存不读取工具或Skill目录',async()=>{
 const root=mkdtempSync(path.join(tmpdir(),'chatcanvas-settings-'));try{const store=new PreferenceStore(path.join(root,'preferences.json'));let route:any;
 registerPreferenceRoute({inject:(_keys:any,fn:any)=>fn({connection:{fetch:{register:(value:any)=>route=value}}}),tools:{schemas(){throw Error('Tool catalog must not be queried');}},skills:{list(){throw Error('Skill catalog must not be queried');}}},store);
 const initial=await(await route.fetch(new Request('http://localhost/api/chatcanvas.settings'))).json();assert.equal(Object.hasOwn(initial,'tools'),false);assert.equal(Object.hasOwn(initial,'skills'),false);assert.equal(Object.hasOwn(initial.preferences,'review'),false);
 const bad=await route.fetch(new Request('http://localhost/api/chatcanvas.settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:0,preferences:{...initial.preferences,review:{enabled:true}}})}));assert.equal(bad.status,400);
 initial.preferences.renderer.programSlots=[true,true,true,true,false];const saved=await route.fetch(new Request('http://localhost/api/chatcanvas.settings',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({revision:0,preferences:initial.preferences})}));assert.equal(saved.status,200);assert.equal(new PreferenceStore(path.join(root,'preferences.json')).get().preferences.renderer.programSlots.filter(Boolean).length,4);
 const denied=await route.fetch(new Request('http://localhost/api/chatcanvas.settings',{method:'POST',headers:{origin:'https://outside.example','content-type':'application/json'},body:'{}'}));assert.equal(denied.status,403);
 }finally{rmSync(root,{recursive:true,force:true});}
});
