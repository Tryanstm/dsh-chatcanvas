import {createRequire} from 'node:module';
/** A real CPU canvas behind JSDOM; this is not a browser or a production app. */
export function installCanvasDOM(w:any){const require=createRequire(import.meta.url),{createCanvas}=require(process.env.DSER_CANVAS_RUNTIME!);const backing=new WeakMap<object,any>(),contexts=new WeakMap<object,any>();const proto=w.HTMLCanvasElement.prototype;
 const get=(el:any)=>{let value=backing.get(el);if(!value){value=createCanvas(el.width||1,el.height||1);backing.set(el,value);}return value;};
 for(const key of ['width','height']){const d=Object.getOwnPropertyDescriptor(proto,key)!;Object.defineProperty(proto,key,{...d,set(value){d.set!.call(this,value);if(backing.has(this))backing.get(this)[key]=Number(value);}});}
 proto.getContext=function(type:string){if(type!=='2d')return null;if(!contexts.has(this)){const native=get(this).getContext('2d'),el=this;contexts.set(this,new Proxy(native,{get(target,key){if(key==='canvas')return el;const value=Reflect.get(target,key,target);return typeof value==='function'?(...args:any[])=>{if(['drawImage','createPattern'].includes(String(key))&&args[0] instanceof w.HTMLCanvasElement)args[0]=get(args[0]);return value.apply(target,args);}:value;},set(target,key,value){return Reflect.set(target,key,value,target);}}));}return contexts.get(this);};
 proto.toDataURL=function(){return get(this).toDataURL('image/png');};return {canvas:get};
}
