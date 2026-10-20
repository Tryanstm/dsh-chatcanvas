export const inject=['enhancedRenderer'];
export function apply(ctx){
 const renderer=ctx.get('enhancedRenderer'),mounted=new Set();
 ctx.reflect.provide('enhancedRendererIntegration',{
  mount(container,identity,bridge){
   // The caller owns branch selection and native node projection.
   const adapter={...identity,active:true,getSnapshot:()=>bridge.snapshot(),subscribe:listener=>bridge.subscribe(listener),renderNative:message=>bridge.renderNative(message),
    submit:snapshot=>renderer.submitDocument(identity.sessionId,snapshot,bridge.attachmentIds?.()||[]),
    submitCanvas:(canvas,questionId)=>renderer.submitCanvas(identity.sessionId,canvas,questionId),
    attach:bridge.attach?files=>bridge.attach(files):undefined,stop:bridge.stop?()=>bridge.stop():undefined,retry:bridge.retry?()=>bridge.retry():undefined,openModelConfig:bridge.openModelConfig?()=>bridge.openModelConfig():undefined};
   const stop=renderer.mount(container,adapter);let disposed=false;const dispose=()=>{if(disposed)return;disposed=true;stop();mounted.delete(dispose);};mounted.add(dispose);
   return {dispose,setActive(active){adapter.active=active;bridge.notify?.();}};
  }
 });
 ctx.effect(()=>()=>{for(const dispose of [...mounted])dispose();mounted.clear();});
}
