import {useArtifactCopy} from './copy';
import React,{useEffect,useState} from 'react';import {validateCanvas,type CanvasDocument} from '../protocol';import {CanvasEditor,type CanvasEditorProps} from '../canvas/CanvasEditor';import {CreationCard} from '../renderer/ErrorBoundary';import type {CanvasNodeState} from './conversation';
export function PublishedCanvas({node,sessionId,...props}:Omit<CanvasEditorProps,'document'>&{node:CanvasNodeState;sessionId:string}){
 const [document,setDocument]=useState<CanvasDocument|undefined>(node.document),[error,setError]=useState('');useArtifactCopy(sessionId,(node as any).sourceLocation?.turn,node.reference?.renderId,document?{type:'doc',content:[{type:'canvasBlock',attrs:{document}}]}:undefined,(node as any).anchorSeq);
 useEffect(()=>{const abort=new AbortController();setError('');setDocument(node.document);if(node.reference){fetch('api/dser.canvas',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId,reference:node.reference}),signal:abort.signal}).then(async r=>{if(!r.ok)throw new Error('画布文件不存在或不属于当前会话；请重新发布');return validateCanvas(await r.json());}).then(setDocument).catch(e=>{if(!abort.signal.aborted)setError(String(e));});}return()=>abort.abort();},[node.reference?.renderId,node.document,sessionId]);
 if(node.status!=='ready')return <CreationCard state={node.status} error={node.status==='creating'?undefined:node.error}/>;
 if(error)return <div className="dser-error">{error}</div>;if(!document)return <CreationCard state="creating"/>;
 return <CanvasEditor {...props} document={{...document,mode:'readonly'}}/>;
}
