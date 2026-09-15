[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Message
)

$ErrorActionPreference = "Stop"

if (-not $Message) {
    $Message = Read-Host "Enter commit message (Press Enter for default)"
}
if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "chore(toolkit): sync updates ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
}

Write-Host "`n==> Staging changes..." -ForegroundColor Cyan
git add .

Write-Host "==> Committing: '$Message'..." -ForegroundColor Cyan
git commit -m "$Message"

Write-Host "==> Pushing to remote..." -ForegroundColor Cyan
git push

Write-Host "`nAll done!`n" -ForegroundColor Green
