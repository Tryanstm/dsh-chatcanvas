const patterns={path:/^[MmLlHhVvCcSsQqTtAaZz0-9eE+.,\s-]*$/,points:/^[0-9eE+.,\s-]*$/};
/** Templates are compiled by the same restricted binding compiler as text and styles. */
export function validSVGTemplate(value:string,kind:'path'|'points') {return patterns[kind].test(value.replace(/\{\{(?:=\s*)?[^{}]+\}\}/g,''));}
export function safeSVGValue(value:unknown,kind:'path'|'points'):string {const text=String(value??'');if(text.length>(kind==='path'?100000:20000)||!patterns[kind].test(text))throw new Error(`SVG ${kind} 绑定结果不是有效的数字路径`);return text;}
