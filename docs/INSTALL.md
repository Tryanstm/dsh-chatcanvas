# Install, update and rollback

[English](INSTALL.md) | [简体中文](INSTALL.zh-CN.md)

## Requirements

A supported DeepSeek Harness desktop installation, already started at least once. Verified integration targets: 0.2.0-rc.2 and 0.2.1-rc.2. Windows helper only; other platforms are unverified.

Download the compiled `.tgz` asset from Releases. Keep it compressed. It is not an executable and should not be double-clicked.

## Desktop installation

1. Fully quit Harness, including its tray/background instance if present.
2. Find the app installation directory. Its bundled CLI is `resources/runtime/cli/bin/dsh.cmd`.
3. Open PowerShell and replace the example paths below with your own paths:

```powershell
$ChatCanvasCli = 'C:\path\DeepSeek Harness\resources\runtime\cli\bin\dsh.cmd'
& $ChatCanvasCli plugin --profile desktop add 'C:\path\local-dsh-chatcanvas-1.4.0-rc.12.tgz'
```

4. Reopen Harness. Check the plugin list and the **对话画布 · ChatCanvas** settings section.

The source also includes `scripts/install-desktop.ps1` with `-AppDirectory` and `-PackagePath`. It calls the official CLI. Local-package installation may still require network access to resolve the profile's other dependencies. A dependency-resolution error does not mean installation succeeded.

If the desktop version provides a local plugin package installer, that supported UI can be used instead. Host UI wording can vary by version.

## Upgrading from the previous renderer

Do not run the old renderer and ChatCanvas simultaneously. Back up your profile and conversation data, then use the official plugin manager to disable/remove the old renderer and install ChatCanvas. Existing document formats and local content storage remain compatible. The previous combined plugin's execution-review feature is not part of ChatCanvas.

## Update and rollback

Keep the previous compiled package. Quit Harness, install the new package using the same command, and reopen. If necessary, install the previous package to roll back.

To remove ChatCanvas after quitting Harness:

```powershell
& $ChatCanvasCli plugin --profile desktop remove '@local/dsh-chatcanvas'
```

Removing the plugin does not delete local drafts or already-submitted conversation content. Back up referenced snapshots, published documents and the host's attachments when migrating conversations.

## Verify

Try a plain message, two image attachments, a canvas, a UI preview and a short music clip. Confirm the host's ordinary permission menu still works. The plugin's automated tests and local package verification do not replace this real-window smoke test.
