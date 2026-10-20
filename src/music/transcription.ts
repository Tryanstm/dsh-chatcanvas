import source from './transcription-worker.generated';
import {MusicSchema,secondsBeat,type MusicSpec} from './model';
export const TRANSCRIPTION_RATE=22050,MAX_TRANSCRIPTION_SECONDS=180;
export type TranscribedNote={pitchMidi:number;startTimeSeconds:number;durationSeconds:number;amplitude:number};
export function clipPCM(audio:Pick<AudioBuffer,'sampleRate'|'numberOfChannels'|'length'|'getChannelData'>,start:number,end:number){
 const duration=audio.length/audio.sampleRate;if(!Number.isFinite(start)||!Number.isFinite(end)||start<0||end<=start||end>duration+.001||end-start>MAX_TRANSCRIPTION_SECONDS+.001)throw Error('请选择有效片段，单次最多 180 秒');
 const rate=audio.sampleRate,frames=Math.floor((end-start)*TRANSCRIPTION_RATE),out=new Float32Array(frames);if(!frames||audio.numberOfChannels<1)throw Error('音频片段为空');
 for(let c=0;c<audio.numberOfChannels;c++){const channel=audio.getChannelData(c);for(let i=0;i<frames;i++){const p=start*rate+i*rate/TRANSCRIPTION_RATE,a=Math.min(channel.length-1,Math.floor(p)),b=Math.min(channel.length-1,a+1),v=channel[a]!+(channel[b]!-channel[a]!)*(p-a);out[i]+=Number.isFinite(v)?v/audio.numberOfChannels:0;}}
 return out;
}
export function appendTranscription(spec:MusicSpec,notes:TranscribedNote[],options:{name:string;instrument:number;quantize:boolean}){
 if(!notes.length)throw Error('未识别到音符，请调整灵敏度或片段');if(notes.length+spec.tracks.reduce((n,t)=>n+t.notes.length,0)>5000)throw Error('导入后超过 5000 个音符，请缩短片段或减少杂音');
 if(spec.tracks.length>=32)throw Error('音轨已达 32 条，请先整理音轨');const next=structuredClone(spec);const q=spec.quantize,snap=(x:number)=>options.quantize?Math.round(x/q)*q:x;
 const track={id:crypto.randomUUID(),name:options.name.slice(0,100),instrument:options.instrument,channel:0,volume:.8,muted:false,notes:notes.map(n=>{if(![n.pitchMidi,n.startTimeSeconds,n.durationSeconds,n.amplitude].every(Number.isFinite)||!Number.isInteger(n.pitchMidi)||n.pitchMidi<0||n.pitchMidi>127||n.startTimeSeconds<0||n.durationSeconds<=0||n.startTimeSeconds+n.durationSeconds>MAX_TRANSCRIPTION_SECONDS+.1)throw Error('识别结果包含无效音符');const start=snap(secondsBeat(spec,n.startTimeSeconds)),end=snap(secondsBeat(spec,n.startTimeSeconds+n.durationSeconds));return {id:crypto.randomUUID(),pitch:n.pitchMidi,start,duration:Math.max(options.quantize?q:.0001,end-start),velocity:Math.max(.01,Math.min(1,n.amplitude)),sustain:0,reverb:0};})};
 next.tracks.push(track);if(next.end!==undefined)next.end=Math.max(next.end,...track.notes.map(n=>n.start+n.duration));return MusicSchema.parse(next);
}
export type TranscriptionWorker=Pick<Worker,'postMessage'|'terminate'|'onmessage'|'onerror'|'onmessageerror'>;
function makeWorker(){const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));try{return new Worker(url);}finally{URL.revokeObjectURL(url);}}
export function transcribePCM(pcm:Float32Array,signal:AbortSignal,onProgress:(p:number)=>void,threshold=.5,create:()=>TranscriptionWorker=makeWorker):Promise<TranscribedNote[]>{
 return new Promise((resolve,reject)=>{let worker:TranscriptionWorker|undefined,timer:ReturnType<typeof setTimeout>|undefined,settled=false;const finish=(error?:Error,notes?:TranscribedNote[])=>{if(settled)return;settled=true;clearTimeout(timer);signal.removeEventListener('abort',abort);worker?.terminate();error?reject(error):resolve(notes!);};const abort=()=>finish(new DOMException('已取消转录','AbortError'));
 if(signal.aborted){abort();return;}if(!pcm.length||pcm.length>TRANSCRIPTION_RATE*MAX_TRANSCRIPTION_SECONDS||!Number.isFinite(threshold)||threshold<.15||threshold>.9){finish(Error('音频片段或灵敏度无效'));return;}
 try{worker=create();signal.addEventListener('abort',abort,{once:true});timer=setTimeout(()=>finish(Error('转录耗时过长，请缩短片段后重试')),15*60*1000);worker.onmessage=e=>{const data=e.data;if(data.type==='progress')onProgress(Math.max(0,Math.min(1,Number(data.value)||0)));else if(data.type==='result')finish(undefined,data.notes);else if(data.type==='error')finish(Error(String(data.message)));};worker.onerror=()=>finish(Error('本地转录引擎未能运行，请确认安装包完整'));worker.onmessageerror=()=>finish(Error('转录结果无法读取'));worker.postMessage({pcm,threshold},[pcm.buffer]);}catch(e){finish(e instanceof Error?e:Error(String(e)));}
 });
}
