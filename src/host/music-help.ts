export const MUSIC_HELP=`music_publish({title,spec}) 发布独立音乐创作；组合画布的 music 对象使用同一个 spec。
spec:{bpm:120,timeSignature:[4,4],quantize:0.25,defaultLength:1,tracks:[{id:"piano",name:"钢琴",instrument:0,channel:0,volume:.8,muted:false,notes:[{id:"C4",pitch:60,start:0,duration:1,velocity:.75,sustain:0,reverb:0}]}]}。
start/duration/sustain 以四分音符拍为单位；4/4 是拍号，不是每个音符长度。pitch 为 MIDI 0–127，60 为中央 C；velocity/reverb 为0–1。默认音长和量化步长独立。BPM=每分钟四分音符数。tempos:[{beat,bpm}] 保留变速；signatures:[{beat,value:[分子,分母]}] 保留变拍。end 为可选停止符拍位置；无停止符到最后一音结束。
GM 乐器从0编号：0钢琴、24尼龙吉他、10八音盒、48弦乐、40小提琴、73长笛。音轨各有 instrument；音符可选 instrument 覆盖。实时试听和 WAV 使用本地合成音色，不宣称是商业采样钢琴。每轨最多5000音符、作品总计5000、最多32轨。
用户单击空白创建音符，拖空白平移时间和音域；滚轮在主区横向滚动，右侧音阶区纵向滚动。拖音符主体移动，拖两端缩短或拉长；最小为量化一步。选中音符后底栏修改它，否则修改后续音符默认值。画布外层编辑仅修改整个音乐组件视窗，进入放大音乐组件再修改音符。
导入 MIDI 与 dser-music-project 工程无需模型；MIDI含音符、乐器、速度、拍号、控制器。工程格式为 {format:"dser-music-project",version:1,title,spec}，保留稳定 ID 与额外效果。可导出 MIDI、WAV 和工程。MIDI 不保证保留本组件合成混响等全部音色效果；完整往返使用工程。WAV 导出单次最多10分钟。
读取用户的音乐用 document_read/canvas_read 查看精确音符、音轨、时值和效果，保留无关音符与 ID，只修改需要的部分，再重新发布。结构数据不代表你已聆听录音。普通聊天模型没有可靠的复调录音→音符接口时，不承诺直接把 MP3/WAV 转为准确乐谱；用户可先用专用转录器生成 MIDI 再导入。`;
