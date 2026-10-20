import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
// Offline npm-compatible archive: one package/ root, with the already staged manifest.
const workspace=fs.realpathSync('.'),outputs=fs.realpathSync('outputs'),stage=path.resolve('outputs/npm-stage');
if(!outputs.toLowerCase().startsWith((workspace+path.sep).toLowerCase()))throw Error('Output directory must stay inside the workspace');
if(fs.existsSync(stage)){if(fs.lstatSync(stage).isSymbolicLink()||!fs.realpathSync(stage).toLowerCase().startsWith((workspace+path.sep).toLowerCase()))throw Error('Unsafe archive stage');fs.rmSync(stage,{recursive:true,force:true});}
fs.mkdirSync(stage,{recursive:true});fs.cpSync('outputs/plugin',path.join(stage,'package'),{recursive:true});
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;if(!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version))throw Error('Invalid version');
function tar(args){const r=spawnSync('tar',args,{encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error(String(r.error||r.stderr));}
tar(['-czf',`outputs/local-dsh-chatcanvas-${version}.tgz`,'-C',stage,'package']);
tar(['-a','-cf',`outputs/dsh-chatcanvas-source-${version}.zip`,'-C','outputs/source','dsh-chatcanvas']);
console.log(`Offline installation and source archives created for ${version}`);
