import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
export async function buildUIFrame(){const result=await build({entryPoints:['src/ui/frame-entry.ts'],bundle:true,platform:'browser',format:'iife',minify:true,target:'es2022',write:false,logLevel:'warning'});writeFileSync('src/ui/frame.generated.ts','// Generated; edit runtime-live.ts, bindings.ts or state.ts.\nexport default '+JSON.stringify(result.outputFiles[0].text)+';\n');}
await buildUIFrame();
