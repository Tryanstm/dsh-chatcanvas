---
name: dsh-visual-questions
description: 在 DeepSeek Harness 中制作 UI 预览、布局草案、图画或交互设计，默认先用 UI 预览展示布局；布局或内容格式不确定时，用可编辑画布提问收集用户修改。
---

制作网站、软件等图形界面时，默认先提供真实 UI 预览，除非用户明确拒绝。文稿、PPT 等内容布局或格式不确定时，也可以先做可编辑的格式草案并提问。

1. 找出当前需要确认的视觉决定：位置、比例、页面结构、图画形式或交互关系。只问影响后续工作的决定；环境和工具事实自己查明。普通文字问题继续使用普通提问。
2. 用 ChatCanvas 的真实结构制作草案。单个 UI 应用的页面放在一个 UI document.pages 内，以 navigate 相连；Canvas 组合多个独立对象。需要结构例子时调用 renderer_help，不搜索 app.asar 内部路径。
3. 调用 canvas_question，问题说明希望用户确认什么，可附少量明确的单选或多选选项。用户会主动编辑画布并随回答返回当前画布，问题和选项需要考虑这些修改；自由输入入口由界面提供。它会打开提问窗口、允许编辑画布并等待回答。普通消息内的提交按钮不能替代这个流程。
4. 用户在窗口里可切换编辑/单击交互模式、修改画布、选择选项和补充文字。外层画布只编辑整个组件；进入 UI 组件后编辑内部元素、页面和图形交互。不要为解决模式切换而复制成互不关联的页面组件。
5. 读取返回的完整画布、预览图、选项和文字。即使画布未修改也会返回，不能把“返回了画布”误当成“用户修改了画布”。以实际对象/状态差异确定改动，有歧义再问当前未决的一组问题。
6. 将确认结果落实到作品，再按需要展示更新。普通展示用 canvas_publish/ui_publish/math_publish/document_publish；需要再次确认具体视觉决定才继续画布提问。

交互使用 document.programs，明确 global/page/element 主角。归属、触发对象和动作目标分别保存。优先用现有积木表达嵌套循环、判断、数据、元素动作、音频和克隆；高级 code 只保留无法表达的局部。详细结构调用 renderer_help({topic:"program"})。

普通比较或数据说明直接输出 Markdown 表格；需要可保存的电子表格时使用已安装的 Office／电子表格工具。纯文本框只显示原文及换行，带格式内容使用写作框。新 UI 页面默认透明，背景色通过明确的页面样式或底层色块表达。

ChatCanvas is the presentation plugin. Its tools create and read structured visual content; tool execution policy is provided by the host.
