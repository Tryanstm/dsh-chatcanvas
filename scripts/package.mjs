import fs from 'node:fs';import path from 'node:path';
import {assertPublicTree} from './public-check.mjs';
assertPublicTree();const root=path.resolve('outputs/plugin'),workspace=fs.realpathSync('.');
if(fs.existsSync(root)){if(fs.lstatSync(root).isSymbolicLink()||!fs.realpathSync(root).startsWith(workspace+path.sep))throw Error('Unsafe package stage');fs.rmSync(root,{recursive:true,force:true});}fs.mkdirSync(root,{recursive:true});
const source=JSON.parse(fs.readFileSync('package.json','utf8'));const manifest={name:source.name,version:source.version,description:source.description,type:source.type,license:source.license,engines:source.engines,exports:source.exports,files:source.files,dsh:source.dsh};
fs.writeFileSync(path.join(root,'package.json'),JSON.stringify(manifest,null,2)+'\n');
for(const name of source.files.filter(n=>n!=='package.json')){if(!fs.existsSync(name))throw Error('Missing release asset: '+name);fs.cpSync(name,path.join(root,name),{recursive:true});}
assertPublicTree(root);console.log('ChatCanvas installation stage ready.');
