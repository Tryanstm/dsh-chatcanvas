import type {UIDocument,UIViewState} from '../protocol';
import {buildPreviewDocument} from './UIPreview';
import {captureUIModel} from './capture-model';
import {UIDesignSchema,validateUI,type UIDesign} from '../protocol';
import {download} from '../music/files';
export function exportUIProject(value:UIDesign){const doc=UIDesignSchema.parse(value);validateUI(doc.document);return JSON.stringify({format:'dser-ui-project',version:1,document:doc},null,2);}
export function importUIProject(text:string){if(text.length>16000000)throw Error('工程文件超过16MB');const v=JSON.parse(text);if(v.format!=='dser-ui-project'||v.version!==1)throw Error('不支持的 UI 工程版本');const doc=UIDesignSchema.parse(v.document);validateUI(doc.document);doc.mode='editable';return doc;}
export function saveUIProject(document:UIDocument,viewState:UIViewState,width:number,height:number){download(exportUIProject({schemaVersion:1,id:crypto.randomUUID(),title:'界面预览',type:'dser-ui',mode:'editable',document,viewState,width,height}),'界面预览.dser-ui.json','application/json');}
export async function exportUI(document:UIDocument,view:UIViewState,width:number,height:number,format:'png'|'html'){
 const anchor=globalThis.document.createElement('a');let url='';
 try{if(format==='html'){let html=buildPreviewDocument(document,crypto.randomUUID().replaceAll('-',''),false,view,false,{viewport:{width,height}});html=html.replace('<main id="root">',`<main id="root" style="width:${width}px;height:${height}px;min-height:${height}px;margin:auto">`);url=URL.createObjectURL(new Blob([html],{type:'text/html;charset=utf-8'}));anchor.href=url;}else anchor.href=await captureUIModel(document,view,width,height);anchor.download='界面预览.'+format;globalThis.document.body.append(anchor);anchor.click();}finally{anchor.remove();if(url)setTimeout(()=>URL.revokeObjectURL(url),1000);}
}
