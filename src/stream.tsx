import { useEffect, useRef, useState } from 'react';
export function visibleObserver(el:Element,update:(visible:boolean)=>void){
 let intersect=true,modal=el.closest('dialog'),ob:IntersectionObserver|undefined,last:boolean|undefined;
 const emit=()=>{let visible=intersect;if(modal){const r=el.getBoundingClientRect(),m=modal.getBoundingClientRect();visible=modal.open&&r.width>0&&r.height>0&&r.bottom>Math.max(0,m.top)&&r.top<Math.min(innerHeight,m.bottom)&&r.right>Math.max(0,m.left)&&r.left<Math.min(innerWidth,m.right);}const top=[...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1);if(top&&!top.contains(el))visible=false;visible=visible&&!document.hidden;if(visible!==last){last=visible;update(visible);}};
 const observe=()=>{ob?.disconnect();ob=new IntersectionObserver(entries=>{intersect=entries[0]?.isIntersecting??false;emit();},{root:modal,rootMargin:'150px'});ob.observe(el);emit();};
 const mutations=new MutationObserver(()=>{const next=el.closest('dialog');if(next!==modal){modal=next;observe();}else emit();});mutations.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['open','style']});observe();document.addEventListener('visibilitychange',emit);
 return()=>{ob?.disconnect();mutations.disconnect();document.removeEventListener('visibilitychange',emit);};
}
/** Coalesce live node props while preserving native object identities for settled nodes. */
export function useBatchedNode<T extends {data:{status?:string}}>(node:T,active=true):T{
 const [value,setValue]=useState(node),latest=useRef(node),frame=useRef(0),last=useRef(0);latest.current=node;
 useEffect(()=>{if(!active){setValue(node);return;}if(node.data.status!=='running'){cancelAnimationFrame(frame.current);frame.current=0;setValue(node);return;}
  const tick=(time:number)=>{if(time-last.current<48){frame.current=requestAnimationFrame(tick);return;}last.current=time;setValue(latest.current);frame.current=0;};if(!frame.current)frame.current=requestAnimationFrame(tick);
 },[node,active]);useEffect(()=>()=>cancelAnimationFrame(frame.current),[]);return value;
}
/** Animate only newly created descendants; text-node identity and browser selection remain native-owned. */
export function observeStream(el:HTMLElement){const reduced=matchMedia('(prefers-reduced-motion: reduce)');let pending=new Set<Element>(),frame=0;const ob=new MutationObserver(records=>{if(reduced.matches||document.hidden)return;for(const r of records){for(const node of r.addedNodes)if(node instanceof Element)pending.add(node);}if(!frame)frame=requestAnimationFrame(()=>{frame=0;for(const n of pending)if(n.isConnected)n.animate([{opacity:.45},{opacity:1}],{duration:170,easing:'ease-out'});pending.clear();});});ob.observe(el,{childList:true,subtree:true});return()=>{ob.disconnect();cancelAnimationFrame(frame);pending.clear();};}
