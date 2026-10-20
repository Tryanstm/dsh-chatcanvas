import { Canvas, Rect, Ellipse, Triangle, Polygon, Path, Line, IText, Textbox, Group, FabricImage, FabricObject, Point, Control, controlsUtils, util } from 'fabric';
import type { CanvasDocument,CanvasObject } from '../protocol';
export type SceneObject=FabricObject & {dserId?:string;dserType?:string;dserRadii?:number[];dserVisualHidden?:boolean};
export function roundedPath(w:number,h:number,r:number[]){const [a,b,c,d]=r.map(v=>Math.min(Math.max(v,0),w/2,h/2));return `M ${a} 0 L ${w-b!} 0 Q ${w} 0 ${w} ${b} L ${w} ${h-c!} Q ${w} ${h} ${w-c!} ${h} L ${d} ${h} Q 0 ${h} 0 ${h-d!} L 0 ${a} Q 0 0 ${a} 0 Z`;}
export async function createFabricObject(o:CanvasObject,doc:CanvasDocument):Promise<SceneObject>{
 let f:SceneObject;const style=o.type==='geometry'?{fill:o.fill,stroke:o.stroke,strokeWidth:o.strokeWidth,strokeUniform:true,strokeLineCap:'round' as const,strokeLineJoin:'round' as const}:{fill:'transparent',stroke:'#8d9bff',strokeWidth:1};
 if(o.type==='geometry')switch(o.geometry){
  case 'rect':case 'square':f=new Rect({width:o.width,height:o.height,...style});break;
  case 'roundrect':f=new Path(roundedPath(o.width,o.height,o.radii||[16,16,16,16]),style);break;
  case 'circle':case 'ellipse':f=new Ellipse({rx:o.width/2,ry:o.height/2,...style});break;
  case 'triangle':f=new Triangle({width:o.width,height:o.height,...style});break;
  case 'polygon':f=new Polygon((o.points||[[0,o.height],[o.width/2,0],[o.width,o.height]]).map(([x,y])=>({x,y})),style);break;
  case 'line':{const p=o.points&&o.points.length>=2?o.points:[[0,0],[o.width,o.height]];f=new Line([p[0]![0],p[0]![1],p[1]![0],p[1]![1]],{...style,fill:'transparent'});break;}
  case 'arrow':{const [a,b]=o.points&&o.points.length>=2?o.points:[[0,o.height/2],[o.width,o.height/2]],dx=b![0]-a![0],dy=b![1]-a![1],length=Math.max(1,Math.hypot(dx,dy)),nx=dx/length,ny=dy/length,head=Math.min(14,length*.35),backX=b![0]-nx*head,backY=b![1]-ny*head;f=new Path(`M ${a![0]} ${a![1]} L ${b![0]} ${b![1]} M ${backX-ny*head*.6} ${backY+nx*head*.6} L ${b![0]} ${b![1]} L ${backX+ny*head*.6} ${backY-nx*head*.6}`,{...style,fill:'transparent'});break;}
  case 'path':f=new Path(o.path as any,{...style,fill:'transparent'});break;
 }else if(o.type==='text')f=new Textbox(o.text,{fontSize:o.fontSize,fill:o.color,fontWeight:o.bold?'bold':'normal',fontFamily:'sans-serif',width:o.width});
 else if(o.type==='image'){const data=doc.assets[o.assetId]?.data;if(!data)throw new Error('图像附件尚未恢复');f=await FabricImage.fromURL(data);}
 else f=new Rect({width:o.width,height:o.height,...style,fill:'#ffffff01'});
 if(o.type==='geometry'){f.width=Math.max(1,f.width);f.height=Math.max(1,f.height);}
 f.set({left:o.x,top:o.y,angle:o.rotation,opacity:o.opacity,scaleX:o.type==='text'?1:o.width/(f.width||o.width),scaleY:o.type==='text'?1:o.height/(f.height||o.height),cornerColor:'#4d6bfe',borderColor:'#4d6bfe',transparentCorners:false,cornerSize:8,originX:'left',originY:'top'});if(o.type==='geometry'&&o.erasures?.length){const masks=o.erasures.map(e=>e.kind==='ellipse'?new Ellipse({left:(e.x-.5)*f.width,top:(e.y-.5)*f.height,rx:e.rx*f.width,ry:e.ry*f.height,originX:'center',originY:'center',fill:'black'}):new Polygon(e.points.map(([x,y])=>({x:(x-.5)*f.width,y:(y-.5)*f.height})),{fill:'black'}));f.clipPath=new Group(masks,{inverted:true});}f.dserId=o.id;f.dserType=o.type;f.dserRadii=o.type==='geometry'?o.radii:undefined;f.setCoords();return f;
}
export function syncObject(o:CanvasObject,f:SceneObject):CanvasObject{
 const transform=f.calcTransformMatrix(),decomposed=util.qrDecompose(transform),origin=util.transformPoint(new Point(-f.width/2,-f.height/2),transform);
 const next={...o,x:f.group?origin.x:f.left||0,y:f.group?origin.y:f.top||0,width:Math.max(1,(f.width||1)*Math.abs(f.group?decomposed.scaleX:f.scaleX||1)),height:Math.max(1,(f.height||1)*Math.abs(f.group?decomposed.scaleY:f.scaleY||1)),rotation:f.group?decomposed.angle:f.angle||0,opacity:f.dserVisualHidden?o.opacity:f.opacity};
 if(next.type==='text'&&f instanceof IText){next.text=f.text;next.fontSize=Math.max(8,Math.min(200,f.fontSize*Math.abs(f.scaleY||1)));next.color=String(f.fill);next.bold=f.fontWeight==='bold';}
 if(next.type==='geometry'){if(f instanceof Polygon)next.points=f.points.map(p=>[p.x,p.y]);if(f.dserRadii){next.radii=f.dserRadii as [number,number,number,number];if(['rect','square'].includes(next.geometry)&&f.dserRadii.some(r=>r>0))next.geometry='roundrect';}}
 return next;
}
export function advancedControls(f:SceneObject){if(f instanceof Polygon){f.controls=controlsUtils.createPolyControls(f);return;}
 f.dserRadii??=[0,0,0,0];const corners=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];
 corners.forEach(([x,y],i)=>{f.controls[`radius${i}`]=new Control({x:x!,y:y!,offsetX:x!<0?12:-12,offsetY:y!<0?12:-12,cursorStyle:'ew-resize',actionName:'radius',actionHandler:(e,transform)=>{const target=transform.target as SceneObject;const p=target.canvas!.getScenePoint(e);const local=util.transformPoint(p,util.invertTransform(target.calcTransformMatrix()));const distance=Math.abs(local.x-(x!<0?-target.width/2:target.width/2));target.dserRadii![i]=Math.min(target.width/2,target.height/2,Math.max(0,distance));if(target instanceof Rect)target.set({rx:(target as SceneObject).dserRadii![i],ry:(target as SceneObject).dserRadii![i]});if(target instanceof Path)target.set({path:new Path(roundedPath(target.width,target.height,(target as SceneObject).dserRadii!)).path});target.dirty=true;return true;}});});f.canvas?.requestRenderAll();}
export { Canvas, Point };

