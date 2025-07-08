# PowerShell script to revert tournament deletion time from 2 minutes back to 1 hour

Write-Host "Reverting tournament auto-deletion time from 2 minutes back to 1 hour..." -ForegroundColor Yellow

# Revert tournamentService.ts
$tournamentServicePath = "src\lib\tournamentService.ts"
$content = Get-Content $tournamentServicePath -Raw
$content = $content -replace "Add 2 minutes for testing", "Add 1 hour"
$content = $content -replace "2 \* 60 \* 1000", "60 * 60 * 1000"
$content | Set-Content $tournamentServicePath
Write-Host "✅ Updated $tournamentServicePath" -ForegroundColor Green

# Revert tournamentTimeUtils.ts
$utilsPath = "src\lib\tournamentTimeUtils.ts"
$content = Get-Content $utilsPath -Raw
$content = $content -replace "Add 2 minutes for testing", "Add 1 hour"
$content = $content -replace "2 \* 60 \* 1000", "60 * 60 * 1000"
$content = $content -replace "less than 1 minute remaining \(for testing\)", "less than 30 minutes remaining"
$content = $content -replace "1 \* 60 \* 1000", "30 * 60 * 1000"
$content | Set-Content $utilsPath
Write-Host "✅ Updated $utilsPath" -ForegroundColor Green

# Revert TournamentCountdown.tsx
$countdownPath = "src\components\TournamentCountdown.tsx"
$content = Get-Content $countdownPath -Raw
$content = $content -replace "less than 1 minute remaining \(for testing\)", "less than 30 minutes remaining"
$content = $content -replace "1 \* 60 \* 1000", "30 * 60 * 1000"
$content | Set-Content $countdownPath
Write-Host "✅ Updated $countdownPath" -ForegroundColor Green

# Revert tournamentTimeUtils.ts
$timeUtilsPath = "src\lib\tournamentTimeUtils.ts"
$content = Get-Content $timeUtilsPath -Raw
$content = $content -replace "less than 1 minute remaining \(for testing\)", "less than 30 minutes remaining"
$content = $content -replace "1 \* 60 \* 1000", "30 * 60 * 1000"
$content | Set-Content $timeUtilsPath
Write-Host "✅ Updated $timeUtilsPath" -ForegroundColor Green

# Revert useTournamentTime.ts
$hookPath = "src\hooks\useTournamentTime.ts"
$content = Get-Content $hookPath -Raw
$content = $content -replace "less than 1 minute remaining \(for testing\)", "less than 30 minutes remaining"
$content = $content -replace "1 \* 60 \* 1000", "30 * 60 * 1000"
$content | Set-Content $hookPath
Write-Host "✅ Updated $hookPath" -ForegroundColor Green

Write-Host ""
Write-Host "🔄 Tournament deletion time reverted to 1 hour successfully!" -ForegroundColor Cyan
Write-Host "⚠️  Note: Existing tournaments will still use their original TTL values." -ForegroundColor Yellow
Write-Host "📝 Only NEW tournaments created after this change will use 1-hour deletion time." -ForegroundColor Yellow
