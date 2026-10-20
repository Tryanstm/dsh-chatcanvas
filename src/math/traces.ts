import { compileSafe, parseEquation } from './parser';
import {parameterScope} from './scope';
import type { MathSpec } from '../protocol';
const lin=(a:number,b:number,n:number)=>Array.from({length:n},(_,i)=>a+(b-a)*i/(n-1));
export function buildTraces(spec:MathSpec):{traces:any[];parameters:string[]}{
 const parameters=new Set<string>(),free=new Set<string>();const traces:any[]=[];let current:MathSpec["items"][number];
 const compile=(s:string)=>{const c=compileSafe(s);c.parameters.forEach(p=>{parameters.add(p);if(!current.parameterBindings?.[p])free.add(p);});return (scope:Record<string,number>)=>c.evaluate({...parameterScope(current,{...Object.fromEntries([...parameters].map(p=>[p,1])),...spec.parameters}),...scope});};
 for(const item of spec.items){current=item;const common={name:item.expression||item.kind,line:{color:item.color,width:item.width,dash:item.dash},opacity:.85};
  if(['cube','sphere','cylinder'].includes(item.kind)){
   if(spec.dimension!==3)throw new Error('空间几何体需要三维视图');
   const r=item.radius;
   if(item.kind==='cube'){traces.push({type:'mesh3d',...common,color:item.color,x:[-r,r,r,-r,-r,r,r,-r],y:[-r,-r,r,r,-r,-r,r,r],z:[-r,-r,-r,-r,r,r,r,r],i:[0,0,4,4,0,0,1,1,2,2,3,3],j:[1,2,5,6,1,5,2,6,3,7,0,4],k:[2,3,6,7,5,4,6,5,7,6,4,7]});continue;}
   const theta=lin(0,Math.PI*2,45),phi=item.kind==='sphere'?lin(0,Math.PI,30):lin(-r,r,24);const x:number[][]=[],y:number[][]=[],z:number[][]=[];
   for(const p of phi){x.push(theta.map(t=>r*Math.cos(t)*(item.kind==='sphere'?Math.sin(p):1)));y.push(theta.map(t=>r*Math.sin(t)*(item.kind==='sphere'?Math.sin(p):1)));z.push(theta.map(()=>item.kind==='sphere'?r*Math.cos(p):p));}
   traces.push({type:'surface',x,y,z,...common,showscale:false,colorscale:[[0,item.color],[1,item.color]],contours:spec.wireframe?{x:{show:true},y:{show:true},z:{show:true}}:undefined});continue;
  }
  if(item.kind==='parametricSurface'){
   if(spec.dimension!==3||item.coordinates?.length!==3)throw new Error('参数曲面需要三维坐标表达式');const funcs=item.coordinates.map(compile),u=lin(...spec.range.t,40),v=lin(...spec.range.t,40);const coords=funcs.map(f=>u.map(u=>v.map(v=>f({u,v}))));traces.push({type:'surface',...common,x:coords[0],y:coords[1],z:coords[2],hidesurface:spec.wireframe,showscale:false,colorscale:[[0,item.color],[1,item.color]],contours:spec.wireframe?{x:{show:true},y:{show:true},z:{show:true}}:undefined});continue;
  }
  if(item.kind==='parametric'||item.kind==='line'){
   if(!item.coordinates||item.coordinates.length<spec.dimension)throw new Error('参数曲线需要完整坐标表达式');
   const f=item.coordinates.map(compile),t=lin(...spec.range.t,240);const coords=f.map(fn=>t.map(t=>fn({t,u:t,v:t})));
   traces.push({type:spec.dimension===3?'scatter3d':'scatter',mode:'lines',...common,x:coords[0],y:coords[1],...(spec.dimension===3?{z:coords[2]}:{})});continue;
  }
  const equation=parseEquation(item.expression||'');equation.parameters.forEach(p=>parameters.add(p));const f=compile(equation.expression);for(const point of item.constraints||[]){if(point.role!=='curve')continue;const actual=f({x:point.x,y:point.y,z:point.z??0}),expected=equation.kind==='explicit'?(equation.lhs==='z'?point.z??0:point.y):0;if(!Number.isFinite(actual)||Math.abs(actual-expected)>1e-7*Math.max(1,Math.abs(expected)))throw new Error('当前自由参数不满足全部点约束，请调整参数');}
  if(spec.dimension===2&&equation.kind==='explicit'){
   const x=lin(...spec.range.x,400);const y=x.map(x=>f({x}));for(let i=1;i<y.length;i++)if(Math.abs(y[i]!-y[i-1]!)>(spec.range.y[1]-spec.range.y[0])*8)y[i]=NaN;
   traces.push({type:'scatter',mode:'lines',...common,x,y,connectgaps:false});
  }else{
   const x=lin(...spec.range.x,spec.dimension===3?45:85),y=lin(...spec.range.y,spec.dimension===3?45:85),z=y.map(y=>x.map(x=>f({x,y})));
   if(spec.dimension===3){if(equation.kind==='implicit')throw new Error('三维隐式曲面暂不支持；请使用显式或参数曲面');traces.push({type:'surface',...common,x,y,z,hidesurface:spec.wireframe,showscale:false,colorscale:[[0,item.color],[1,item.color]],contours:spec.wireframe?{x:{show:true},y:{show:true},z:{show:true}}:undefined});}
   else traces.push({type:'contour',...common,x,y,z,showscale:false,colorscale:[[0,item.color],[1,item.color]],contours:{start:0,end:0,size:1,coloring:'lines'},line:{color:item.color,width:item.width},hoverinfo:'x+y'});
  }
 }return {traces,parameters:[...free]};
}
