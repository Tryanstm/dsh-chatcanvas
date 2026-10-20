import fs from 'node:fs';
fs.mkdirSync('dist',{recursive:true});
fs.writeFileSync('dist/index.js',"export const name='enhanced-renderer-integration';\nexport function apply(){}\n");
const source=fs.readFileSync('client.js','utf8').replace('export const inject=','const inject=').replace('export function apply','function apply');
fs.writeFileSync('dist/client.js',"window.__ModuleLoader__.load({id:'@local/dsh-chatcanvas-integration',factory:()=>{\n"+source+"\nreturn {inject,apply};}});\n");
