<#
.SYNOPSIS
    Automated Git stage, commit, and push utility for AI Development Kit.

.DESCRIPTION
    Automates the workflow of checking status, staging all changes (respecting .gitignore),
    prompting for or generating a commit message, pulling remote updates, and pushing to the remote repository.

.PARAMETER Message
    Optional commit message. If omitted, prompts for input. If blank, auto-generates a timestamped conventional message.

.PARAMETER Auto
    If specified, skips prompt and automatically uses an auto-generated timestamped message.

.EXAMPLE
    .\scripts\git-sync.ps1 -Message "feat(skills): update react patterns"
    .\scripts\git-sync.ps1 -Auto
    .\scripts\git-sync.ps1
#>

[CmdletBinding()]
param (
    [Parameter(Position = 0)]
    [string]$Message,

    [switch]$Auto
)

# Set error action preference
$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Text)
    Write-Host "`n==> $Text" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Text)
    Write-Host "[SUCCESS] $Text" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Text)
    Write-Host "[WARNING] $Text" -ForegroundColor Yellow
}

function Write-Err {
    param([string]$Text)
    Write-Host "[ERROR] $Text" -ForegroundColor Red
}

# 1. Check if git is available
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    Write-Err "Git is not installed or not found in PATH."
    exit 1
}

# 2. Check if inside git repository
$isGitRepo = git rev-parse --is-inside-work-tree 2>$null
if ($LASTEXITCODE -ne 0 -or $isGitRepo -ne "true") {
    Write-Err "Current directory is not inside a Git repository."
    exit 1
}

# 3. Detect current branch and remote
$currentBranch = (git branch --show-current).Trim()
if (-not $currentBranch) {
    Write-Err "Could not determine the current git branch (detached HEAD?)."
    exit 1
}

$remote = (git remote).Trim()
if (-not $remote) {
    Write-Warn "No git remote configured. Commits will remain local only."
    $hasRemote = $false
} else {
    $remote = ($remote -split "`r?`n")[0]
    $hasRemote = $true
}

Write-Step "AI Development Kit - Git Sync"
Write-Host "Branch: $currentBranch | Remote: $(if ($hasRemote) { $remote } else { 'None' })" -ForegroundColor DarkGray

# 4. Check status
$status = git status --porcelain
$hasChanges = [bool]($status -and $status.Trim().Length -gt 0)

# Check for unpushed commits
$unpushed = @()
if ($hasRemote) {
    $unpushed = git log "$remote/$currentBranch..$currentBranch" --oneline 2>$null
}

if (-not $hasChanges -and (-not $unpushed -or $unpushed.Count -eq 0)) {
    Write-Success "Working tree is clean and branch '$currentBranch' is up-to-date. Nothing to sync."
    exit 0
}

# 5. Display changed files if any
if ($hasChanges) {
    Write-Step "Detected changes:"
    git status --short

    # 6. Determine commit message
    if (-not $Message) {
        if ($Auto) {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm"
            $Message = "chore(toolkit): sync updates ($timestamp)"
        } else {
            Write-Host ""
            $defaultMsg = "chore(toolkit): sync updates ($(Get-Date -Format 'yyyy-MM-dd HH:mm'))"
            $inputMsg = Read-Host "Enter commit message (Press Enter for default: '$defaultMsg')"
            if ([string]::IsNullOrWhiteSpace($inputMsg)) {
                $Message = $defaultMsg
            } else {
                $Message = $inputMsg.Trim()
            }
        }
    }

    # 7. Stage and commit
    Write-Step "Staging files..."
    git add .
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to stage files."
        exit 1
    }

    Write-Step "Committing with message: '$Message'"
    git commit -m "$Message"
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to commit changes."
        exit 1
    }
    Write-Success "Committed successfully."
} else {
    Write-Host "No new file changes to commit, but unpushed commits detected." -ForegroundColor Yellow
}

# 8. Pull / Rebase before pushing if remote exists
if ($hasRemote) {
    Write-Step "Checking for remote updates from '$remote/$currentBranch'..."
    git fetch $remote $currentBranch --quiet 2>$null
    
    # Try rebase if remote has changes
    $behindCount = (git rev-list --count "$currentBranch..$remote/$currentBranch" 2>$null)
    if ($behindCount -and [int]$behindCount -gt 0) {
        Write-Warn "Branch is $behindCount commit(s) behind remote. Rebasing..."
        git pull --rebase $remote $currentBranch
        if ($LASTEXITCODE -ne 0) {
            Write-Err "Rebase conflict encountered. Please resolve conflicts manually and run 'git rebase --continue'."
            exit 1
        }
    }

    # 9. Push to remote
    Write-Step "Pushing to $remote/$currentBranch..."
    git push $remote $currentBranch
    if ($LASTEXITCODE -ne 0) {
        Write-Err "Failed to push to remote. Check your network or GitHub credentials."
        exit 1
    }
    Write-Success "Successfully pushed to $remote/$currentBranch!"
} else {
    Write-Warn "Skipped push because no remote is configured."
}

Write-Host "`nAll operations completed successfully.`n" -ForegroundColor Green
