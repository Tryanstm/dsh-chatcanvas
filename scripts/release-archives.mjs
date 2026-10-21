import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
// Offline npm-compatible archive: one package/ root, with the already staged manifest.
const workspace=fs.realpathSync('.'),outputs=fs.realpathSync('outputs'),stage=path.resolve('outputs/npm-stage');
if(!outputs.toLowerCase().startsWith((workspace+path.sep).toLowerCase()))throw Error('Output directory must stay inside the workspace');
if(fs.existsSync(stage)){if(fs.lstatSync(stage).isSymbolicLink()||!fs.realpathSync(stage).toLowerCase().startsWith((workspace+path.sep).toLowerCase()))throw Error('Unsafe archive stage');fs.rmSync(stage,{recursive:true,force:true});}
fs.mkdirSync(stage,{recursive:true});fs.cpSync('outputs/plugin',path.join(stage,'package'),{recursive:true});
const version=JSON.parse(fs.readFileSync('package.json','utf8')).version;if(!/^\d+\.\d+\.\d+(?:-[\w.]+)?$/.test(version))throw Error('Invalid version');
function tar(args){const r=spawnSync('tar',args,{encoding:'utf8',windowsHide:true});if(r.error||r.status!==0)throw Error(String(r.error||r.stderr));}
tar(['-czf',`outputs/local-dsh-chatcanvas-${version}.tgz`,'-C',stage,'package']);
const sourceZip=path.resolve(`outputs/dsh-chatcanvas-source-${version}.zip`);
if(process.platform==='win32')tar(['-a','-cf',sourceZip,'-C','outputs/source','dsh-chatcanvas']);
else{const result=spawnSync('python3',['-m','zipfile','-c',sourceZip,'dsh-chatcanvas'],{cwd:'outputs/source',encoding:'utf8'});if(result.error||result.status!==0)throw result.error||Error(result.stderr);}
if(fs.readFileSync(sourceZip).readUInt32LE(0)!==0x04034b50)throw Error('Source archive is not a ZIP file');
console.log(`Offline installation and source archives created for ${version}`);
