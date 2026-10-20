import {z} from 'zod';
export const CanvasReferenceSchema=z.object({schemaVersion:z.literal(1),renderId:z.string().uuid(),canvasId:z.string().min(1).max(100),title:z.string().max(200),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type CanvasReference=z.infer<typeof CanvasReferenceSchema>;
export function readCanvasReference(content:any[]):CanvasReference|undefined{for(const b of content||[]){if(b.type!=='text'||typeof b.text!=='string')continue;const match=/<dser-canvas-ref>([^<]{1,4000})<\/dser-canvas-ref>/.exec(b.text);if(match)try{return CanvasReferenceSchema.parse(JSON.parse(match[1]!));}catch{}}}
export function formatCanvasReference(ref:CanvasReference){return `<dser-canvas-ref>${JSON.stringify(ref).replace(/</g,'\\u003c')}</dser-canvas-ref>`;}
