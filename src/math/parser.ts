import {normalizeMathInput} from './normalize';
import { parse, type MathNode } from 'mathjs';
const funcs=new Set(['sin','cos','tan','asin','acos','atan','atan2','sinh','cosh','tanh','sqrt','abs','exp','log','log10','floor','ceil','round','min','max','pow','sign']);
const allowed=new Set(['ConstantNode','SymbolNode','OperatorNode','FunctionNode','ParenthesisNode']);
export function normalizeExpression(text:string):string{
 let s=normalizeMathInput(text).trim().replace(/[XYZ]/g,c=>c.toLowerCase()).replace(/\$|\\\[|\\\]|\\\(|\\\)/g,'').replace(/\\left|\\right/g,'').replace(/\\(?:cdot|times)/g,'*').replace(/\\pi/g,'pi').replace(/\\(sin|cos|tan|log|exp)/g,'$1').replace(/²/g,'^2').replace(/³/g,'^3').replace(/π/g,'pi').replace(/等于/g,'=').replace(/加/g,'+').replace(/减/g,'-').replace(/乘以/g,'*').replace(/除以/g,'/').replace(/平方/g,'^2').replace(/立方/g,'^3').replace(/−/g,'-');
 for(let i=0;i<8;i++){const next=s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g,'(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g,'sqrt($1)').replace(/\^\{([^{}]*)\}/g,'^($1)');if(next===s)break;s=next;}
 if(/[\\{}]/.test(s))throw new Error('不支持或不完整的 LaTeX 表达式');
 // Conventional single-letter coefficients next to coordinates are products.
 // Named parameters (amplitude, rate_1, etc.) and function names stay intact.
 s=s.replace(/[A-Za-z]+/g,word=>funcs.has(word)||['pi','e','constructor','prototype','import'].includes(word)?word:/^(?:[a-wA-W][xyz]|[xyz][a-wA-W]|[A-W]{2,3})$/.test(word)?[...word].join('*'):word);
 return s;
}
export function compileSafe(expression:string,variables:string[]=['x','y','z','t','u','v']):{node:MathNode;evaluate:(scope:Record<string,number>)=>number;parameters:string[]}{
 const normalized=normalizeExpression(expression);if(normalized.length>2000)throw new Error('表达式过长');
 const node=parse(normalized),parameters=new Set<string>();let count=0;
 node.traverse(n=>{if(++count>180||!allowed.has(n.type))throw new Error('只允许标量数学表达式');
  if(n.type==='FunctionNode'){const name=(n as any).fn.name as string;if(!funcs.has(name))throw new Error(`不支持函数 ${name}`);}
  if(n.type==='SymbolNode'){const name=(n as any).name as string;if(!funcs.has(name)&&!variables.includes(name)&&!['pi','e'].includes(name)){if(!/^[a-zA-Zα-ωΑ-Ω][a-zA-Z0-9_α-ωΑ-Ω]{0,15}$/.test(name)||['constructor','prototype','__proto__','import'].includes(name))throw new Error('非法参数名');parameters.add(name);}}
 });const compiled=node.compile();return {node,parameters:[...parameters],evaluate(scope){const n=compiled.evaluate(new Map(Object.entries(scope)));return typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<1e8?n:NaN;}};
}
export function parseEquation(text:string){const s=normalizeExpression(text),parts=s.split('=');if(parts.length!==2||!parts[0]?.trim()||!parts[1]?.trim())throw new Error('请输入明确的方程，例如 y=2x+1');const lhs=parts[0].trim(),rhs=parts[1].trim();
 const dimension:2|3=lhs==='z'||/\bz\b/.test(s)?3:2;
 const explicit=['y','z'].includes(lhs);const expression=explicit?rhs:`(${lhs})-(${rhs})`;const compiled=compileSafe(expression);return {source:s,lhs,expression,dimension,kind:explicit?'explicit' as const:'implicit' as const,...compiled};
}
export interface FormulaMatch {text:string;from:number;to:number;dimension:2|3}
// Scan candidate equations and let the AST reject prose; positions remain original-text offsets.
export function extractFormulas(text:string):FormulaMatch[]{
 const result:FormulaMatch[]=[];const start=/(?:[+-]?\d*(?:\.\d+)?\s*[xyz](?:[²³]|\^\d)?\s*(?:=|等于|[+\-]))/gi;let m:RegExpExecArray|null;
 while((m=start.exec(text))){let end=m.index;while(end<text.length){if(/[，,；;。\n]/.test(text[end]!))break;if(/[\u4e00-\u9fff]/.test(text[end]!)){const numeral=/^[零〇一二两三四五六七八九十百千万亿点]+/.exec(text.slice(end))?.[0];const word=numeral||['等于','加','减','乘以','除以','平方','立方','乘','除'].find(w=>text.startsWith(w,end));if(!word)break;end+=word.length;}else end++;}
  let candidate=text.slice(m.index,end).trimEnd();let parsed;while(candidate.length){try{parsed=parseEquation(candidate);break;}catch{const cut=candidate.lastIndexOf(' ');if(cut<0)break;candidate=candidate.slice(0,cut).trimEnd();}}
  if(parsed){result.push({text:candidate,from:m.index,to:m.index+candidate.length,dimension:parsed.dimension});start.lastIndex=m.index+candidate.length;}else start.lastIndex=m.index+m[0].length;
 }return result;
}
