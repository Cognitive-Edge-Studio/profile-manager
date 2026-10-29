param([switch]$NoBrowser)

$ErrorActionPreference = 'Stop'
$taskRoot = Split-Path -Parent $PSScriptRoot
$taskNode = Join-Path $taskRoot 'node_modules/node-win-x64/bin/node.exe'
$taskAdminUrl = 'http://127.0.0.1:3000/admin/'

function Get-LocalListener([int]$Port) {
    Get-NetTCPConnection -LocalPort $Port -State Listen -ErrorAction SilentlyContinue |
        Select-Object -First 1
}

function Assert-ProjectListener([int]$Port) {
    $taskListener = Get-LocalListener $Port
    if ($taskListener) {
        $taskProcess = Get-CimInstance Win32_Process -Filter "ProcessId = $($taskListener.OwningProcess)"
        if (-not $taskProcess.CommandLine -or
            $taskProcess.CommandLine.IndexOf($taskRoot, [StringComparison]::OrdinalIgnoreCase) -lt 0) {
            throw "Port $Port is already occupied by another application. No processes were stopped."
        }
    }
}

function Start-LocalService([string]$Name, [string[]]$CommandArguments) {
    $taskStamp = Get-Date -Format 'yyyyMMdd-HHmmss-fff'
    $taskOutput = Join-Path $taskRoot ".local/$Name-$taskStamp.log"
    $taskError = Join-Path $taskRoot ".local/$Name-$taskStamp.err.log"
    Start-Process -FilePath $taskNode -ArgumentList $CommandArguments -WorkingDirectory $taskRoot `
        -WindowStyle Hidden -RedirectStandardOutput $taskOutput -RedirectStandardError $taskError | Out-Null
}

try {
    if (-not (Test-Path -LiteralPath $taskNode)) { throw 'The bundled Node runtime is missing. Run npm install first.' }
    if (-not (Test-Path -LiteralPath (Join-Path $taskRoot '.env.local'))) { throw 'Local configuration is missing. Run npm run setup:local first.' }
    if (-not (Test-Path -LiteralPath (Join-Path $taskRoot '.next/BUILD_ID'))) { throw 'The application build is missing. Run npm run build first.' }
    New-Item -ItemType Directory -Path (Join-Path $taskRoot '.local') -Force | Out-Null
    Assert-ProjectListener 55432
    Assert-ProjectListener 3000

    if (-not (Get-LocalListener 55432)) {
        Write-Host 'Starting the local database...'
        Start-LocalService 'db' @('scripts/run.mjs', 'script', 'scripts/local-postgres.mjs')
        $taskDeadline = (Get-Date).AddSeconds(30)
        while (-not (Get-LocalListener 55432)) {
            if ((Get-Date) -gt $taskDeadline) { throw 'The database did not start. Check the newest .local/db logs.' }
            Start-Sleep -Milliseconds 300
        }
    }
    if (-not (Get-LocalListener 3000)) {
        Write-Host 'Starting Payload...'
        Start-LocalService 'app' @('scripts/run.mjs', 'next', 'start', '--hostname', '127.0.0.1', '--port', '3000')
    }

    $taskDeadline = (Get-Date).AddSeconds(45)
    $taskReady = $false
    while (-not $taskReady -and (Get-Date) -lt $taskDeadline) {
        try {
            $taskResponse = Invoke-WebRequest $taskAdminUrl -UseBasicParsing -TimeoutSec 5
            $taskReady = $taskResponse.StatusCode -eq 200 -and $taskResponse.Content -match 'payload'
        } catch { $taskReady = $false }
        if (-not $taskReady) { Start-Sleep -Milliseconds 500 }
    }
    if (-not $taskReady) { throw 'Payload did not become ready. Check the newest .local/app logs.' }
    Write-Host "Payload is ready: $taskAdminUrl"
    Write-Host 'It runs in the background until the PC restarts or the processes are stopped.'
    if (-not $NoBrowser) { Start-Process $taskAdminUrl }
} catch {
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}
