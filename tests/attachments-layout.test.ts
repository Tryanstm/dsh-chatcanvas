import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {nativeFile} from './native-sdk.mjs';

test('横竖附件的外层占位与缩略图尺寸一致，桌面和窄屏都不能溢出覆盖相邻图片',()=>{
 const source=readFileSync(nativeFile('dsh-client-ui-attachment'),'utf8');
 const imageClass=source.match(/"imageItem": "([^"]+)"/)![1]!,thumbClass=source.match(/"thumbnail": "([^"]+)"/g)!.map(v=>v.match(/: "([^"]+)"/)![1]!).find(v=>v.slice(0,v.lastIndexOf('_'))===imageClass.slice(0,imageClass.lastIndexOf('_')))!,railClass=source.match(/"rail": "([^"]+)"/)![1]!;
 const nativeStyles=[...source.matchAll(/const css(?:\$\d+)? = ("(?:[^"\\]|\\.)*");/g)].map(m=>JSON.parse(m[1]!)).join('\n');
 const lines=readFileSync('src/styles.css','utf8').split('\n'),desktop=lines.find(s=>s.startsWith('.dser-native-attachments{'))!,mobile=lines.find(s=>s.startsWith('@media(max-width:600px)'))!.match(/\.dser-native-attachments[^{}]*\{[^{}]*\}/g)!.join('\n');
 for(const [profile,override,size]of [['desktop',desktop,'192px'],['narrow',desktop+'\n'+mobile,'150px']]){
  const dom=new JSDOM(`<style>${nativeStyles}\n${override}</style><div class="dser-native-attachments"><div class="${railClass}">${['landscape','portrait','landscape'].map((alt,i)=>`<div class="sdk_item"><div class="${imageClass}"><button class="${thumbClass}"><img alt="${alt}" width="${i===1?300:900}" height="${i===1?900:300}"></button></div></div>`).join('')}</div></div>`);
  try{for(const item of dom.window.document.querySelectorAll('.'+imageClass)){const outer=dom.window.getComputedStyle(item),thumb=dom.window.getComputedStyle(item.querySelector('button')!);assert.equal(outer.width,size,profile+' must reserve the enlarged image width');assert.equal(outer.height,size);assert.equal(outer.width,thumb.width);assert.equal(outer.height,thumb.height);assert.equal(thumb.padding,'0px');assert.equal(thumb.overflow,'hidden');}}
  finally{dom.window.close();}
 }
});
