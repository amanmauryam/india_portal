param(
    [string]$Port = "8000",
    [string]$Host = "0.0.0.0",
    [switch]$Reload = $false
)

Write-Host "=== Starting Backend ==="

# Check if port is already in use
$existing = netstat -ano | Select-String "LISTENING" | Select-String ":$Port "
if ($existing) {
    Write-Host "WARNING: Port $Port is already in use. Checking if it's our backend..."
    try {
        $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 5
        if ($health.status -eq "healthy") {
            Write-Host "Backend is already running and healthy. Skipping start."
            exit 0
        }
    } catch {
        Write-Host "Port $Port is occupied but not responding to health checks. Killing..."
        $existing | ForEach-Object {
            $pid = $_ -replace '.*\s+(\d+)$', '$1'
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
        }
        Start-Sleep -Seconds 2
    }
}

$reloadArg = if ($Reload) { "--reload" } else { "" }
Write-Host "Starting uvicorn on $($Host):$Port $reloadArg..."

$p = Start-Process -NoNewWindow -PassThru -FilePath "python" -ArgumentList "-m uvicorn app.main:app --host $Host --port $Port $reloadArg"
Write-Host "Started PID: $($p.Id)"

# Wait for the health endpoint with retry loop
Write-Host "Waiting for backend to become healthy..."
$maxRetries = 30
$retryCount = 0
$started = $false

while ($retryCount -lt $maxRetries -and -not $started) {
    Start-Sleep -Seconds 2
    $retryCount++
    try {
        $health = Invoke-RestMethod "http://127.0.0.1:$Port/api/health" -TimeoutSec 3
        if ($health.status -eq "healthy") {
            Write-Host "Backend is healthy after ${retryCount}x2s ($($retryCount*2)s)"
            $started = $true
        }
    } catch {
        Write-Host "  Retry $retryCount/$maxRetries: $($_.Exception.Message)"
    }
}

if (-not $started) {
    Write-Host "ERROR: Backend failed to start after $($maxRetries * 2) seconds"
    exit 1
}

Write-Host "=== Backend ready at http://127.0.0.1:$Port ==="
