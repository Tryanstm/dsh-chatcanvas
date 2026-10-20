import fs from 'node:fs';import path from 'node:path';import {spawnSync} from 'node:child_process';
fs.mkdirSync('audit/test-tmp',{recursive:true});const env={...process.env,TEMP:path.resolve('audit/test-tmp'),TMP:path.resolve('audit/test-tmp')};
const integration=process.argv.includes('--integration');const files=fs.readdirSync('tests').filter(n=>/\.test\.(?:ts|tsx|mjs)$/.test(n)).sort();
const selected=integration?files:files.filter(n=>!/(?:native|assembler|host|lifecycle|model-schema|published|urgent|attachments-layout|creation-help|feedback)/.test(n)&&!/native-sdk|DSH_ACCEPTANCE_SDK|audit\/(?:installed|host-)/.test(fs.readFileSync('tests/'+n,'utf8')));
if(integration&&!env.DSH_ACCEPTANCE_SDK)throw Error('Set DSH_ACCEPTANCE_SDK to an installed supported Harness node_modules directory. See docs/DEVELOPMENT.md.');
const result=spawnSync(process.execPath,['--max-old-space-size=768','--max-semi-space-size=4','--import','tsx','--test','--test-concurrency=1',...selected.map(n=>'tests/'+n)],{env,stdio:'inherit',windowsHide:true});if(result.error)throw result.error;process.exitCode=result.status??1;
