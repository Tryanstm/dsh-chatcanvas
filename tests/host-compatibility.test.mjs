import {test} from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';import {pathToFileURL} from 'node:url';
import {nativeSDK} from './native-sdk.mjs';
const boot=path.join(nativeSDK,'@deepseek-ai/dsh-app-boot/lib/index.js');
test('official loader accepts the declared old and updated hosts, rejects untested host versions',{skip:!fs.existsSync(boot)},async()=>{
 const {evaluatePluginCompatibility}=await import(pathToFileURL(boot).href),source=JSON.parse(fs.readFileSync('package.json','utf8'));
 for(const version of ['0.2.0-rc.2','0.2.1-rc.2'])assert.equal(evaluatePluginCompatibility(source,{},version),undefined,version);
 assert.ok(evaluatePluginCompatibility(source,{},'0.3.0'));
 if(fs.existsSync('outputs/plugin/package.json')){const packaged=JSON.parse(fs.readFileSync('outputs/plugin/package.json','utf8'));if(packaged.version===source.version){assert.deepEqual(packaged.engines,source.engines);assert.equal(evaluatePluginCompatibility(packaged,{},'0.2.1-rc.2'),undefined);}}
});
