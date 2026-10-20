import {mkdir,readFile,writeFile,rename,unlink} from 'node:fs/promises';
import {createHash,randomUUID} from 'node:crypto';import {homedir} from 'node:os';import {join,resolve,dirname} from 'node:path';
import {validateCanvas,type CanvasDocument} from '../protocol';import {CanvasReferenceSchema,type CanvasReference} from './references';
/** Immutable plugin-owned files. Session journals and provider credentials are never edited. */
export class PublishedSnapshots {
 constructor(private root=join(resolve(process.env.DSH_HOME?.trim()||join(homedir(),'.dsh')),'storages','dsh-enhanced-renderer','snapshots')){}
 private location(sessionId:string,renderId:string){if(typeof sessionId!=='string'||!sessionId||sessionId.length>200)throw new Error('INVALID_SESSION');if(!/^[a-f0-9-]{36}$/.test(renderId))throw new Error('INVALID_RENDER_ID');return join(this.root,createHash('sha256').update(sessionId).digest('hex'),renderId+'.json');}
 async put(sessionId:string,document:CanvasDocument):Promise<CanvasReference>{const doc=validateCanvas(document),renderId=randomUUID(),path=this.location(sessionId,renderId),data=JSON.stringify(doc),sha256=createHash('sha256').update(data).digest('hex'),temp=path+'.'+randomUUID()+'.tmp';await mkdir(dirname(path),{recursive:true});try{await writeFile(temp,data,{encoding:'utf8',flag:'wx'});await rename(temp,path);}catch(e){await unlink(temp).catch(()=>{});throw e;}return {schemaVersion:1,renderId,canvasId:doc.canvasId,title:doc.title,sha256};}
 async get(sessionId:string,ref:CanvasReference){const value=CanvasReferenceSchema.parse(ref),data=await readFile(this.location(sessionId,value.renderId),'utf8');if(createHash('sha256').update(data).digest('hex')!==value.sha256)throw new Error('CANVAS_CHECKSUM_MISMATCH');const doc=validateCanvas(JSON.parse(data));if(doc.canvasId!==value.canvasId)throw new Error('CANVAS_ID_MISMATCH');return doc;}
 async read(sessionId:string,renderId:string){return validateCanvas(JSON.parse(await readFile(this.location(sessionId,renderId),'utf8')));}
}
export function registerSnapshotRoute(ctx:any,store:PublishedSnapshots){
 // The official /api Fetch carrier enforces authentication in Web and Electron IPC.
 ctx.inject(['connection'],(scoped:any)=>scoped.connection.fetch.register({path:'/api/dser.canvas',methods:['POST'],requestBody:'buffered',async fetch(request:Request){try{if(Number(request.headers.get('content-length')||0)>2000)return new Response('request too large',{status:413});const text=await request.text();if(text.length>2000)return new Response('request too large',{status:413});const input=JSON.parse(text),reference=CanvasReferenceSchema.parse(input.reference);request.signal.throwIfAborted();const document=await store.get(input.sessionId,reference);return Response.json(document,{headers:{'Cache-Control':'no-store'}});}catch{return new Response('Canvas unavailable in this session',{status:404});}}}));
}
