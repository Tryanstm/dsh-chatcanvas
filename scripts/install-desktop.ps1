param(
 [Parameter(Mandatory=$true)][string]$AppDirectory,
 [Parameter(Mandatory=$true)][string]$PackagePath
)
$ErrorActionPreference='Stop'
$RendererCli = Join-Path (Resolve-Path -LiteralPath $AppDirectory).Path 'resources/runtime/cli/bin/dsh.cmd'
$RendererPackage = (Resolve-Path -LiteralPath $PackagePath).Path
if(-not (Test-Path -LiteralPath $RendererCli -PathType Leaf)){throw '未找到官方内置 dsh.cmd，请检查 Harness 安装目录。'}
Write-Host '请确保已完全退出 DeepSeek Harness；现在通过官方 CLI 安装对话画布 · ChatCanvas。'
& $RendererCli plugin --profile desktop add $RendererPackage
if($LASTEXITCODE -ne 0){throw "官方插件安装失败，退出码 $LASTEXITCODE"}
Write-Host '安装完成，请重新打开 DeepSeek Harness。'

