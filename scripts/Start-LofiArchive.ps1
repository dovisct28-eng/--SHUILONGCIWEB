[CmdletBinding()]
param(
    [switch]$NoBrowser,
    [switch]$NoPause,
    [switch]$ValidateOnly
)

$ErrorActionPreference = 'Stop'
$BaselineCommit = '48f272497e86e4549c5bcd0dee275ff347171a3f'
$ArchiveTag = 'module-a-lofi-final-v1.0'
$Port = 4174
$RepoPath = [System.IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..')).TrimEnd('\')
$WorktreePath = Join-Path $RepoPath '.lofi-preview'
$ServerPath = Join-Path $WorktreePath 'module-a\a01\server.mjs'
$Url = "http://127.0.0.1:$Port/module-a/a01/"
$mutex = $null
$hasMutex = $false

function Get-NormalizedPath {
    param([string]$Path)
    return [System.IO.Path]::GetFullPath($Path).Replace('/', '\').TrimEnd('\')
}

function Stop-Launcher {
    param([string]$Message, [int]$Code = 1)
    Write-Host ''
    Write-Host "[ERROR] $Message" -ForegroundColor Red
    if (-not $NoPause -and -not $env:CI) {
        Write-Host ''
        Read-Host 'Press Enter to close this window'
    }
    exit $Code
}

function Invoke-Git {
    param([string[]]$Arguments, [string]$WorkingDirectory = $RepoPath)
    $output = & git -C $WorkingDirectory @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "git $($Arguments -join ' ') failed: $($output -join [Environment]::NewLine)"
    }
    return ,@($output)
}

function Test-ArchiveResponse {
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 3
        return $response.StatusCode -eq 200 -and
            $response.Content.Contains('data-story') -and
            $response.Content.Contains('./app.mjs')
    } catch {
        return $false
    }
}

function Get-PortOwners {
    # Wildcard IPv4/IPv6 listeners can also block this port. Fail closed on errors.
    return @(Get-NetTCPConnection -State Listen -ErrorAction Stop |
        Where-Object { $_.LocalPort -eq $Port } |
        Select-Object -ExpandProperty OwningProcess -Unique)
}

function Test-ArchiveOwner {
    param([int]$ProcessId)
    try {
        $process = Get-CimInstance Win32_Process -Filter "ProcessId = $ProcessId" -ErrorAction Stop
        if (-not $process -or -not $process.CommandLine) { return $false }
        $expectedCommand = '^\s*(?:"[^"]+"|\S+)\s+"' + [regex]::Escape($ServerPath) + '"\s*$'
        return $process.Name -match '^node(\.exe)?$' -and
            $process.CommandLine -match $expectedCommand
    } catch {
        return $false
    }
}

