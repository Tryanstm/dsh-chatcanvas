/** Keep both browser clipboard formats, including WebViews without ClipboardItem support. */
export function writeLegacyRich(plain:string,html:string){
 if(typeof document.execCommand!=='function')return false;
 let written=false;const listener=(event:ClipboardEvent)=>{if(!event.clipboardData)return;event.preventDefault();event.stopImmediatePropagation();event.clipboardData.setData('text/plain',plain);event.clipboardData.setData('text/html',html);written=true;};
 // Canvas focus has no DOM text selection. WebViews may otherwise skip the copy
 // event entirely; create a temporary selection inside the active modal layer.
 const selection=window.getSelection(),ranges=selection?Array.from({length:selection.rangeCount},(_,i)=>selection.getRangeAt(i).cloneRange()):[],focus=document.activeElement as HTMLElement|null,seat=document.createElement('span');seat.contentEditable='true';seat.textContent=' ';seat.style.cssText='position:fixed;left:0;top:0;width:1px;height:1px;opacity:.001;pointer-events:none';const dialogs=document.querySelectorAll('dialog[open]');(dialogs[dialogs.length-1]||document.body).append(seat);seat.focus({preventScroll:true});const range=document.createRange();range.selectNodeContents(seat);selection?.removeAllRanges();selection?.addRange(range);
 document.addEventListener('copy',listener,true);try{document.execCommand?.('copy');}finally{document.removeEventListener('copy',listener,true);seat.remove();focus?.focus({preventScroll:true});selection?.removeAllRanges();for(const previous of ranges)try{selection?.addRange(previous);}catch{}}return written;
}
export async function writeClipboardFormats(plain:string,html:string,fallback:(text:string)=>Promise<void>){
 if(navigator.clipboard?.write&&typeof ClipboardItem!=='undefined')try{await navigator.clipboard.write([new ClipboardItem({'text/plain':new Blob([plain],{type:'text/plain'}),'text/html':new Blob([html],{type:'text/html'})})]);return;}catch{}
 if(!writeLegacyRich(plain,html))await fallback(plain);
}
