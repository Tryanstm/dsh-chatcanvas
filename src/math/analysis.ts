import nerdamer from 'nerdamer';
import {numericalSlope} from './forms';
import {compileSafe,parseEquation} from './parser';
import type {MathSpec} from '../protocol';
type Item=MathSpec['items'][number];
import {parameterScope} from './scope';
export {parameterScope} from './scope';
function closed(expression:string,parameters:Record<string,number>){compileSafe(expression);return (nerdamer(expression) as any).evaluate(parameters).text();}
export function constrainItem(item:Item,points:NonNullable<Item['constraints']>){
 const parsed=parseEquation(item.expression||''),variables=parsed.parameters;if(!points.length)throw new Error('请先选择约束点');if(points.some(p=>p.role!=='curve'))throw new Error('一般解析式请使用曲线上点；焦点构造请使用椭圆工具');
 const residual=parsed.kind==='explicit'?`(${parsed.expression})-${parsed.lhs}`:parsed.expression;
 const equations=points.map(p=>(nerdamer(residual) as any).evaluate({x:p.x,y:p.y,...(p.z===undefined?{}:{z:p.z})}).text());
 if(!variables.length){if(equations.every(e=>Math.abs(Number((nerdamer(e) as any).evaluate().text()))<1e-9))return {branches:[{}],message:'全部点已满足解析式'};throw new Error('没有满足全部条件的图像');}
 const linear=equations.every(e=>variables.every(v=>{const d=(nerdamer.diff(e,v) as any);return !d.variables().some((k:string)=>variables.includes(k));}));
 const solved=nerdamer.solveSystem(equations,variables) as any;const branches:Record<string,string>[]=[];
 for(const row of solved.elements||[]){const bindings:Record<string,string>={};for(const [key,value]of row.entries()){const text=value.text();if(text!==key)bindings[key]=text;}branches.push(bindings);}
 if(!branches.length)throw new Error(linear?'没有满足全部条件的函数或方程':'尚未求出满足全部条件的图像；不代表已证明无解');
 return {branches,message:branches.length>1?'存在多组满足条件的解，请选择分支':Object.keys(branches[0]!).length<variables.length?'条件尚不足以唯一确定，保留自由参数与点约束':'已准确确定参数'};
}
export function analyze(spec:MathSpec,itemId:string,operation:string,otherId?:string,point?:{x:number;y:number;z?:number}){
 const item=spec.items.find(i=>i.id===itemId);if(!item?.expression)throw new Error('请先选择一个有解析式的图像');const eq=parseEquation(item.expression),scope=parameterScope(item,{...Object.fromEntries(eq.parameters.map(p=>[p,1])),...spec.parameters}),axis=spec.analysisRange?.axis||'x',range=spec.analysisRange||{axis:'x',min:'-inf',max:'inf'},domain=`${axis} ∈ [${range.min==='-inf'?'−∞':range.min}, ${range.max==='inf'?'+∞':range.max}]`;
 const variable=spec.dimension===2?'x':axis;let expression=closed(eq.expression,scope);
 if(operation==='point'){
  if(!point)throw new Error('请先将鼠标移到图像上的点');const evaluate=(value:string)=>Number((nerdamer(value) as any).evaluate(point).text());
  if(spec.dimension===3&&eq.lhs==='z'){const dx=nerdamer.diff(expression,'x').text(),dy=nerdamer.diff(expression,'y').text(),a=evaluate(dx),b=evaluate(dy),z=evaluate(expression);return {domain:'曲面当前点',text:`点 (${point.x}, ${point.y}, ${z})\n偏导 fx=${a}，fy=${b}\n法向量 (${-a}, ${-b}, 1)`,plane:`z=(${z})+(${a})*(x-(${point.x}))+(${b})*(y-(${point.y}))`,normal:['('+point.x+')-('+a+')*t','('+point.y+')-('+b+')*t','('+z+')+t'],complete:true};}
  if(eq.kind==='explicit'&&numericalSlope(item.expression!,point.x,scope)===undefined)return {domain:'曲线当前点',text:'当前点不可导或不在定义域内，不能确定唯一切线。',complete:false};
  const fx=nerdamer.diff(expression,'x').text(),fy=nerdamer.diff(expression,'y').text(),slope=eq.kind==='explicit'?evaluate(fx):-evaluate(fx)/evaluate(fy),y=eq.kind==='explicit'?evaluate(expression):point.y;if(eq.kind==='implicit'&&Math.abs(evaluate(fx))+Math.abs(evaluate(fy))<1e-10)return {domain:'曲线当前点',text:'此点的梯度为零，无法据此确定唯一切线。',complete:false};return {domain:'曲线当前点',text:`点 (${point.x}, ${y})\n斜率 / 导数：${slope}`,tangent:Number.isFinite(slope)?`y=(${y})+(${slope})*(x-(${point.x}))`:`x=${point.x}`,normal:Math.abs(slope)<1e-12?`x=${point.x}`:Number.isFinite(slope)?`y=(${y})-(${1/slope})*(x-(${point.x}))`:`y=${y}`,complete:true};
 }
 if(operation==='derivative'){if(eq.kind!=='explicit')throw new Error('隐式图像请使用选点信息中的隐式斜率');return {text:`${variable} 方向导数：${nerdamer.diff(expression,variable).text()}`,domain,complete:true};}
 if(operation==='intersection'){const other=spec.items.find(i=>i.id===otherId);if(!other?.expression)throw new Error('请选择另一条图像');const q=parseEquation(other.expression);if(eq.kind!=='explicit'||q.kind!=='explicit'){const residual=(parsed:ReturnType<typeof parseEquation>,parameters:Record<string,number>)=>closed(parsed.kind==='explicit'?`(${parsed.expression})-y`:parsed.expression,parameters);const params=parameterScope(other,{...Object.fromEntries(q.parameters.map(p=>[p,1])),...spec.parameters});const solved=nerdamer.solveSystem([residual(eq,scope),residual(q,params)],['x','y']) as any;const rows:string[]=[];for(const row of solved.elements||[]){const x=row.get('x'),y=row.get('y');if(!x||!y)continue;const coordinate=Number(row.get(axis)?.evaluate().text());if(Number.isFinite(coordinate)&&(range.min!=='-inf'&&coordinate<Number(range.min)||range.max!=='inf'&&coordinate>Number(range.max)))continue;rows.push(`x=${x.text()}，y=${y.text()}`);}return {domain,complete:false,text:rows.join('\n')||'此范围内未找到交点',note:'联立方程候选解；尚未证明已枚举全部交点。'};}const params=parameterScope(other,{...Object.fromEntries(q.parameters.map(p=>[p,1])),...spec.parameters});expression=`(${expression})-(${closed(q.expression,params)})`;}
 if(operation==='stationary'||operation==='extrema'){if(eq.kind!=='explicit')throw new Error('一般隐式方程请选点查看切线和斜率；当前驻点分析针对显式函数');expression=nerdamer.diff(expression,variable).text();}
 if(operation==='roots'&&eq.kind==='implicit'){expression=closed(expression,{[variable==='x'?'y':'x']:0});}
 const result=nerdamer.solve(expression,variable) as any,complete=!result.partial&&!result.unsolved&&result.solutionsType!=='numeric'&&result.solutionsType!=='mixed',values:string[]=[];let uncertain=false;
 for(const root of result.elements||[]){const text=root.text();if(text==='all'){values.push('全部实数（须满足原式定义域）');continue;}if(text.includes('_n')){values.push(`${variable} = ${text.replaceAll('_n','k')}，k ∈ Z${range.min==='-inf'&&range.max==='inf'?'':`，且 ${domain}`}`);continue;}const value=Number(root.evaluate().text());if(Number.isFinite(value)){const coordinate=axis==='y'&&spec.dimension===2?eq.evaluate({...scope,x:value}):value;if((range.min==='-inf'||coordinate>=Number(range.min)-1e-9)&&(range.max==='inf'||coordinate<=Number(range.max)+1e-9))values.push(`${variable} = ${text} ≈ ${Number(value.toPrecision(10))}${operation==='stationary'?`, y ≈ ${eq.evaluate({...scope,x:value})}`:''}`);}else if(!/\bi\b/.test(text)){values.push(`${variable} = ${text}（请核对实数定义域）`);uncertain=true;}}
 return {domain,complete:complete&&!uncertain,text:values.length?values.join('\n')+(operation==='stationary'?'\n这些是驻点候选；不一定都是极值。':''):complete?'此求解域内没有实数解':'此范围内未找到；尚未完成全域求解',note:complete?'符号求解结果；请留意原式定义域。':'求解未证明完整，不能据此断言不存在其他解。'};
}
