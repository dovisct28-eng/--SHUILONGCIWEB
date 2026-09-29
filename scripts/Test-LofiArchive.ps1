$ErrorActionPreference = 'Stop'
$repoPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$branchBefore = (& git -C $repoPath branch --show-current).Trim()
$statusBefore = @(& git -C $repoPath status --porcelain --untracked-files=all)

& powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'Start-LofiArchive.ps1') -ValidateOnly -NoPause
if ($LASTEXITCODE -ne 0) { throw 'Lo-fi archive validation failed.' }

$branchAfter = (& git -C $repoPath branch --show-current).Trim()
$statusAfter = @(& git -C $repoPath status --porcelain --untracked-files=all)
if ($branchAfter -ne $branchBefore) { throw "Main worktree branch changed: $branchBefore -> $branchAfter" }
if (($statusAfter -join "`n") -ne ($statusBefore -join "`n")) { throw 'Main worktree file status changed during validation.' }

$worktreePath = Join-Path $repoPath '.lofi-preview'
$worktreeCommit = (& git -C $worktreePath rev-parse HEAD).Trim()
if ($worktreeCommit -ne '48f272497e86e4549c5bcd0dee275ff347171a3f') {
    throw "Worktree commit is incorrect: $worktreeCommit"
}

Write-Host 'PASS: validation preserved the main worktree and the archive worktree is pinned.'
