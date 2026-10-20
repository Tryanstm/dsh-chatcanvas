import React,{useMemo} from 'react';import {createLowlight,common} from 'lowlight';
const highlighter=createLowlight(common);
export function HighlightedCode({code,language}:{code:string;language:string}){const nodes=useMemo(()=>{if(code.length>60000||!highlighter.registered(language))return null;try{return highlighter.highlight(language,code).children;}catch(error){return null;}},[code,language]);
 const render=(node:any,index:number):React.ReactNode=>node.type==='text'?node.value:<span key={index} className={node.properties?.className?.join(' ')}>{node.children?.map(render)}</span>;
 return <code>{nodes?nodes.map(render):code}</code>;
}
