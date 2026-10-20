import {z} from 'zod';
export const DocumentReferenceSchema=z.object({schemaVersion:z.literal(1),renderId:z.string().uuid(),documentId:z.string(),title:z.string().max(200),sha256:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
export type DocumentReference=z.infer<typeof DocumentReferenceSchema>;
export function formatDocumentReference(reference:DocumentReference){return `<dser-rich-ref>${JSON.stringify(reference).replace(/</g,'\\u003c')}</dser-rich-ref>`;}
export function readDocumentReference(content:any[]){for(const b of content||[]){const m=b.type==='text'&&/<dser-rich-ref>([^<]{1,4000})<\/dser-rich-ref>/.exec(b.text||'');if(m)try{return DocumentReferenceSchema.parse(JSON.parse(m[1]));}catch{}}}
