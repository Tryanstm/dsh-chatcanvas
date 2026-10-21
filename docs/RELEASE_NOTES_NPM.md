# ChatCanvas 1.4.0-rc.13 — npm distribution preview / npm 分发预览

## English

This preview prepares ChatCanvas for npm and DSH's custom plugin market. The public package is renamed from `@local/dsh-chatcanvas` to `dsh-chatcanvas`; disable/remove the old package before installing the new one. Document and storage formats remain compatible.

- Prebuilt installation package without install-time build scripts, developer previews or source maps.
- Correct public client module identity, host peer declarations, icon and bilingual catalog metadata.
- Market generator checks the published npm archive's SHA-512 integrity before listing it.
- First publication uses npm's `next` tag. The market stays empty while npm registration/publication is pending.

The existing `1.4.0-rc.12` GitHub Release remains available with its original package name. These notes describe the upcoming distribution and do not assert that npm publication has already completed.

## 简体中文

本预览版为 npm 和 DSH 自定义插件市场准备分发。公开包名从 `@local/dsh-chatcanvas` 调整为 `dsh-chatcanvas`；安装新包前禁用或移除旧包。作品格式和存储保持兼容。

- 预编译安装包，不在安装时构建；排除开发预览和调试映射。
- 同步客户端模块名称，补齐宿主 peer 声明、图标和中英文目录介绍。
- 市场生成器核对 npm 实际压缩包 SHA-512 后才允许上架。
- 测试版使用 `next` 标签。注册、发布尚未完成时，市场保持为空。

现有 `1.4.0-rc.12` GitHub Release 及其原包名继续保留。本说明描述准备中的分发版本，不代表已经发布到 npm。
