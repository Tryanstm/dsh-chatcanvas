// Worker-only CPU inference. No file upload, remote model fetch or GPU backend.
import {BasicPitch} from '../../vendor/transcription/basic-pitch/esm/inference';
import {noteFramesToTime,outputToNotesPoly} from '../../vendor/transcription/basic-pitch/esm/toMidi';
declare const __DSER_PITCH_WASM__:Record<string,string>;
declare const __DSER_PITCH_MODEL__:any;declare const __DSER_PITCH_WEIGHTS__:string;
const scope=globalThis as any,tf=scope.tf;
const binaries=__DSER_PITCH_WASM__,paths=Object.fromEntries(Object.entries(binaries).map(([n,b64])=>[n,'data:application/wasm;base64,'+b64]));paths['tfjs-backend-wasm-threaded-simd.wasm']=paths['tfjs-backend-wasm-simd.wasm'];
scope.fetch=(url:unknown)=>{if(typeof url==='string'&&Object.values(paths).includes(url)){const bytes=Uint8Array.from(atob(url.split(',')[1]!),c=>c.charCodeAt(0));return Promise.resolve(new Response(bytes,{headers:{'Content-Type':'application/wasm'}}));}return Promise.reject(Error('离线转录禁止网络请求'));};
tf.setPlatform('dser-offline-worker',{fetch:scope.fetch,now:()=>performance.now(),encode:(s:string)=>new TextEncoder().encode(s),decode:(data:Uint8Array,encoding:string)=>new TextDecoder(encoding).decode(data)});
scope.onmessage=async(e:MessageEvent)=>{let model:any;try{
 const {pcm,threshold}=e.data;if(!(pcm instanceof Float32Array)||!pcm.length||pcm.length>22050*180||!Number.isFinite(threshold)||threshold<.15||threshold>.9)throw Error('无效的转录输入');
 scope.postMessage({type:'progress',value:0});tf.env().set('WASM_HAS_MULTITHREAD_SUPPORT',false);tf.wasm.setThreadsCount(1);tf.wasm.setWasmPaths(paths,true);try{if(!await tf.setBackend('wasm'))await tf.setBackend('cpu');}catch{await tf.setBackend('cpu');}await tf.ready();
 const bytes=Uint8Array.from(atob(__DSER_PITCH_WEIGHTS__),c=>c.charCodeAt(0)),metadata=__DSER_PITCH_MODEL__;
 model=await tf.loadGraphModel(tf.io.fromMemory({...metadata,weightSpecs:metadata.weightsManifest.flatMap((g:any)=>g.weights),weightData:bytes.buffer}));
 const engine=new BasicPitch(Promise.resolve(model)),frames:number[][]=[],onsets:number[][]=[];
 const length=43844,hop=36164,pad=3840,outputFrames=Math.floor(pcm.length*86/22050),windows=Math.ceil((pcm.length+pad)/hop);
 for(let w=0;w<windows&&frames.length<outputFrames;w++){
  tf.engine().startScope();try{const data=new Float32Array(length),from=w*hop-pad;for(let i=Math.max(0,-from);i<length&&from+i<pcm.length;i++)data[i]=pcm[from+i]!;
   const input=tf.tensor3d(data,[1,length,1]),raw=await engine.evaluateSingleFrame(input,0),f=await engine.unwrapOutput(raw[0]).array(),o=await engine.unwrapOutput(raw[1]).array(),remaining=outputFrames-frames.length;
   frames.push(...f.slice(0,remaining));onsets.push(...o.slice(0,remaining));
  }finally{tf.engine().endScope();}
  scope.postMessage({type:'progress',value:Math.min(.96,(w+1)/windows*.96)});await new Promise(r=>setTimeout(r,0));
 }
 const notes=noteFramesToTime(outputToNotesPoly(frames,onsets,threshold,Math.max(.1,threshold-.15),8)).map(n=>({...n,startTimeSeconds:Math.max(0,n.startTimeSeconds),durationSeconds:Math.min(n.durationSeconds,pcm.length/22050-Math.max(0,n.startTimeSeconds))})).filter(n=>n.durationSeconds>.025&&n.startTimeSeconds<pcm.length/22050);
 if(notes.length>5000)throw Error('识别超过 5000 个音符，请缩短片段或降低灵敏度');scope.postMessage({type:'progress',value:1});scope.postMessage({type:'result',notes});
 }catch(e){scope.postMessage({type:'error',message:String(e instanceof Error?e.message:e)});}finally{model?.dispose();}};
