# VishuSingh Spicetify installer
$ErrorActionPreference = 'Stop'
$appSource = Join-Path $PSScriptRoot 'spicetify\vishusingh'
if (-not (Test-Path (Join-Path $appSource 'manifest.json'))) {
  throw 'Cannot find spicetify\vishusingh\manifest.json. Run this script from the extracted repository root.'
}
if (-not (Get-Command spicetify -ErrorAction SilentlyContinue)) {
  throw 'Spicetify CLI was not found. Install Spicetify first: https://spicetify.app/docs/getting-started'
}
$target = Join-Path $env:APPDATA 'spicetify\CustomApps\vishusingh'
Write-Host 'VishuSingh installer' -ForegroundColor Magenta
Write-Host 'Close Spotify completely before continuing.'
$answer = Read-Host 'Have you fully exited Spotify? (y/N)'
if ($answer -notmatch '^(y|yes)$') { throw 'Please exit Spotify completely, then run this installer again.' }
New-Item -ItemType Directory -Force -Path $target | Out-Null
Copy-Item -Path (Join-Path $appSource '*') -Destination $target -Recurse -Force
spicetify config custom_apps vishusingh
if ($LASTEXITCODE -ne 0) { throw 'Failed to update Spicetify custom_apps configuration.' }
spicetify apply
if ($LASTEXITCODE -ne 0) { throw 'Spicetify apply failed. Review the error above.' }
Write-Host ''
Write-Host 'VishuSingh files installed. Launch Spotify and open VishuSingh from the sidebar.' -ForegroundColor Green
Write-Host 'Note: vocal reduction is not yet active in the Spicetify app.'
