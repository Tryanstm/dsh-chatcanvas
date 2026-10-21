# 安装、更新和回退

[English](INSTALL.md) | [简体中文](INSTALL.zh-CN.md)

## 准备

先启动过一次受支持版本的 Harness。已验证的集成目标为 0.2.0-rc.2、0.2.1-rc.2；Windows 有辅助安装脚本，其他系统尚未验证。

当前 npm 测试版为 `dsh-chatcanvas@1.4.0-rc.13`。Releases 中保留旧版 rc.12 编译包。下载的 `.tgz` 保持压缩状态；不要双击运行，也不要选择自动生成的 Source code 源码归档。

## 安装

1. 完全退出 Harness，若托盘中仍在运行，也将其退出。
2. 找到应用安装目录，其中应有 `resources/runtime/cli/bin/dsh.cmd`。
3. 打开 PowerShell，把下面两处示例路径替换成自己的实际路径：

```powershell
$ChatCanvasCli = 'C:\path\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
& $ChatCanvasCli plugin --profile desktop add 'dsh-chatcanvas@1.4.0-rc.13'
```

4. 重新打开应用，在插件列表和设置 → **对话画布 · ChatCanvas** 中核对版本。

源码附带 `scripts/install-desktop.ps1`，参数为应用目录 `-AppDirectory` 和安装包路径 `-PackagePath`。它调用官方 CLI。即使安装本地包，宿主解析 profile 的其他依赖时仍可能联网；安装报错时应先排查，不要当成已经装好。

也可以在宿主的“发现”页添加[本仓库的第三方市场源](PUBLICATION.md#简体中文)。若宿主提供本地插件包安装页面，也可使用下载的编译包；旧 rc.12 安装包的包名为 `@local/dsh-chatcanvas`。不同版本的界面文案可能不同。

## 从旧渲染插件升级

先备份 profile 和会话数据，再用官方插件管理器禁用／移除旧渲染插件并安装 ChatCanvas。两套渲染插件同时运行可能互相覆盖界面。旧作品格式与本地内容存储继续兼容；旧组合插件中的执行审核不包含在 ChatCanvas 中。

## 更新与回退

保留上一版编译包。退出应用后用相同命令安装新版，再重新打开；遇到兼容问题时安装上一版包回退。

卸载命令：

```powershell
& $ChatCanvasCli plugin --profile desktop remove 'dsh-chatcanvas'
```

卸载旧 rc.12 时，将包名换为 `@local/dsh-chatcanvas`。跨这两个包名回退时先移除新包，保证只启用一套渲染器。卸载不删除草稿或已发送的会话内容。迁移会话时要同时备份引用的快照、已发布文档和宿主附件。

## 安装后检查

试发普通消息、两张图片、一个画布、一个 UI 预览和一小段音乐，确认宿主权限菜单仍正常。自动测试和安装包核验不能代替这一步正式窗口检查。
