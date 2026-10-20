import { validateCanvas,UIViewSchema,MathSchema,type MathSpec,type UIViewState, type CanvasDocument } from './protocol';
export class CanvasPersistence {
 private db:Promise<IDBDatabase>|undefined;
 constructor(private namespace='dsh-enhanced-renderer-v1'){}
 private open(){return this.db??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open(this.namespace,1);r.onupgradeneeded=()=>r.result.createObjectStore('snapshots');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async put(key:string,value:CanvasDocument){const db=await this.open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').put(validateCanvas(value),key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
 async get(key:string){const db=await this.open();return new Promise<CanvasDocument|undefined>((resolve,reject)=>{const r=db.transaction('snapshots').objectStore('snapshots').get(key);r.onsuccess=()=>{try{resolve(r.result?validateCanvas(r.result):undefined);}catch(e){reject(e);}};r.onerror=()=>reject(r.error);});}
 async delete(key:string){const db=await this.open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('snapshots','readwrite');tx.objectStore('snapshots').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
 async close(){const db=await this.db;db?.close();this.db=undefined;}
}
export class CanvasStore {
 private listeners=new Set<()=>void>(); private undoStack:CanvasDocument[]=[];private redoStack:CanvasDocument[]=[];
 private doc:CanvasDocument; private baseline:CanvasDocument;
 private uiViews=new Map<string,UIViewState>();
 private mathViews=new Map<string,MathSpec>();private focused='';
 constructor(doc:CanvasDocument){this.doc=validateCanvas(doc);this.baseline=structuredClone(this.doc);}
 getSnapshot=()=>this.doc;
 subscribe=(f:()=>void)=>{this.listeners.add(f);return()=>{this.listeners.delete(f);};};
 get original(){return structuredClone(this.baseline);}
 get canUndo(){return this.undoStack.length>0;}get canRedo(){return this.redoStack.length>0;}
 transact(fn:(doc:CanvasDocument)=>void){if(this.doc.mode==='readonly')throw new Error('READONLY_CANVAS');const next=structuredClone(this.doc);fn(next);next.revision++;validateCanvas(next);this.undoStack.push(this.doc);if(this.undoStack.length>80)this.undoStack.shift();this.redoStack=[];this.doc=next;this.emit();}
 undo(){if(this.doc.mode==='readonly')return;const prev=this.undoStack.pop();if(prev){this.redoStack.push(this.doc);this.doc=prev;this.emit();}}
 redo(){if(this.doc.mode==='readonly')return;const next=this.redoStack.pop();if(next){this.undoStack.push(this.doc);this.doc=next;this.emit();}}
 captureUIState(objectId:string,state:UIViewState){const value=UIViewSchema.parse(state);if(JSON.stringify(value).length>70000)throw new Error('UI_STATE_TOO_LARGE');this.uiViews.set(objectId,structuredClone(value));}
 captureMathState(objectId:string,spec:MathSpec){this.mathViews.set(objectId,MathSchema.parse(spec));}
 captureFocus(objectId:string){this.focused=objectId;}
 snapshot(){const copy=structuredClone(this.doc);copy.objects.forEach(o=>{if(o.type==='ui'&&this.uiViews.has(o.id))o.viewState=structuredClone(this.uiViews.get(o.id)!);if(o.type==='math'&&this.mathViews.has(o.id))o.spec=structuredClone(this.mathViews.get(o.id)!);});return copy;}
 restoreDraft(doc:CanvasDocument){if(doc.canvasId!==this.doc.canvasId||this.doc.mode==='readonly')return;this.doc=validateCanvas(doc);this.emit();}
 /** Apply an explicit editor undo/redo snapshot, without replaying local edits into it. */
 replaceEditorSnapshot(doc:CanvasDocument){if(doc.canvasId!==this.doc.canvasId)throw new Error('CANVAS_ID_MISMATCH');this.doc=validateCanvas(doc);this.uiViews.clear();this.mathViews.clear();this.focused='';this.undoStack=[];this.redoStack=[];this.emit();}
 dispose(){this.listeners.clear();this.undoStack=[];this.redoStack=[];this.uiViews.clear();this.mathViews.clear();}
 private emit(){for(const f of this.listeners)f();}
}

/** Large rich drafts belong in IndexedDB, including inline image assets. */
export class ComposerDraftPersistence {
 private db:Promise<IDBDatabase>|undefined;
 private open(){return this.db??=new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('dsh-enhanced-composer-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('documents');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async get(key:string){const db=await this.open();return new Promise<any>((resolve,reject)=>{const r=db.transaction('documents').objectStore('documents').get(key);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async put(key:string,value:unknown){const db=await this.open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').put(value,key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
 async delete(key:string){const db=await this.open();return new Promise<void>((resolve,reject)=>{const tx=db.transaction('documents','readwrite');tx.objectStore('documents').delete(key);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});}
 async close(){const db=await this.db;db?.close();this.db=undefined;}
}
