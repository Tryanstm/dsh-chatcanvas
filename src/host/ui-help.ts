export const UI_HELP=`UI 预览展示本地交互，不联网，不嵌入独立数学组件；坐标与曲线可用 shape/stroke 自绘。
ui_publish({title:"界面预览",width:640,height:420,document:{initialPage:"home",state:{count:0},pages:[{id:"home",name:"首页",root:{id:"root",type:"container",style:{position:"relative",width:"100%",height:"100%"},children:[{id:"button",name:"增加按钮",type:"button",text:"增加",style:{position:"absolute",left:40,top:40}},{id:"label",type:"text",text:"次数：{{count}}"}]}}],programs:[{id:"increase",owner:{kind:"element",id:"button"},trigger:{type:"click",target:"button"},body:[{id:"plus-one",kind:"change",scope:"global",name:"count",value:1}]}]}})。
pages 为同一应用的页面，用 navigate 积木跳转。节点 id 在整个应用唯一；node.name 为人类可读名称。程序详见 renderer_help({topic:"program"})，音乐详见 topic:"music"。高级代码仅为最后的局部回退。
UI 属性栏使用页面中心数学坐标（右正、上正），初始 CSS style.left/top 仍是父容器左上角像素。move/moveBy 积木使用数学坐标。宽高为设计像素，全屏查看倍率不修改设计坐标。父子关系与组合不同，组合保留各元素 ID 和程序归属。
state 支持 JSON 数组和对象，最多100根字段、深度6、64KiB。绑定用 {{count}}、{{items.0.title}}、{{= Math.round(angle) }}；visible 用状态路径或 =count>0。SVG path/points 同样支持这些绑定，解析后仅允许合法 SVG 数字路径。禁止脚本、任意函数或 URL。原始 style 中不用 url/var/反斜杠。
repeat:{over:"items",as:"item",key:"item.id"} 重复模板；key 必须是唯一标量。输入框 bind:"name"，滑块 type:"slider",bind:"speed",min:0,max:10,step:.1；input 实时更新，change 为确认输入或拖动结束。scroll:{x:true,y:true,bars:"auto"|"show"|"hide"} 分开控制能否滚动及滚动条展示。
元素 media 保存它自己的 images/sounds 和图像 pivot；图像、音频均为安全的内嵌资产。图片也可使用当前会话的 dser-image:<documentId>:<ordinal> 引用。声音播放由受限桥接完成。
programs.trigger.type:"tick" 表示每帧执行；"always" 表示持续运行的一条协作程序。模拟事件 id 是目标元素的原始 id，不是事件编号，不能把元素 ID 放到页面 ID；例如 events:[{id:"button-id",type:"click"},{type:"tick",time:1,dt:0.1}]。无目标的全局事件可省略 id。
发布前先 ui_simulate({document,events:[]}) 进行结构和绑定预检；通过后再在同一文档上模拟不同事件，遇到校验错误先修正文档。模拟返回状态、页面和效果命令；真实点击命中、焦点、音频和视觉布局仍需在预览验收。不要以空 ui_publish 参数探测 schema。`;
