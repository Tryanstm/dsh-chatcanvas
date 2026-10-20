import {build} from 'esbuild';
import {writeFileSync} from 'node:fs';
const result=await build({entryPoints:['src/ui/program-machine.ts'],bundle:true,platform:'neutral',format:'iife',globalName:'DSERPrograms',minify:true,target:'es2022',write:false,logLevel:'warning'});
writeFileSync('src/ui/program-machine.generated.ts','// Generated from program-machine.ts.\nexport default '+JSON.stringify(result.outputFiles[0].text)+';\n');
