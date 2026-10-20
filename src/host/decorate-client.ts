/** Retain the native entry's child-slot authorization, stores and hook identity.
 * Watch entries so other plugins can register their view before or after us.
 * No installed application or third-party source file is changed.
 */
export function decorateEntries(ctx:any,key:string,select:(entry:any)=>boolean,wrap:(component:any)=>any){
 return ctx.slots.inject(key,()=>ctx.effect(()=>{
  const decorated=new Map<any,{native:any;wrapped:any}>();
  const refresh=()=>{for(const entry of ctx.slots.entries(key)){if(!select(entry)||decorated.has(entry))continue;const native=entry.component,wrapped=wrap(native);decorated.set(entry,{native,wrapped});entry.component=wrapped;}ctx.emit?.('slots/changed',key);};
  // Core subscribers observe registration changes. Emitting the public renderer
  // event above does not mutate the core ledger or recursively notify this watch.
  const dispose=ctx.slots.subscribe(key,()=>{const missing=ctx.slots.entries(key).some((e:any)=>select(e)&&!decorated.has(e));if(missing)refresh();});refresh();
  return()=>{dispose();for(const [entry,{native,wrapped}] of decorated)if(entry.component===wrapped)entry.component=native;ctx.emit?.('slots/changed',key);};
 }));
}
