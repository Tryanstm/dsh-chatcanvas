import {TableSchema,newTable} from './table/model';
import { z } from 'zod';
import {MusicSchema,newMusic} from './music/model';
import {UIStateSchema,JSONSchema,assertUIState} from './ui/state';
import {compileBindings} from './ui/bindings';
import {validSVGTemplate} from './ui/svg';
import {OwnerSchema,ProgramSchema,validatePrograms} from './ui/blocks';

export const SCHEMA_VERSION = 1;
export const id = () => globalThis.crypto.randomUUID();
const finite = z.number().finite();
export const CameraSchema = z.object({ x: finite, y: finite, zoom: finite.min(.05).max(20), rotation: finite }).strict();
export const ActionSchema = z.object({ type: z.enum(['set', 'toggle', 'navigate', 'show', 'hide', 'increment','code','play','pause','reset']), key: z.string().max(100), value:JSONSchema.optional(),code:z.string().max(20000).optional() }).strict();
export type UIAction = z.infer<typeof ActionSchema>;
const MediaSchema=z.object({pivot:z.object({x:finite,y:finite}).strict().optional(),images:z.array(z.object({id:z.string(),name:z.string().max(100),scaleX:finite.positive().max(20).optional(),scaleY:finite.positive().max(20).optional(),rotation:finite.optional(),src:z.string().regex(/^data:image\/(png|jpeg|webp|gif);base64,[A-Za-z0-9+/=]+$/)}).strict()).max(40).default([]),sounds:z.array(z.object({id:z.string(),name:z.string().max(100),mime:z.enum(['audio/wav','audio/mpeg','audio/ogg','audio/mp4','audio/flac','audio/webm']),data:z.string().max(12000000).regex(/^data:audio\/(wav|mpeg|ogg|mp4|flac|webm);base64,[A-Za-z0-9+/=]+$/)}).strict()).max(30).default([])}).strict();
export type UIMedia=z.infer<typeof MediaSchema>;
export interface UINode { id: string; name?:string;group?:string;scroll?:{x:boolean;y:boolean;bars:'auto'|'show'|'hide'};media?:UIMedia; type: 'container'|'text'|'button'|'input'|'switch'|'slider'|'radio'|'checkbox'|'list'|'modal'|'image'|'shape'|'stroke'; text?: string; bind?: string; visible?: string; style?: Record<string,string|number>; actions?: UIAction[]; children?: UINode[]; options?: string[]; src?: string;shape?:string;path?:string;fill?:string;fillRule?:'nonzero'|'evenodd';points?:string;min?:number;max?:number;step?:number;rotation?:number;repeat?:{over:string;as:string;key?:string}; }
export const UINodeSchema: z.ZodType<UINode,z.ZodTypeDef,any> = z.lazy(() => z.object({ id: z.string().min(1).max(100),name:z.string().max(100).optional(),media:MediaSchema.optional(),group:z.string().max(100).optional(),scroll:z.object({x:z.boolean(),y:z.boolean(),bars:z.enum(['auto','show','hide'])}).strict().optional(),type: z.enum(['container','text','button','input','switch','slider','radio','checkbox','list','modal','image','shape','stroke']), text: z.string().max(10000).optional(), bind: z.string().max(300).optional(), visible: z.string().max(600).optional(), style: z.record(z.union([z.string().max(600),finite])).optional(), actions: z.array(ActionSchema).max(12).optional(), children: z.array(UINodeSchema).max(150).optional(), options: z.array(z.string()).max(100).optional(), src: z.string().optional(),shape:z.string().max(30).optional(),path:z.string().max(100000).refine(v=>validSVGTemplate(v,'path'),'SVG 路径或绑定格式不正确').optional(),fill:z.string().max(100).optional(),fillRule:z.enum(['nonzero','evenodd']).optional(),points:z.string().max(20000).refine(v=>validSVGTemplate(v,'points'),'SVG 顶点或绑定格式不正确').optional(),min:finite.optional(),max:finite.optional(),step:finite.positive().optional(),rotation:finite.optional(),repeat:z.object({over:z.string().max(600),as:z.string().regex(/^[A-Za-z_][A-Za-z0-9_]*$/),key:z.string().max(100).optional()}).strict().optional() }).strict());
export const UI_EVENTS=['click','hover','change','contextmenu','input','pointerdown','pointermove','pointerup','pointercancel','wheel','keydown','keyup','tick'] as const;
export const UIEventSchema=z.object({id:z.string().max(100),owner:OwnerSchema.optional(),nodeIds:z.array(z.string().max(100)).min(1).max(100),event:z.enum(UI_EVENTS),actions:z.array(ActionSchema).max(30)}).strict();
export type UIEventRule=z.infer<typeof UIEventSchema>;
export const UISchema = z.object({ pages: z.array(z.object({ id:z.string(), name:z.string(),viewport:z.object({x:finite,y:finite}).strict().optional(), root:UINodeSchema }).strict()).min(1).max(20), initialPage:z.string(), state:UIStateSchema,programs:z.array(ProgramSchema).max(200).optional(), code:z.string().max(20000).optional(),events:z.array(UIEventSchema).max(100).optional(),clock:z.object({fps:z.number().int().min(1).max(60).default(30),autoplay:z.boolean().default(false)}).strict().optional() }).strict();
export type UIDocument = z.infer<typeof UISchema>;
export const UIViewSchema=z.object({page:z.string().max(100),state:UIStateSchema,runtime:z.string().max(196608).optional(),playback:z.object({playing:z.boolean(),elapsed:z.number().finite().min(0)}).strict().optional()}).strict();
export type UIViewState=z.infer<typeof UIViewSchema>;
export const ConstraintPointSchema=z.object({x:finite,y:finite,z:finite.optional(),role:z.enum(['curve','focus','center']).default('curve')});
export const MathItemSchema = z.object({ id:z.string(), kind:z.enum(['explicit','implicit','parametric','parametricSurface','plane','cube','sphere','cylinder','line']), expression:z.string().max(2000).optional(), coordinates:z.array(z.string().max(2000)).max(3).optional(), color:z.string().default('#4d6bfe'), width:finite.min(.5).max(10).default(2), dash:z.enum(['solid','dash','dot']).default('solid'), radius:finite.min(.01).max(100).default(2),constraints:z.array(ConstraintPointSchema).max(100).optional(),parameterBindings:z.record(z.string().max(2000)).optional() }).strict();
export const MathSchema = z.object({ dimension:z.union([z.literal(2),z.literal(3)]), items:z.array(MathItemSchema).max(30), parameters:z.record(finite), range:z.object({x:z.tuple([finite,finite]), y:z.tuple([finite,finite]), t:z.tuple([finite,finite]),z:z.tuple([finite,finite]).optional()}), grid:z.boolean(), wireframe:z.boolean(),parameterDomains:z.record(z.object({min:finite,max:finite,speed:finite.optional()})).optional(),analysisRange:z.object({axis:z.enum(['x','y','z']),min:z.union([finite,z.literal('-inf')]),max:z.union([finite,z.literal('inf')])}).optional() }).strict();
export type MathSpec = z.infer<typeof MathSchema>;
const base = { id:z.string().min(1).max(100), x:finite, y:finite, width:finite.min(1).max(100000), height:finite.min(1).max(100000), rotation:finite, opacity:finite.min(0).max(1), z:finite,annotation:z.boolean().optional() };
// Fabric owns geometry; only allowlisted, finite, JSON geometry is revived.
export const ObjectSchema = z.discriminatedUnion('type',[
 z.object({...base,type:z.literal('geometry'), geometry:z.enum(['rect','square','roundrect','circle','ellipse','line','arrow','triangle','polygon','path']),fill:z.string(),stroke:z.string(),erasures:z.array(z.discriminatedUnion('kind',[z.object({kind:z.literal('ellipse'),x:finite,y:finite,rx:finite.positive(),ry:finite.positive()}).strict(),z.object({kind:z.literal('polygon'),points:z.array(z.tuple([finite,finite])).length(4)}).strict()])).max(2000).optional(),strokeWidth:finite.min(0).max(100),radii:z.tuple([finite,finite,finite,finite]).optional(),points:z.array(z.tuple([finite,finite])).max(20000).optional(),path:z.array(z.array(z.union([z.string(),finite]))).max(20000).optional()} ).strict(),
 z.object({...base,type:z.literal('text'),text:z.string().max(100000),fontSize:finite.min(8).max(200),color:z.string(),bold:z.boolean().default(false)} ).strict(),
 z.object({...base,type:z.literal('image'),assetId:z.string()} ).strict(),
 z.object({...base,type:z.literal('math'),spec:MathSchema} ).strict(),
 z.object({...base,type:z.literal('music'),spec:MusicSchema}).strict(),
 z.object({...base,type:z.literal('table'),spec:TableSchema}).strict(),
 z.object({...base,type:z.literal('ui'),document:UISchema,viewState:UIViewSchema.optional()} ).strict()
]);
export const CanvasSchema = z.object({schemaVersion:z.literal(1),canvasId:z.string().min(1).max(100),title:z.string().max(200),mode:z.enum(['readonly','editable']),revision:z.number().int().min(0),objects:z.array(ObjectSchema).max(500),assets:z.record(z.object({mime:z.enum(['image/png','image/jpeg','image/webp','image/gif']),data:z.string().max(12000000).optional(),source:z.object({documentId:z.string().max(100),ordinal:z.number().int().min(0).max(100)}).strict().optional()}).strict()),preview:CameraSchema,previewSize:z.object({width:finite.positive(),height:finite.positive()}).strict().optional(),views:z.record(CameraSchema),status:z.enum(['creating','ready','failed','cancelled']),error:z.object({code:z.string(),message:z.string()}).strict().optional(),question:z.object({id:z.string(),text:z.string()}).strict().optional(),originId:z.string().optional()}).strict();
export type CanvasDocument = z.infer<typeof CanvasSchema>;
export type CanvasObject = CanvasDocument['objects'][number];
export type Camera = z.infer<typeof CameraSchema>;
const standaloneBase={schemaVersion:z.literal(1),id:z.string().min(1).max(100),title:z.string().max(200),mode:z.enum(['readonly','editable'])};
export const MathDocumentSchema=z.object({...standaloneBase,type:z.literal('dser-math'),spec:MathSchema}).strict();
export const UIDesignSchema=z.object({...standaloneBase,type:z.literal('dser-ui'),width:z.number().int().min(10).max(100000),height:z.number().int().min(10).max(100000),document:UISchema,viewState:UIViewSchema.optional()}).strict();
export const TableDocumentSchema=z.object({...standaloneBase,type:z.literal('dser-table'),width:finite.min(100).max(10000).default(640),height:finite.min(80).max(10000).default(320),spec:TableSchema}).strict();
export type TableDocument=z.infer<typeof TableDocumentSchema>;
export function newTableDocument():TableDocument{return {schemaVersion:1,type:'dser-table',id:id(),title:'表格',mode:'editable',width:640,height:320,spec:newTable()};}
export const MusicDocumentSchema=z.object({...standaloneBase,type:z.literal('dser-music'),spec:MusicSchema}).strict();
export const VisualTextDocumentSchema=z.object({...standaloneBase,type:z.literal('dser-text'),width:finite.min(20).max(10000),height:finite.min(20).max(10000),text:z.string().max(100000),fontSize:finite.min(8).max(200),color:z.string().regex(/^#[0-9a-f]{6}$/i),bold:z.boolean().default(false)}).strict();
export type MusicDocument=z.infer<typeof MusicDocumentSchema>;
export type VisualTextDocument=z.infer<typeof VisualTextDocumentSchema>;
export function newMusicDocument():MusicDocument{return {schemaVersion:1,type:'dser-music',id:id(),title:'音乐作品',mode:'editable',spec:newMusic()};}
export function newVisualTextDocument():VisualTextDocument{return {schemaVersion:1,type:'dser-text',id:id(),title:'文字',mode:'editable',width:360,height:160,text:'',fontSize:20,color:'#262626',bold:false};}
export type MathDocument=z.infer<typeof MathDocumentSchema>;
export type UIDesign=z.infer<typeof UIDesignSchema>;
export function newMathDocument(expressions:string[]=[],dimension:2|3=2):MathDocument{return {schemaVersion:1,type:'dser-math',id:id(),title:dimension===3?'三维函数图像':'函数图像',mode:'editable',spec:mathSpec(expressions,dimension)};}
export function newUIDesign(width=400,height=300):UIDesign{return {schemaVersion:1,type:'dser-ui',id:id(),title:'界面预览',mode:'editable',width,height,document:{initialPage:'home',state:{},pages:[{id:'home',name:'页面一',root:{id:id(),type:'container',style:{position:'relative',width:'100%',height:'100%'},children:[]}}]}};}
/** Raster adapters reuse the scene exporter; the editor nodes remain independent components. */
export function standaloneScene(value:MathDocument|UIDesign|MusicDocument|VisualTextDocument|TableDocument):CanvasDocument{const doc=emptyCanvas(value.title);doc.canvasId=value.id;doc.mode=value.mode;doc.preview={x:0,y:0,zoom:1,rotation:0};doc.objects=value.type==='dser-math'?[{...objectBase(0,0,480,480),type:'math',spec:value.spec}]:value.type==='dser-table'?[{...objectBase(0,0,value.width,value.height),type:'table',spec:value.spec}]:value.type==='dser-music'?[{...objectBase(0,0,720,400),type:'music',spec:value.spec}]:value.type==='dser-text'?[{...objectBase(0,0,value.width,value.height),type:'text',text:value.text,fontSize:value.fontSize,color:value.color,bold:value.bold}]:[{...objectBase(0,0,value.width,value.height),type:'ui',document:value.document,viewState:value.viewState}];return doc;}
export function validateCanvas(raw: unknown):CanvasDocument {
 if (JSON.stringify(raw).length>16000000) throw new Error('CANVAS_TOO_LARGE: 超过 16 MB');
 const doc=CanvasSchema.parse(raw),ids=new Set<string>();
 for(const o of doc.objects){if(ids.has(o.id))throw new Error('DUPLICATE_OBJECT_ID');ids.add(o.id);
  if(o.type==='image'&&!doc.assets[o.assetId])throw new Error('ASSET_MISSING');
  if(o.type==='ui'){validateUI(o.document);if(o.viewState&&!o.document.pages.some(p=>p.id===o.viewState!.page))throw new Error('INVALID_UI_VIEW_PAGE');}
  if(o.type==='math'&&[o.spec.range.x,o.spec.range.y,o.spec.range.t].some(r=>r[0]>=r[1]))throw new Error('INVALID_MATH_RANGE');
 }
 for(const a of Object.values(doc.assets)){if(!a.data&&!a.source)throw new Error('ASSET_DATA_MISSING');if(a.data&&!a.data.startsWith(`data:${a.mime};base64,`))throw new Error('UNSAFE_IMAGE_ASSET');}
 return doc;
}
export function validateUI(doc:UIDocument){
 if(JSON.stringify(doc).length>15500000)throw Error('界面结构和媒体合计不能超过15.5MB');
 let count=0;const ids=new Set<string>(),pages=new Set(doc.pages.map(p=>p.id)),issues:z.ZodIssue[]=[];
 const issue=(path:(string|number)[],message:string)=>issues.push({code:'custom',path,message});
 try{assertUIState(doc.state);}catch(e){issue(['state'],String(e));}
 if(pages.size!==doc.pages.length||!pages.has(doc.initialPage))issue(['initialPage'],'INVALID_UI_PAGE：页面重复或初始页面不存在');
 const visit=(n:UINode,depth:number,path:(string|number)[])=>{if(++count>400||depth>15){issue(path,'UI_COMPLEXITY_OR_DUPLICATE_ID：最多400元素、15层');return;}if(ids.has(n.id))issue([...path,'id'],'UI_COMPLEXITY_OR_DUPLICATE_ID：元素 ID 重复');ids.add(n.id);
  for(const [k,v]of Object.entries(n.style||{}))if(!/^[a-zA-Z]+$/.test(k)||/[\\]|url\s*\(|var\s*\(|expression|javascript|@import/i.test(String(v)))issue([...path,'style',k],'UNSAFE_UI_STYLE');
  if(n.src&&!/^data:image\/(png|jpeg|webp|gif);base64,/.test(n.src)&&!/^dser-image:[\w-]{1,100}:\d{1,3}$/.test(n.src))issue([...path,'src'],'UNSAFE_UI_IMAGE');
  if(n.min!==undefined&&n.max!==undefined&&n.min>=n.max)issue([...path,'max'],'滑条最大值必须大于最小值');
  if(n.repeat&&['state','Math','index','__proto__','constructor','prototype'].includes(n.repeat.as))issue([...path,'repeat','as'],'非法重复项名称');
  (n.actions||[]).forEach((a,i)=>{if(a.value!==undefined)try{assertUIState({value:a.value});}catch(e){issue([...path,'actions',i,'value'],String(e));}if(a.type==='navigate'&&!pages.has(a.key))issue([...path,'actions',i,'key'],'UI_PAGE_MISSING：导航 key 必须是现有页面 ID');});
  n.children?.forEach((c,i)=>visit(c,depth+1,[...path,'children',i]));
 };doc.pages.forEach((p,i)=>visit(p.root,0,['pages',i,'root']));
 for(const key of Object.keys(doc.state))if(['__proto__','prototype','constructor'].includes(key)||key.startsWith('__dser'))issue(['state',key],'非法界面状态名称');
 doc.events?.forEach((rule,i)=>{if(rule.nodeIds.some(key=>!ids.has(key)))issue(['events',i,'nodeIds'],'交互规则引用了不存在的元素');rule.actions.forEach((a,j)=>{if(a.type==='navigate'&&!pages.has(a.key))issue(['events',i,'actions',j,'key'],'交互规则引用了不存在的页面；navigate 使用 key');if(a.value!==undefined)try{assertUIState({value:a.value});}catch(e){issue(['events',i,'actions',j,'value'],String(e));}});});
 try{validatePrograms(doc.programs||[],ids,pages);}catch(e){issue(['programs'],String(e));}try{compileBindings(doc);}catch(e){issue(['bindings'],String(e));}
 if(issues.length)throw new z.ZodError(issues);
}
export function emptyCanvas(title='新画布'):CanvasDocument{return {schemaVersion:1,canvasId:id(),title,mode:'editable',revision:0,objects:[],assets:{},preview:{x:20,y:20,zoom:1,rotation:0},views:{},status:'ready'};}
export function objectBase(x=40,y=40,width=340,height=260){return {id:id(),x,y,width,height,rotation:0,opacity:1,z:0};}
export function copyCanvas(doc:CanvasDocument,editable=true):CanvasDocument{
 const copy=structuredClone(doc);copy.originId=doc.canvasId;copy.canvasId=id();copy.mode=editable?'editable':doc.mode;copy.revision=0;
 // UI IDs are local to one iframe; preserving them keeps page links and code handlers valid.
 copy.objects.forEach(o=>{o.id=id();});return validateCanvas(copy);
}
export function mathSpec(expressions=['y=sin(x)'],dimension:2|3=2):MathSpec{return {dimension,items:expressions.map((expression,i)=>({id:id(),kind:'explicit',expression,color:['#4d6bfe','#f18c47','#2ca58d','#9562cc'][i%4]!,width:2,dash:'solid',radius:2})),parameters:{},range:{x:[-6,6],y:[-6,6],t:[0,Math.PI*2]},grid:true,wireframe:false};}
export function defaultUI():UIDocument {return {initialPage:'home',state:{count:0,enabled:true,name:''},pages:[{id:'home',name:'第一页',root:{id:id(),type:'container',style:{padding:'24px',display:'flex',flexDirection:'column',gap:'14px'},children:[{id:id(),type:'text',text:'交互式设计',style:{fontSize:'22px',fontWeight:600}},{id:id(),type:'input',bind:'name',text:'输入名称'},{id:id(),type:'switch',bind:'enabled',text:'启用通知'},{id:id(),type:'button',text:'打开第二页',actions:[{type:'navigate',key:'detail'}]}]}},{id:'detail',name:'第二页',root:{id:id(),type:'container',style:{padding:'24px'},children:[{id:id(),type:'text',text:'欢迎，{{name}}'},{id:id(),type:'button',text:'返回',actions:[{type:'navigate',key:'home'}]}]}}]};}
