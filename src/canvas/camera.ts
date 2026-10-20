import type {Camera} from '../protocol';
export function cameraMatrix(c:Camera):[number,number,number,number,number,number]{const r=-c.rotation*Math.PI/180;return [Math.cos(r)*c.zoom,Math.sin(r)*c.zoom,-Math.sin(r)*c.zoom,Math.cos(r)*c.zoom,c.x,c.y];}
export function zoomCamera(c:Camera,point:{x:number;y:number},zoom:number):Camera{const ratio=zoom/c.zoom;return {...c,zoom,x:point.x+(c.x-point.x)*ratio,y:point.y+(c.y-point.y)*ratio};}
export function surfaceDelta(el:HTMLElement,dx:number,dy:number){const box=el.getBoundingClientRect();return {x:dx*(el.clientWidth/box.width||1),y:dy*(el.clientHeight/box.height||1)};}
/** Overlay events never enter Fabric's event loop, so its cached pointer may belong to an older event. */
export function clientToScene(el:HTMLElement,camera:Camera,clientX:number,clientY:number){const box=el.getBoundingClientRect(),p=surfaceDelta(el,clientX-box.left,clientY-box.top),[a,b,c,d,e,f]=cameraMatrix(camera),det=a*d-b*c,x=p.x-e,y=p.y-f;return {x:(d*x-c*y)/det,y:(a*y-b*x)/det};}
