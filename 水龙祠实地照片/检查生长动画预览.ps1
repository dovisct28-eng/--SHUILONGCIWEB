$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$preview = Join-Path $root '生长动画预览-v1.html'
$assetDir = Join-Path (Split-Path $root -Parent) '水龙祠建筑插画\生长动画素材'
$html = Get-Content -LiteralPath $preview -Raw -Encoding UTF8
$required = @(
  '地基-透明对齐样张.png',
  '完整建筑-透明样张.png',
  'clip-path:inset',
  'requestAnimationFrame',
  '向上回退'
)
foreach ($item in $required) { if (-not $html.Contains($item)) { throw "Missing preview requirement: $item" } }
foreach ($name in @('地基-透明对齐样张.png','完整建筑-透明样张.png')) {
  $path = Join-Path $assetDir $name
  if (-not (Test-Path -LiteralPath $path)) { throw "Missing asset: $path" }
}
Write-Output 'PASS: preview references both aligned assets and has reversible scroll reveal.'
