param(
  [Parameter(Mandatory = $true)]
  [string]$Owner,
  [string]$Gh = "gh"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location -LiteralPath $root

$version = (Get-Content -LiteralPath "package.json" -Raw | ConvertFrom-Json).version
$tag = "v$version"
$installer = Join-Path $root "dist\PokeMux-$version-x64.exe"
$manifest = Join-Path $root "dist\latest.yml"
$blockMap = "$installer.blockmap"
$checksums = Join-Path $root "dist\CHECKSUMS-SHA256.txt"

npm test
if ($LASTEXITCODE -ne 0) { throw "Testes falharam." }
npm run test:market-refresh
if ($LASTEXITCODE -ne 0) { throw "Teste de atualização do mercado falhou." }
npm run dist
if ($LASTEXITCODE -ne 0) { throw "Build falhou." }

foreach ($file in @($installer, $manifest, $blockMap)) {
  if (-not (Test-Path -LiteralPath $file)) { throw "Artefato ausente: $file" }
}

$hashLines = @($installer, $manifest, $blockMap) | ForEach-Object {
  $hash = Get-FileHash -LiteralPath $_ -Algorithm SHA256
  "$($hash.Hash.ToLowerInvariant())  $([IO.Path]::GetFileName($_))"
}
Set-Content -LiteralPath $checksums -Value $hashLines -Encoding utf8

& $Gh release create $tag $installer $manifest $blockMap $checksums "LICENSE" "NOTICE.md" "CHANGELOG.md" "MANUAL.md" "FAQ.md" `
  --repo "$Owner/PokeMux" `
  --title "PokeMux $tag" `
  --notes-file "CHANGELOG.md" `
  --latest
if ($LASTEXITCODE -ne 0) { throw "Falha ao publicar a release." }
