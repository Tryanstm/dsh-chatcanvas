import {derivative,simplify} from 'mathjs';
import {compileSafe,parseEquation} from './parser';
/** Restrict reverse conversion to equations affine in y with a proven nonzero constant coefficient. */
export function equationForms(source:string,point?:{x:number;y:number}){const eq=parseEquation(source),residual=eq.kind==='explicit'?`(${eq.expression})-(${eq.lhs})`:eq.expression,result:{name:string;expression:string}[]=[{name:'原输入形式',expression:source}];if(eq.dimension!==2)return result;
 const implicit=simplify(residual).toString();result.push({name:'隐式方程／一般式',expression:implicit+'=0'});
 let explicit=eq.kind==='explicit'?eq.expression:undefined;
 if(!explicit)try{const dy=simplify(derivative(residual,'y')).toString(),compiled=compileSafe(dy);if(!compiled.parameters.length&&!/[xyz]/.test(dy)){const a=compiled.evaluate({});if(Number.isFinite(a)&&Math.abs(a)>1e-12){const constant=simplify(residual,{y:0}).toString();explicit=simplify(`-(${constant})/(${dy})`).toString();}}}catch{}
 if(explicit){result.push({name:'函数形式／斜截式（直线）',expression:'y='+explicit});try{const dx=simplify(derivative(explicit,'x')).toString(),k=compileSafe(dx);if(point&&!k.parameters.length&&!/[xyz]/.test(dx)){const slope=k.evaluate({}),y=compileSafe(explicit).evaluate({x:point.x});if(Number.isFinite(slope)&&Number.isFinite(y))result.push({name:'点斜式',expression:`y-(${y})=(${slope})*(x-(${point.x}))`});}}catch{}}
 return result.filter((v,i,all)=>all.findIndex(a=>a.name===v.name)===i);
}
export function numericalSlope(source:string,x:number,parameters:Record<string,number>){const eq=parseEquation(source);if(eq.kind!=='explicit'||eq.dimension!==2)return undefined;const h=1e-5*(1+Math.abs(x)),y=eq.evaluate({...parameters,x}),left=(y-eq.evaluate({...parameters,x:x-h}))/h,right=(eq.evaluate({...parameters,x:x+h})-y)/h;if(![left,right,y].every(Number.isFinite)||Math.abs(left-right)>1e-3*Math.max(1,Math.abs(left),Math.abs(right)))return undefined;return (left+right)/2;}
