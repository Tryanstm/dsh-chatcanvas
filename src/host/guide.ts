import {PROGRAM_HELP} from './program-help';
import {MUSIC_HELP} from './music-help';
import {visualWorkflowText} from './prompts.generated';
import {UI_HELP} from './ui-help';
export const CANVAS_GUIDE = visualWorkflowText+'\n'+`数据读取：用户消息里的 <dser-document schemaVersion="1"> 是该次提交的内容数据，属于输入传输格式。content 保留顺序、结构、文字样式与组件，layout 保留真实字号、颜色和字体。按用户样例排版时可用 document_publish.template 按 documentId 和块 path 复用样式。已提交内容用 canvas_read/document_read 读取；未发送草稿不可见。附带图片提供笔迹与视觉关系，结构提供对象、参数、布局和状态。不在普通回答复述内部协议。

层级：同一个 UI 应用的多个页面放在一个 UI document.pages 内，用 navigate 跳转，只展示当前页。复合 Canvas 能包含独立 UI/函数组件；外层编辑模式只调整整个组件的位置尺寸，进入 UI 组件才编辑其内部页面/元素/交互。单击模式执行交互，编辑模式选择/移动，用户可以随时切换，不必为试用另做一套界面。画布对象统一按层号排序：数值越大越靠前，第 2 层在第 1 层前方，同层后加入的对象在前方；文字、图形与组件规则一致。UI 内部的 CSS zIndex 保留浏览器语义，同值按子节点顺序绘制。

已发送作品只读，仍可平移、缩放、看点值、临时调参和操作 UI；修改可复制到输入框。canvas_question 返回选择、自由文字、完整画布和视觉预览，即使未改动也返回画布。

UI 使用 pages/state/programs，显式 owner 保留程序归属；运算、嵌套循环与判断、移动、音频、克隆均优先使用可双向转换的积木。UI 自绘坐标和图案，不嵌入数学组件、不联网；详细结构调用 renderer_help({topic:"ui"})，可用 ui_simulate 先检查逻辑。数学组件独立发布，采样范围与用户指定的分析域分开。
`;
export const RENDERER_HELP:Record<string,string>={
 ui:UI_HELP,program:PROGRAM_HELP,music:MUSIC_HELP,table:`一般对比与数据说明直接在普通回复中输出 Markdown 表格。需要可保存的电子表格文件时，使用当前环境已安装的 Office／电子表格工具。历史增强表格仅作为普通表格读取。`,
 canvas:`最小组合画布例子：
{"schemaVersion":1,"canvasId":"layout-1","title":"布局草案","mode":"readonly","revision":0,"objects":[{"id":"note","type":"text","x":30,"y":30,"width":220,"height":60,"rotation":0,"opacity":1,"z":0,"text":"请确认布局","fontSize":24,"color":"#4d6bfe","bold":true}],"assets":{},"preview":{"x":0,"y":0,"zoom":1,"rotation":0},"views":{},"status":"ready"}
canvas_publish({canvas}) 展示；canvas_question({canvas,question:"哪些位置需要调整？",options:[{label:"布局合适"},{label:"我已在画布标注修改"}]}) 提问。工具等待用户提交，不要用文档里一个普通按钮冒充提问。UI 对象在通用坐标/尺寸之外加 type:"ui",document:UI文档；函数对象加 type:"math",spec:数学结构。选中 UI 组件、进入后才编辑它的子元素和页面。手绘 geometry 使用 annotation:true；图片资产采用 data:image 或当前会话收到的 source 引用。`,
 math:`math_publish({spec:{dimension:2,items:[{id:"line",kind:"explicit",expression:"y=a*x+b",color:"#262626",width:2,dash:"solid",radius:2}],parameters:{a:1,b:0},range:{x:[-6,6],y:[-6,6],t:[0,6.283185]},grid:true,wireframe:false}})。implicit 用 x^2+y^2=4；三维 explicit 用 z=x^2+y^2；parametric 的 coordinates 用 t，parametricSurface 用 u,v。analysisRange:{axis:"x"|"y"|"z",min:数值|"-inf",max:数值|"inf"} 是用户固定分析域。constraints 保留点条件，parameterBindings 保留依赖，条件不足保留自由参数，矛盾则明确报错。`,
 document:`纯文本框 textBox（variant="plain"）仅含无格式段落文字，保留换行，不嵌套组件或其他框。写作框 textBox（variant="writing"）可包含段落、标题、列表与代码，支持整体复制。代码框仅含原样代码，不能嵌套文本框；请设置 language 以高亮。纯文本框使用 textBox，写作框使用 textBox.attrs.variant="writing"，支持整框复制与展开。画布文字是画布内 type:"text" 对象，不能用独立文字组件替代。document_publish({template:{documentId:"用户已提交文档ID",blocks:[{path:[1],text:"新标题"},{path:[2],text:"新副标题"},{path:[3],text:"新正文"}]}})。path 以 content.doc 为根，从零计数；跳过任务说明，按用户指定顺序引用样式。也可 content:[{type:"heading",attrs:{level:1},content:[{type:"text",text:"标题",marks:[{type:"bold"},{type:"textStyle",attrs:{fontSize:"32px",color:"#000000"}}]}]}]。来源图像使用 dser-image:<documentId>:<ordinal>。`
};
