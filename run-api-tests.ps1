#!/usr/bin/env pwsh

Write-Host "🚀 FreeFire Tournaments - Comprehensive API Health Check" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📦 Installing test dependencies..." -ForegroundColor Yellow
npm install --save-dev firebase@^10.7.1 node-fetch@^3.3.2 dotenv@^16.3.1 cross-env@^7.0.3

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies. Please check your npm installation." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "🧪 Running comprehensive API tests..." -ForegroundColor Yellow
Write-Host "This will test every single API endpoint in your application" -ForegroundColor Gray
Write-Host ""

node comprehensive-api-test.js

$testExitCode = $LASTEXITCODE

Write-Host ""
if ($testExitCode -eq 0) {
    Write-Host "✅ All tests passed! Your API is healthy." -ForegroundColor Green
} else {
    Write-Host "❌ Some tests failed. Check the report above for details." -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Test execution completed!" -ForegroundColor Cyan
Write-Host "Check the detailed report above for analysis and recommendations." -ForegroundColor Gray

# Keep window open if running from explorer
if ($Host.Name -eq "ConsoleHost") {
    Write-Host ""
    Write-Host "Press any key to continue..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
}

exit $testExitCode
