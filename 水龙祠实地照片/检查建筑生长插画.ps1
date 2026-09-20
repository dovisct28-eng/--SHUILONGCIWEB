$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$svgPath = Join-Path $root '水龙祠-2.5D生长插画-v1.svg'
$htmlPath = Join-Path $root '水龙祠-2.5D生长预览-v1.html'

[xml]$svg = Get-Content -LiteralPath $svgPath -Raw -Encoding UTF8
$ns = New-Object System.Xml.XmlNamespaceManager($svg.NameTable)
$ns.AddNamespace('s', 'http://www.w3.org/2000/svg')
$expected = @('ground', 'entrance-wall', 'side-walls', 'side-roofs', 'main-hall', 'stage', 'entrance-roof', 'details')
foreach ($id in $expected) {
    $group = $svg.SelectSingleNode("/s:svg/s:g[@id='$id']", $ns)
    if (-not $group -or $group.ChildNodes.Count -eq 0) { throw "Missing or empty layer: $id" }
}
if ($svg.svg.viewBox -ne '0 0 1120 1400') { throw 'Unexpected canvas coordinates' }
$html = Get-Content -LiteralPath $htmlPath -Raw -Encoding UTF8
if (-not $html.Contains('data="水龙祠-2.5D生长插画-v1.svg"')) { throw 'Preview does not load the SVG' }
if (-not $html.Contains("classList.add('playing')")) { throw 'Play control is missing' }
if (-not $html.Contains("classList.remove('playing')")) { throw 'Reset control is missing' }
Write-Output 'PASS: SVG parses, all eight layers exist, and preview controls reference the artwork.'
