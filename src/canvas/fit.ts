import type {Camera,CanvasObject} from '../protocol';
export function resizeCamera(camera:Camera,fromWidth:number,fromHeight:number,width:number,height:number,scale=false):Camera{const ratio=scale?Math.min(width/Math.max(1,fromWidth),height/Math.max(1,fromHeight)):1;return {...camera,x:width/2+(camera.x-fromWidth/2)*ratio,y:height/2+(camera.y-fromHeight/2)*ratio,zoom:Math.max(.05,Math.min(20,camera.zoom*ratio))};}
export function fitCamera(objects:CanvasObject[],width:number,height:number,padding=24):Camera{
 const visible=objects.filter(o=>o.opacity>0);if(!visible.length)return {x:width/2,y:height/2,zoom:1,rotation:0};
 const corners=visible.flatMap(o=>{const a=o.rotation*Math.PI/180,c=Math.cos(a),s=Math.sin(a);return [[0,0],[o.width,0],[0,o.height],[o.width,o.height]].map(([x,y])=>({x:o.x+x!*c-y!*s,y:o.y+x!*s+y!*c}));});
 const left=Math.min(...corners.map(p=>p.x)),right=Math.max(...corners.map(p=>p.x)),top=Math.min(...corners.map(p=>p.y)),bottom=Math.max(...corners.map(p=>p.y)),zoom=Math.max(.05,Math.min(3,Math.max(1,width-padding*2)/Math.max(1,right-left),Math.max(1,height-padding*2)/Math.max(1,bottom-top)));
 return {x:width/2-(left+right)*zoom/2,y:height/2-(top+bottom)*zoom/2,zoom,rotation:0};
}
