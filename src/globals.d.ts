declare module '*.css' {const css:string;export default css;}
declare module 'plotly.js-dist-min' {const plotly:any;export default plotly;}
declare module '@deepseek-ai/dsh-client-ui-primitives' {export function writeClipboard(text:string):Promise<boolean>;export const MarkdownText:React.ComponentType<any>;export const CodeBlock:React.ComponentType<any>;export const FishLogo:React.ComponentType<any>;export const TextShimmer:React.ComponentType<any>;}
declare module '../../vendor/native-chat.generated.js';
declare module '*.md' {const value:string;export default value;}
