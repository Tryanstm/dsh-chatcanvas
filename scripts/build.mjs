import {buildTranscription} from './build-transcription.mjs';
import {soundfontDefine,stageSoundfont} from './soundfont-build.mjs';
import {buildClient} from './build-client.mjs';
import {build} from 'esbuild';
import fs from 'node:fs';import path from 'node:path';
import './build-program-machine.mjs';
import './build-ui-frame.mjs';
await buildTranscription();
fs.mkdirSync('dist/preview',{recursive:true});
fs.writeFileSync('src/host/prompts.generated.ts','// Generated from docs/prompts. Edit the Markdown sources.\n'+[['generatorText','RECOMMENDATION_GENERATOR_ZH'],['reviewerText','RECOMMENDATION_REVIEWER_ZH'],['visualWorkflowText','VISUAL_WORKFLOW_ZH']].map(([key,name])=>'export const '+key+'='+JSON.stringify(fs.readFileSync('docs/prompts/'+name+'.md','utf8'))+';').join('\n')+'\n');
const installed=path.resolve('vendor/official/packages');
const native={name:'native-official',setup(b){b.onResolve({filter:/^@deepseek-ai\/dsh-(client-ui-primitives|client-store|util-workspace-path|util-code-language)$/},args=>({path:path.join(installed,args.path,'lib/index.js')}));b.onResolve({filter:/^react(?:-dom)?(?:\/.*)?$/},args=>({path:import.meta.resolve(args.path).replace(/^file:\/\//,'').replace(/^\/([A-Z]:)/,'$1')}));b.onLoad({filter:/\.module\.css$/},args=>({contents:fs.readFileSync(args.path,'utf8'),loader:'local-css'}));}};
stageSoundfont();
const base={define:soundfontDefine,bundle:true,target:'es2022',logLevel:'info',sourcemap:true,legalComments:'eof',loader:{'.md':'text'}};
const capture=await build({entryPoints:['src/ui/capture.ts'],bundle:true,platform:'browser',format:'iife',minify:true,target:'es2022',write:false,logLevel:'warning'});
fs.writeFileSync('src/ui/capture.generated.ts','// Generated; edit capture.ts.\nexport default '+JSON.stringify(capture.outputFiles[0].text)+';\n');
const mathWorker=await build({entryPoints:['src/math/worker.ts'],bundle:true,platform:'browser',format:'iife',minify:true,target:'es2022',write:false,logLevel:'warning'});
fs.writeFileSync('src/math/worker.generated.ts','// Generated worker; edit worker.ts instead.\nexport default '+JSON.stringify(mathWorker.outputFiles[0].text)+';\n');
const uiWorker=await build({entryPoints:['src/ui/worker.ts'],bundle:true,platform:'browser',format:'iife',minify:true,target:'es2022',write:false,logLevel:'warning',define:{'import.meta.url':'""'}});
fs.writeFileSync('src/ui/worker.generated.ts','// Generated worker; edit worker.ts instead.\nexport default '+JSON.stringify(uiWorker.outputFiles[0].text)+';\n');
await build({...base,entryPoints:['src/host/index.ts'],outfile:'dist/index.js',platform:'node',format:'esm'});
await buildClient();
await build({...base,entryPoints:['src/core.ts'],outfile:'dist/core.js',platform:'browser',format:'esm',external:['react','react/jsx-runtime','react-dom','react-dom/client'],minify:true});fs.copyFileSync('src/styles.css','dist/styles.css');
await build({...base,entryPoints:['src/preview/main.tsx'],outfile:'dist/preview/app.js',platform:'browser',format:'esm',plugins:[native],loader:{'.css':'css','.woff2':'file','.woff':'file','.ttf':'file','.otf':'file'},minify:true});
fs.copyFileSync('src/preview/index.html','dist/preview/index.html');
for(const file of fs.readdirSync('dist/preview'))if(file.endsWith('.css'))console.log('Preview stylesheet:',file);


