[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Message,

    [switch]$Auto
)

$scriptPath = Join-Path $PSScriptRoot "scripts\git-sync.ps1"
& $scriptPath @PSBoundParameters
