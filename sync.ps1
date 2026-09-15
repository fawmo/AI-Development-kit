[CmdletBinding()]
param (
    [Parameter(Position = 0, ValueFromRemainingArguments = $true)]
    [string[]]$Arguments
)

$script = Join-Path $PSScriptRoot "scripts\sync.js"
& node $script $Arguments
