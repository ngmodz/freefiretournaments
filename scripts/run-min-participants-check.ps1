# PowerShell script to run minimum participants check
# This can be scheduled to run every 5-10 minutes using Windows Task Scheduler

Write-Host "Starting automated minimum participants check..." -ForegroundColor Green

try {
    # Change to the project directory
    $scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
    $projectPath = Split-Path -Parent $scriptPath
    Set-Location $projectPath
    
    Write-Host "Running from: $projectPath" -ForegroundColor Yellow
    
    # Run the Node.js script
    node scripts/automated-min-participants-check.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Automated check completed successfully" -ForegroundColor Green
    } else {
        Write-Host "❌ Automated check failed with exit code: $LASTEXITCODE" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error running automated check: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Log completion time
$timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
Write-Host "Check completed at: $timestamp" -ForegroundColor Cyan
