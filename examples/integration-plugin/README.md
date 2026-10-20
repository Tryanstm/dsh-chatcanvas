# 完整接入模板

先安装对话画布 · ChatCanvas，再构建并安装本模板。模板提供 enhancedRendererIntegration 浏览器服务；主插件通过自己的 Slot 传入 container、identity 和已选择的 bridge。它不会新建另一套分支系统或抢占现有界面。

```sh
node build.mjs
dsh plugin --profile YOUR_PROFILE add /absolute/path/integration-plugin
```

主插件使用：
```js
export const inject=['enhancedRendererIntegration']
const handle=ctx.get('enhancedRendererIntegration').mount(container,{
 viewId:'floating-7',sessionId:realSessionId,branchId:branchId,region:'floating'
},bridge)
handle.setActive(false) // bridge.notify 必须通知订阅者
handle.dispose()
```

bridge 必须提供 snapshot()/subscribe()/renderNative()。可选 attach()/attachmentIds()/stop()/retry()/openModelConfig()/notify()。发送已经使用对话画布 · ChatCanvas正式接口，包含图像附件和历史恢复。调用方仍需在成功提交后同步自己的附件选择状态。完整契约见主项目 docs/INTEGRATION.md。

此目录是可安装的集成项目模板，未自动安装到用户的生产 dsh-chat-flow。

