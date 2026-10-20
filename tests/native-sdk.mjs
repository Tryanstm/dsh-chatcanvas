import path from 'node:path';import fs from 'node:fs';import {fileURLToPath} from 'node:url';import {createRequire} from 'node:module';
/** Optional official integration SDK. Unit tests use bundled public client modules. */
export const nativeSDK=path.resolve(process.env.DSH_ACCEPTANCE_SDK||fileURLToPath(new URL('../audit/installed/dsh/node_modules',import.meta.url)));
export const nativeFile=name=>path.join(nativeSDK,'@deepseek-ai',name,'lib',name==='dsh-llm'?'index.js':'client.js');
const require=createRequire(import.meta.url);
/** Assembler tests load host modules, without mounting the virtualized Chat viewport. */
export function nativeDependency(name){
 if(name==='@tanstack/react-virtual')return {useVirtualizer(){throw Error('Viewport rendering is outside the assembler test');}};
 if(['@deepseek-ai/cordis','@deepseek-ai/dsh-client-store','@deepseek-ai/dsh-client-ui-slots'].includes(name)){
  const candidate=path.join(nativeSDK,name,'lib/index.js');if(fs.existsSync(candidate))return require(candidate);
  const saved=path.resolve('vendor/official/packages',name),version=JSON.parse(fs.readFileSync(path.join(nativeSDK,'@deepseek-ai/dsh-client-ui-conversation/package.json'),'utf8')).version;
  if(JSON.parse(fs.readFileSync(path.join(saved,'package.json'),'utf8')).version!==version)throw Error(`Obtain the official ${name}@${version} shared module for this SDK`);
  return require(path.join(saved,'lib/index.js'));
 }
 if(name==='@deepseek-ai/dsh-client-ui-primitives')return new Proxy({},{get:()=>()=>null});
 return require(name);
}
