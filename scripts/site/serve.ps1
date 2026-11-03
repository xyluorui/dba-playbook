# 用途: 本地一键预览站点：构建 + 起本地服务 + 自动打开浏览器
# 用法: powershell -File scripts/site/serve.ps1 [-Port 8600] [-NoBuild]
# 适用: Windows PowerShell 5+（依赖 python 3.9+ 在 PATH 中）
# 风险: 只读；监听本地端口，Ctrl+C 停止
# 依赖: python
# 日期: 2026-11-03
param(
    [int]$Port = 8600,
    [switch]$NoBuild
)
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$build = Join-Path $PSScriptRoot 'build.py'

if (-not $NoBuild) {
    Write-Host '[serve] 构建站点 ...'
    python $build
    if ($LASTEXITCODE -ne 0) { throw 'build.py 失败' }
}

$url = "http://127.0.0.1:$Port/"
Write-Host "[serve] $url  （Ctrl+C 停止）"
Start-Job -ScriptBlock {
    Start-Sleep -Milliseconds 900
    Start-Process $using:url
} | Out-Null

python -m http.server $Port --bind 127.0.0.1 --directory $root
