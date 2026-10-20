import source from './worker.generated';
/** Keep sampling in one worker so parameter playback does not reload the engine every frame. */
export class PlotSampler{
 private worker?:Worker;private serial=0;private pending=new Map<number,{resolve:(value:any)=>void;reject:(e:Error)=>void;timer:ReturnType<typeof setTimeout>;cancel:()=>void}>();
 sample(spec:unknown,signal:AbortSignal){if(!this.worker){const url=URL.createObjectURL(new Blob([source],{type:'text/javascript'}));this.worker=new Worker(url);URL.revokeObjectURL(url);this.worker.onmessage=e=>{const job=this.pending.get(e.data.requestId);if(!job)return;job.cancel();e.data.ok?job.resolve(e.data.result):job.reject(new Error(e.data.error));};this.worker.onerror=()=>this.dispose(new Error('数学采样引擎未能启动'));}
 return new Promise<any>((resolve,reject)=>{const requestId=++this.serial,abort=()=>{cancel();reject(new Error('采样已取消'));},cancel=()=>{const job=this.pending.get(requestId);if(job)clearTimeout(job.timer);this.pending.delete(requestId);signal.removeEventListener('abort',abort);},timer=setTimeout(()=>this.dispose(new Error('数学采样超过 5 秒')),5000);this.pending.set(requestId,{resolve,reject,timer,cancel});if(signal.aborted){abort();return;}signal.addEventListener('abort',abort,{once:true});this.worker!.postMessage({op:'sample',spec,requestId});});}
 dispose(error=new Error('数学视图已关闭')){this.worker?.terminate();this.worker=undefined;for(const job of [...this.pending.values()]){job.cancel();job.reject(error);}this.pending.clear();}
}
