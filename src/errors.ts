/** Decode host error envelopes once, preserving useful paths without dumping JSON into a card. */
export function readableError(input:unknown):{summary:string;details:string;fields:string[]} {
 const seen=new Set<unknown>();const fields:string[]=[];const messages:string[]=[];
 const visit=(value:any,depth=0)=>{if(depth>8||value==null||seen.has(value))return;if(typeof value==='object')seen.add(value);
  if(value instanceof Error){visit(value.message,depth+1);return;}
  if(typeof value==='string'){const text=value.replace(/^Error:\s*/, '').trim();try{visit(JSON.parse(text),depth+1);return;}catch{}const start=text.indexOf('[');if(start>=0&&text.endsWith(']')){try{visit(JSON.parse(text.slice(start)),depth+1);return;}catch{}}if(text)messages.push(text);return;}
  if(Array.isArray(value)){value.forEach(v=>visit(v,depth+1));return;}
  if(value.path&&value.code){const path=value.path.map((p:any)=>typeof p==='number'?`[${p}]`:String(p)).join('.').replace(/\.\[/g,'[');const hint=value.code==='invalid_type'?`需要 ${value.expected}${value.received==='undefined'?'，当前缺少此项':''}`:value.validation==='regex'?'格式不正确':value.message||value.code;fields.push(`${path||'输入'}：${hint}`);return;}
  if(value.content)visit(value.content,depth+1);else if(value.text)visit(value.text,depth+1);else if(value.message)visit(value.message,depth+1);else messages.push(JSON.stringify(value));
 };
 visit(input);const details=[...fields,...messages].join('\n')||'未知错误';return {summary:fields.length?`输入数据有 ${fields.length} 处需要调整：${fields.slice(0,2).join('；')}`:messages[0]?.split('\n')[0]?.slice(0,220)||'生成未完成，请查看详情',details:details.slice(0,24000),fields};
}
