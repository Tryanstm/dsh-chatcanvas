import {assertPublicTree} from './public-check.mjs';
assertPublicTree();
import fs from 'node:fs';import path from 'node:path';
if(fs.existsSync('dist/preview/native-feedback.html'))throw new Error('Stop the isolated test host and remove its temporary launch page before packaging');
const root=process.cwd(),stage=path.resolve('outputs/source/dsh-chatcanvas');
if(!stage.startsWith(root+path.sep))throw new Error('Source stage outside project');
if(fs.existsSync(stage)){const real=fs.realpathSync(stage),workspace=fs.realpathSync(process.cwd());if(!real.toLowerCase().startsWith((workspace+path.sep).toLowerCase())||fs.lstatSync(stage).isSymbolicLink())throw Error('Refusing output cleanup outside workspace');fs.rmSync(stage,{recursive:true,force:true});}
fs.mkdirSync(stage,{recursive:true});
const allowed=['src','dist','skills','scripts','tests','examples','docs','vendor','licenses','README.md','README.zh-CN.md','.github','LICENSE','THIRD_PARTY_NOTICES.md','package.json','pnpm-lock.yaml','pnpm-workspace.yaml','tsconfig.json','cordis.patch.yml','.gitignore','.gitattributes'];
for(const file of allowed)if(fs.existsSync(file))fs.cpSync(file,path.join(stage,file),{recursive:true});
if(fs.existsSync('audit/native-manifest.json')){fs.mkdirSync(path.join(stage,'audit'),{recursive:true});fs.copyFileSync('audit/native-manifest.json',path.join(stage,'audit/native-manifest.json'));}
console.log(stage);

