const registered=new WeakSet<Function>();
export function registerRendererTool(ctx:any,definition:any){registered.add(definition.execute);return ctx.tools.register(definition);}
export function registerToolCatalog(ctx:any){if(typeof ctx.provide==='function')ctx.provide('chatCanvasTools',{owns:(definition:any)=>!!definition&&registered.has(definition.execute)});}