try {
    $mutex = New-Object System.Threading.Mutex($false, 'Local\ShuilongciModuleALofiLauncher')
    $hasMutex = $mutex.WaitOne(0)
    if (-not $hasMutex) {
        Stop-Launcher 'Another archive launch check is already running. Try again shortly.' 2
    }

    Write-Host ''
    Write-Host '=========================================='
    Write-Host '  Shuilongci Module A - Lo-fi archive'
    Write-Host '=========================================='
    Write-Host ''

    if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
        Stop-Launcher 'Git was not found. Install Git and add it to PATH.'
    }
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Stop-Launcher 'Node.js was not found. Install Node.js and add it to PATH.'
    }

    $actualRoot = (Invoke-Git @('rev-parse', '--show-toplevel'))[0]
    if ((Get-NormalizedPath $actualRoot) -ne (Get-NormalizedPath $RepoPath)) {
        Stop-Launcher "The launcher is not inside the expected repository: $RepoPath"
    }

    $tagCommit = (Invoke-Git @('rev-parse', "$ArchiveTag^{commit}"))[0].Trim()
    if ($tagCommit -ne $BaselineCommit) {
        Stop-Launcher "Archive tag mismatch. Expected $BaselineCommit; found $tagCommit."
    }

    if (-not (Test-Path -LiteralPath $WorktreePath)) {
        Write-Host 'First launch: creating the isolated lo-fi worktree...'
        Invoke-Git @('worktree', 'add', '--detach', $WorktreePath, $ArchiveTag) | ForEach-Object { Write-Host $_ }
    } elseif (-not (Test-Path -LiteralPath (Join-Path $WorktreePath '.git'))) {
        Stop-Launcher "$WorktreePath exists but is not a Git worktree. It will not be deleted."
    }

    $worktreeRoot = (Invoke-Git @('rev-parse', '--show-toplevel') $WorktreePath)[0]
    if ((Get-NormalizedPath $worktreeRoot) -ne (Get-NormalizedPath $WorktreePath)) {
        Stop-Launcher '.lofi-preview is not the expected Git worktree.'
    }
    $commonDir = (Invoke-Git @('rev-parse', '--git-common-dir') $WorktreePath)[0]
    $commonDirPath = if ([System.IO.Path]::IsPathRooted($commonDir)) { $commonDir } else { Join-Path $WorktreePath $commonDir }
    $resolvedCommonDir = Get-NormalizedPath $commonDirPath
    $expectedCommonDir = Get-NormalizedPath (Join-Path $RepoPath '.git')
    if ($resolvedCommonDir -ne $expectedCommonDir) {
        Stop-Launcher '.lofi-preview belongs to another Git repository and will not be overwritten.'
    }

    $registered = Invoke-Git @('-c', 'core.quotePath=false', 'worktree', 'list', '--porcelain')
    $registeredPaths = @($registered | Where-Object { $_.StartsWith('worktree ') } |
        ForEach-Object { Get-NormalizedPath $_.Substring(9) })
    if ((Get-NormalizedPath $WorktreePath) -notin $registeredPaths) {
        Stop-Launcher '.lofi-preview is not registered with this repository.'
    }
    $headRef = (Invoke-Git @('rev-parse', '--abbrev-ref', 'HEAD') $WorktreePath)[0]
    if ($headRef -ne 'HEAD') {
        Stop-Launcher 'The archive worktree must have a detached HEAD. No branch was changed.'
    }

    $worktreeCommit = (Invoke-Git @('rev-parse', 'HEAD') $WorktreePath)[0].Trim()
    if ($worktreeCommit -ne $BaselineCommit -or $worktreeCommit -ne $tagCommit) {
        Stop-Launcher "Worktree commit mismatch. Expected $BaselineCommit; found $worktreeCommit."
    }

    $worktreeStatus = Invoke-Git @('status', '--porcelain', '--untracked-files=all') $WorktreePath
    if ($worktreeStatus.Count -gt 0) {
        Stop-Launcher "The lo-fi worktree has file changes: $($worktreeStatus -join '; '). No reset or deletion was performed."
    }
    if (-not (Test-Path -LiteralPath $ServerPath -PathType Leaf)) {
        Stop-Launcher "The archive server file is missing: $ServerPath"
    }

    Write-Host "Archive commit verified: $worktreeCommit"
    if ($ValidateOnly) {
        Write-Host 'Archive refs, worktree ownership, and file state are valid.'
        exit 0
    }

    $owners = @(Get-PortOwners)
    if ($owners.Count -gt 0) {
        $knownOwners = @($owners | Where-Object { Test-ArchiveOwner -ProcessId $_ })
        if ($knownOwners.Count -ne $owners.Count -or -not (Test-ArchiveResponse)) {
            Stop-Launcher "Port $Port is occupied by an unverified process. It will not be terminated."
        }
        Write-Host 'The verified lo-fi archive service is already running.'
    } else {
        Write-Host 'Starting the lo-fi archive server...'
        $serverCommand = "title Shuilongci Module A Lo-fi Server && set `"A01_PORT=$Port`" && node `"$ServerPath`""
        Start-Process -FilePath 'cmd.exe' -ArgumentList '/k', $serverCommand -WorkingDirectory $WorktreePath | Out-Null

        $ready = $false
        $startupTimer = [Diagnostics.Stopwatch]::StartNew()
        while ($startupTimer.Elapsed.TotalSeconds -lt 15) {
            Start-Sleep -Milliseconds 500
            $owners = @(Get-PortOwners)
            if ($owners.Count -gt 0) {
                $knownOwners = @($owners | Where-Object { Test-ArchiveOwner -ProcessId $_ })
                if ($knownOwners.Count -ne $owners.Count) {
                    Stop-Launcher "Port $Port was claimed by an unknown process during startup."
                }
                if (Test-ArchiveResponse) { $ready = $true; break }
            }
        }
        if (-not $ready) {
            Stop-Launcher 'The server did not become ready within 15 seconds. Check the server window for errors.'
        }
    }

    if (-not $NoBrowser) {
        Start-Process $Url
    }

    Write-Host ''
    Write-Host 'Lo-fi archive started.' -ForegroundColor Green
    Write-Host "URL: $Url"
    Write-Host "Tag: $ArchiveTag"
    Write-Host "Commit: $BaselineCommit"
    Write-Host 'The main worktree branch and files were not switched or modified.'
    Write-Host 'Close the "Shuilongci Module A Lo-fi Server" window to stop the service.'
    exit 0
} catch {
    Stop-Launcher $_.Exception.Message
} finally {
    if ($hasMutex -and $mutex) { $mutex.ReleaseMutex() }
    if ($mutex) { $mutex.Dispose() }
}
