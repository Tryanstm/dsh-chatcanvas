import fs from 'node:fs';import path from 'node:path';
import {assertPublicTree} from './public-check.mjs';
import {installManifest,includeInstallFile,assertPrebuiltPackage} from './package-stage.mjs';
assertPublicTree();const root=path.resolve('outputs/plugin'),workspace=fs.realpathSync('.');
if(fs.existsSync(root)){if(fs.lstatSync(root).isSymbolicLink()||!fs.realpathSync(root).startsWith(workspace+path.sep))throw Error('Unsafe package stage');fs.rmSync(root,{recursive:true,force:true});}fs.mkdirSync(root,{recursive:true});
const source=JSON.parse(fs.readFileSync('package.json','utf8'));const manifest=installManifest(source);
fs.writeFileSync(path.join(root,'package.json'),JSON.stringify(manifest,null,2)+'\n');
for(const name of source.files.filter(n=>n!=='package.json')){if(!fs.existsSync(name))throw Error('Missing release asset: '+name);fs.cpSync(name,path.join(root,name),{recursive:true,filter:includeInstallFile});}
assertPublicTree(root);assertPrebuiltPackage(root);console.log('ChatCanvas prebuilt installation stage ready.');
