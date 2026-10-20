import {UIReadViewport} from '../ui/UIReadViewport';
import React,{useEffect,useRef,useState} from 'react';
import {MathDocumentSchema,UIDesignSchema,type MathDocument,type UIDesign,type UIViewState} from '../protocol';
import {ComponentFrame} from './ComponentFrame';
import {MathPlot} from '../math/MathPlot';
import {UIEditor} from '../ui/UIEditor';
import {UIPreview} from '../ui/UIPreview';
export function MathBlockView({document,scope,onChange,onDelete,onCopy,active=true}:{document:MathDocument;scope:string;onChange?:(d:MathDocument)=>void;onDelete?:()=>void;onCopy?:(d:MathDocument)=>void;active?:boolean}){
 const doc=MathDocumentSchema.parse(document),editable=doc.mode==='editable', [spec,setSpec]=useState(doc.spec);useEffect(()=>setSpec(doc.spec),[document.id,document.spec]);
 return <ComponentFrame copyNode={{type:'mathBlock',attrs:{document:{...doc,spec}}}} kind="math" title={doc.title} editable={editable} onDelete={onDelete} onCopy={onCopy?()=>onCopy({...doc,spec}):undefined}>{({full})=><MathPlot spec={spec} full={full} active={active} editable={editable} onChange={next=>{setSpec(next);if(editable)onChange?.({...doc,spec:next});}}/>}</ComponentFrame>;
}
export function UIBlockView({document,scope,onChange,onDelete,onCopy,onViewState,active=true}:{document:UIDesign;scope:string;onChange?:(d:UIDesign)=>void;onDelete?:()=>void;onCopy?:(d:UIDesign)=>void;onViewState?:(s:UIViewState)=>void;active?:boolean}){
 const doc=UIDesignSchema.parse(document),editable=doc.mode==='editable',view=useRef<UIViewState|undefined>(doc.viewState);useEffect(()=>{view.current=doc.viewState;},[doc.id,JSON.stringify(document.viewState)]);const remember=(state:UIViewState)=>{view.current=state;onViewState?.(state);};
 return <ComponentFrame copyNode={()=>({type:'uiBlock',attrs:{document:{...doc,viewState:view.current}}})} kind="ui" title={doc.title} width={doc.width} height={doc.height} editable={editable} onDelete={onDelete} onCopy={onCopy?()=>onCopy({...doc,viewState:view.current}):undefined}>{({full,scaled,width:frameWidth,height:frameHeight})=><div className="dser-ui-design-viewport">{editable?<UIEditor document={document.document} full={full} width={doc.width} height={doc.height} active={active&&!scaled} viewState={view.current} onState={remember} onViewportResize={(width,height)=>onChange?.({...document,width,height})} onChange={next=>onChange?.({...document,document:next})}/>:<UIReadViewport document={document.document} width={doc.width} height={doc.height} viewState={view.current} onState={remember} active={active&&!scaled}/>}</div>}</ComponentFrame>;
}
