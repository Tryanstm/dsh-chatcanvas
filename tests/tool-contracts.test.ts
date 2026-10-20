import {test} from 'node:test';import assert from 'node:assert/strict';import {apply} from '../src/host/index';
test('every exposed tool resolves its own recursive schema references without hidden external definitions',()=>{
 const tools:any[]=[];apply({inject(){},systemPrompt:{section(){}},tools:{register(t:any){tools.push(t);}}});
 for(const tool of tools){const root=tool.parameters;const walk=(value:any)=>{if(!value||typeof value!=='object')return;if(value.$ref){assert.ok(value.$ref.startsWith('#/'),tool.name+' external reference');let node=root;for(const key of value.$ref.slice(2).split('/'))node=node?.[key.replaceAll('~1','/').replaceAll('~0','~')];assert.notEqual(node,undefined,tool.name+' dangling '+value.$ref);}for(const child of Object.values(value))walk(child);};walk(root);}
});
