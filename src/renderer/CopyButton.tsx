import React,{useEffect,useRef,useState} from 'react';
import type {JSONContent} from '@tiptap/core';
import {Icon} from './Icon';
import {writeClipboardFormats} from '../composer/native-clipboard';
import {blockText,blockHTML} from './portable';
export {blockText,blockHTML} from './portable';
export async function copyPlainText(text:string){
 if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return;}
 const active=document.activeElement as HTMLElement,selection=window.getSelection(),ranges=selection?Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()):[],el=document.createElement('textarea');
 el.value=text;el.readOnly=true;Object.assign(el.style,{position:'fixed',left:'-10000px',top:'0'});document.body.append(el);
 try{el.select();if(!document.execCommand('copy'))throw new Error('复制未获授权，请选中正文后按 Ctrl+C');}finally{el.remove();active?.focus({preventScroll:true});if(selection){selection.removeAllRanges();ranges.forEach(r=>selection.addRange(r));}}
}
export function CopyButton({getText,getHTML,kind='text'}:{getText:()=>string;getHTML?:()=>string;kind?:'text'|'code'}){
 const [status,setStatus]=useState<'idle'|'busy'|'done'|'error'>('idle'),[message,setMessage]=useState(''),timer=useRef<ReturnType<typeof setTimeout>>(),alive=useRef(true),running=useRef(false);
 useEffect(()=>{alive.current=true;return()=>{alive.current=false;clearTimeout(timer.current);};},[]);
 const label=kind==='code'?'复制代码':'复制文本';
 return <span className="dser-copy-control" contentEditable={false}><button type="button" aria-label={label} title={status==='done'?'已复制':status==='error'?message:label} disabled={status==='busy'} onMouseDown={e=>e.preventDefault()} onClick={async e=>{e.stopPropagation();if(running.current)return;running.current=true;setStatus('busy');try{const plain=getText();if(getHTML)await writeClipboardFormats(plain,getHTML(),copyPlainText);else await copyPlainText(plain);if(alive.current){setStatus('done');setMessage('已复制');}}catch(error){if(alive.current){setStatus('error');setMessage(String(error));}}finally{running.current=false;if(alive.current){clearTimeout(timer.current);timer.current=setTimeout(()=>{setStatus('idle');setMessage('');},2400);}}}}><Icon name={status==='done'?'check':status==='error'?'question':'copy'} size={16}/></button><span role={status==='error'?'alert':'status'} className={status==='error'?'dser-copy-error':'dser-sr-only'}>{message}</span></span>;
}
