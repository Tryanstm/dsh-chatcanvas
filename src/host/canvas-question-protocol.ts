import {validateCanvas} from '../protocol';
import {CanvasReferenceSchema} from './references';
export const OPEN='<dser-canvas-question>',CLOSE='</dser-canvas-question>';
export function questionReference(detail:string|undefined){try{if(!detail?.startsWith(OPEN)||!detail.endsWith(CLOSE))return;return CanvasReferenceSchema.parse(JSON.parse(detail.slice(OPEN.length,-CLOSE.length)));}catch{return;}}
export function readCanvasAnswer(custom:string|undefined,questionId:string){
 const value=JSON.parse(custom||'');if(value.type!=='dser-canvas-answer'||value.questionId!==questionId||typeof value.text!=='string')throw new Error('画布回答标识不匹配');
 return {text:value.text,canvas:validateCanvas(value.canvas),previews:Array.isArray(value.previews)?value.previews.slice(0,1):[]};
}
