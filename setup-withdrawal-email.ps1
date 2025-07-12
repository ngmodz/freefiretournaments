# Setup Withdrawal Email Configuration
# This script helps you set up the withdrawal notification email system

Write-Host "=== Withdrawal Email Setup ===" -ForegroundColor Green
Write-Host ""

Write-Host "This script will help you set up the withdrawal notification email system." -ForegroundColor Yellow
Write-Host "You'll need a Gmail account with 2FA enabled and an app password." -ForegroundColor Yellow
Write-Host ""

# Ask which type to set up
Write-Host "Which withdrawal email do you want to set up?" -ForegroundColor Cyan
Write-Host "1. Processed notification (admin panel) [WITHDRAWAL_EMAIL_USER]" -ForegroundColor White
Write-Host "2. Request received notification (user confirmation) [WITHDRAWAL_REQUEST_EMAIL_USER]" -ForegroundColor White
$typeChoice = Read-Host "Enter 1 or 2 (default: 1)"
if ($typeChoice -eq "2") {
    $userVar = "WITHDRAWAL_REQUEST_EMAIL_USER"
    $passVar = "WITHDRAWAL_REQUEST_EMAIL_PASSWORD"
    $desc = "withdrawal request (user confirmation)"
} else {
    $userVar = "WITHDRAWAL_EMAIL_USER"
    $passVar = "WITHDRAWAL_EMAIL_PASSWORD"
    $desc = "withdrawal processed (admin panel)"
}

# Check if .env file exists
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ .env file not found!" -ForegroundColor Red
    Write-Host "Please create a .env file first by copying env.example" -ForegroundColor Yellow
    Write-Host "Copy-Item env.example .env" -ForegroundColor Cyan
    exit 1
}

Write-Host "✅ .env file found" -ForegroundColor Green
Write-Host ""

# Get current values
$currentEnv = Get-Content $envFile | Where-Object { $_ -match "^($userVar|$passVar)=" }
$currentUser = ($currentEnv | Where-Object { $_ -match "^$userVar=" }) -replace "^$userVar=", ""
$currentPass = ($currentEnv | Where-Object { $_ -match "^$passVar=" }) -replace "^$passVar=", ""

Write-Host "Current $desc email configuration:" -ForegroundColor Cyan
Write-Host "  $userVar: $currentUser" -ForegroundColor White
Write-Host "  $passVar: $($currentPass.Length > 0 ? "SET" : "NOT SET")" -ForegroundColor White
Write-Host ""

# Ask if user wants to update
$update = Read-Host "Do you want to update the $desc email configuration? (y/n)"
if ($update -ne "y" -and $update -ne "Y") {
    Write-Host "Setup cancelled." -ForegroundColor Yellow
    exit 0
}

Write-Host ""
Write-Host "=== Gmail Setup Instructions ===" -ForegroundColor Green
Write-Host "1. Go to your Google Account settings: https://myaccount.google.com/" -ForegroundColor White
Write-Host "2. Navigate to Security > 2-Step Verification" -ForegroundColor White
Write-Host "3. Scroll down and click 'App passwords'" -ForegroundColor White
Write-Host "4. Select 'Mail' and click 'Generate'" -ForegroundColor White
Write-Host "5. Copy the 16-character app password" -ForegroundColor White
Write-Host ""

# Get new values
$newEmail = Read-Host "Enter your Gmail address (e.g., yourname@gmail.com)"
$newPassword = Read-Host "Enter your Gmail app password (16 characters)" -AsSecureString

# Convert secure string to plain text
$BSTR = [System.Runtime.InteropServices.Marshal]::SecureStringToBSTR($newPassword)
$plainPassword = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto($BSTR)

# Validate email format
if ($newEmail -notmatch "^[a-zA-Z0-9._%+-]+@gmail\.com$") {
    Write-Host "❌ Invalid Gmail address format!" -ForegroundColor Red
    Write-Host "Please enter a valid Gmail address (e.g., yourname@gmail.com)" -ForegroundColor Yellow
    exit 1
}

# Validate password length
if ($plainPassword.Length -ne 16) {
    Write-Host "❌ Invalid app password length!" -ForegroundColor Red
    Write-Host "Gmail app passwords are exactly 16 characters long" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "=== Updating .env file ===" -ForegroundColor Green

# Read current .env content
$envContent = Get-Content $envFile

# Update or add the withdrawal email variables
$updatedUser = $false
$updatedPass = $false
$newContent = @()

foreach ($line in $envContent) {
    if ($line -match "^$userVar=") {
        $newContent += "$userVar=$newEmail"
        $updatedUser = $true
    } elseif ($line -match "^$passVar=") {
        $newContent += "$passVar=$plainPassword"
        $updatedPass = $true
    } else {
        $newContent += $line
    }
}

# Add variables if they don't exist
if (-not $updatedUser) {
    $newContent += "$userVar=$newEmail"
}
if (-not $updatedPass) {
    $newContent += "$passVar=$plainPassword"
}

# Write back to .env file
$newContent | Set-Content $envFile

Write-Host "✅ .env file updated successfully!" -ForegroundColor Green
Write-Host ""

Write-Host "=== Testing Configuration ===" -ForegroundColor Green
Write-Host "You can now test the email configuration by running:" -ForegroundColor White
Write-Host "  node scripts/test-withdrawal-request-notification.js" -ForegroundColor Cyan
Write-Host ""

Write-Host "=== Next Steps ===" -ForegroundColor Green
Write-Host "1. Test the email configuration using the test script above" -ForegroundColor White
Write-Host "2. Start your development server: npm run dev:full" -ForegroundColor White
Write-Host "3. Try making a withdrawal request to test the notification" -ForegroundColor White
Write-Host "4. Check the documentation in WITHDRAWAL_NOTIFICATIONS.md" -ForegroundColor White
Write-Host ""

Write-Host "🎉 Withdrawal email setup complete!" -ForegroundColor Green 