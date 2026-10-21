# npm and the plugin market / npm 与插件市场

[English](#english) | [简体中文](#简体中文)

## English

**Status:** [`dsh-chatcanvas@1.4.0-rc.13`](https://www.npmjs.com/package/dsh-chatcanvas/v/1.4.0-rc.13) is published and listed in the market index. The public registry's SHA-512 and the downloaded archive's SHA-256 match the reviewed prebuilt package. The existing `1.4.0-rc.12` package remains in [GitHub Releases](https://github.com/Tryanstm/dsh-chatcanvas/releases). A GitHub Topic is a discovery label, not an installation source or official endorsement.

The public npm package is named **`dsh-chatcanvas`**. It ships built JavaScript, local audio/model assets, notices, an icon and bilingual catalog metadata. Installation does not build the source or run lifecycle scripts. Developer previews and source maps stay in the source distribution. The plugin interface remains Simplified Chinese.

### Installation

Use the desktop application's bundled CLI, replacing the example path:

```powershell
$ChatCanvasCli = 'C:\path\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
& $ChatCanvasCli plugin --profile desktop add 'dsh-chatcanvas@1.4.0-rc.13'
```

If `@local/dsh-chatcanvas` or the older combined renderer is installed, fully exit Harness and remove/disable that old package before installing the new one. The old and new packages must not render the same conversation together. Document formats and local storage identifiers are retained; back up your profile before changing installed packages. The old `@local/dsh-chatcanvas` package is removed with:

```powershell
& $ChatCanvasCli plugin --profile desktop remove '@local/dsh-chatcanvas'
```

### Add the market source

Enable **Plugins → Experimental plugins → Custom plugin market**, open **Discover**, and add:

```text
https://raw.githubusercontent.com/Tryanstm/dsh-chatcanvas/main/marketplace/index.json
```

This is a third-party source maintained by this repository, not a built-in official catalog. It lists verified npm versions and their supported host releases. The host will offer only compatible versions. No registry token belongs in the index URL.

### Maintainer procedure

1. Build and test with `pnpm typecheck`, `pnpm build`, and `pnpm test`.
2. Run `pnpm package:npm`. Check `outputs/npm-publication.json` and review the archive contents. Keep that exact archive and report together.
3. Register an npm account, verify its email, enable 2FA, and use a current official npm CLI with `npm login --auth-type=web`. Login and publishing can require separate security-key verifications; complete them promptly in npm's UI.
4. Publish the reviewed archive, not the source checkout:

   ```sh
   npm publish ./outputs/dsh-chatcanvas-1.4.0-rc.13.tgz --tag next --access public --registry https://registry.npmjs.org/
   ```

5. Wait for npm's automated review to finish. A successful CLI upload can still show **Validating** in the package's Versions tab, with only a `0.0.0-stage` placeholder publicly visible. Do not install or list that placeholder. Once the real version is available, run `pnpm marketplace`. It checks the actual npm version, publication time, repository, bundle metadata and SHA-512 integrity before replacing the market index. A missing version, network failure or mismatch leaves the existing index unchanged. Do not rebuild the archive/report between publishing and verification.
6. Commit the verified index and update these status notes. Publish previews with npm's **`next`** tag. npm also assigns `latest` to a package's first published version and rejects removing that tag; currently both tags point to rc.13. This does not make it a stable release. Installation instructions pin the preview version. Existing npm versions and GitHub Release assets are not overwritten.

The source checkout's `prepublishOnly` guard rejects accidental root publication. The prebuilt package has no lifecycle scripts. npm account credentials are never part of source control or the market index.

References: [official DSH market guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/guide/plugin-market.md), [official packaging guide](https://github.com/deepseek-ai/deepseek-harness/blob/master/docs/user/develop/basic/publish.md), [npm registration](https://docs.npmjs.com/creating-a-new-npm-user-account).

## 简体中文

**当前状态：** [`dsh-chatcanvas@1.4.0-rc.13`](https://www.npmjs.com/package/dsh-chatcanvas/v/1.4.0-rc.13) 已发布并加入市场索引。注册表 SHA-512、实际下载包 SHA-256 均与核验过的本地包一致。[GitHub Releases](https://github.com/Tryanstm/dsh-chatcanvas/releases) 中已有的 `1.4.0-rc.12` 安装包继续保留。GitHub 的 Topic 用于发现仓库，不代表官方认证。

npm 的公开包名为 **`dsh-chatcanvas`**。安装包包含编译好的代码、本地音色和模型、许可证、图标及中英文目录介绍；安装时不编译源码，也不运行生命周期脚本。开发预览和调试映射留在源码分发中。插件界面仍为简体中文。

安装命令、旧包移除命令见上方英文部分，路径需换成自己的 Harness 安装目录。首次迁移时，完全退出 Harness，先禁用或移除原来的 `@local/dsh-chatcanvas`／旧组合渲染器，再安装新包。两套渲染器不应同时工作。作品格式和存储标识保持兼容；变更安装包前备份 profile。

启用 **插件 → 实验性插件 → 自定义插件市场** 后，在 **发现 → 添加索引源** 中填写上方的 `index.json` 地址。这个源由本仓库维护，是第三方插件源。索引只加入已经核验 npm 发布、宿主兼容范围和压缩包 SHA-512 的版本；缺少版本、网络失败或内容不一致时，不覆盖既有索引。

维护步骤：构建与测试 → `pnpm package:npm` → 注册、验证邮箱、开启 2FA，用新版官方 npm CLI 网页登录 → `npm publish` 发布同一份 `.tgz` → 等待 npm 自动扫描通过 → `pnpm marketplace` → 提交核验后的索引并更新状态说明。登录和发布可能分别要求安全密钥验证，及时在网页完成。CLI 返回成功后，版本页仍可能显示 Validating，此时公开的 `0.0.0-stage` 只是占位版本，不应安装或加入市场。注册、登录和发布验证由 npm 处理，不需要向维护助手发送密码、验证码或令牌。发布时指定 `next`；npm 仍会给首次发布自动加上且不允许删除 `latest`，当前两个标签都指向 rc.13。这不代表稳定版，安装说明固定指定测试版本。

源码根目录有防误发布检查；实际发布预编译包。不要把账号凭据放进 Git 仓库、安装包或市场地址。
