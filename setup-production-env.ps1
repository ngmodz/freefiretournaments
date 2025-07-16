#!/usr/bin/env pwsh

# Setup Production Environment Variables for Vercel
# This script will set the production Cashfree API keys on Vercel

Write-Host "🚀 Setting up production environment variables on Vercel..." -ForegroundColor Green

# Check if Vercel CLI is installed
if (-not (Get-Command "vercel" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Vercel CLI not found. Please install it first:" -ForegroundColor Red
    Write-Host "npm install -g vercel" -ForegroundColor Yellow
    exit 1
}

# Load environment variables from .env file
Write-Host "📄 Loading environment variables from .env file..." -ForegroundColor Blue

if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found in current directory" -ForegroundColor Red
    exit 1
}

# Read .env file and extract production keys
$envContent = Get-Content ".env"
$PROD_APP_ID = ($envContent | Where-Object { $_ -match "^CASHFREE_PROD_APP_ID=" }) -replace "^CASHFREE_PROD_APP_ID=", "" -replace '"', ''
$PROD_SECRET_KEY = ($envContent | Where-Object { $_ -match "^CASHFREE_PROD_SECRET_KEY=" }) -replace "^CASHFREE_PROD_SECRET_KEY=", "" -replace '"', ''

# Validate that keys were found
if ([string]::IsNullOrEmpty($PROD_APP_ID) -or [string]::IsNullOrEmpty($PROD_SECRET_KEY)) {
    Write-Host "❌ Production keys not found in .env file" -ForegroundColor Red
    Write-Host "Please ensure CASHFREE_PROD_APP_ID and CASHFREE_PROD_SECRET_KEY are set in .env" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Production keys loaded successfully" -ForegroundColor Green

Write-Host "📝 Setting production environment variables..." -ForegroundColor Blue

# Set production environment variables
vercel env add CASHFREE_APP_ID $PROD_APP_ID production
vercel env add CASHFREE_SECRET_KEY $PROD_SECRET_KEY production
vercel env add CASHFREE_ENVIRONMENT "PRODUCTION" production
vercel env add VITE_CASHFREE_APP_ID $PROD_APP_ID production
vercel env add VITE_CASHFREE_ENVIRONMENT "PRODUCTION" production

Write-Host "✅ Production environment variables set successfully!" -ForegroundColor Green
Write-Host "🔄 Next deployment will use production Cashfree API keys" -ForegroundColor Yellow

# Optional: Deploy immediately
$deploy = Read-Host "Do you want to deploy now? (y/N)"
if ($deploy -eq "y" -or $deploy -eq "Y") {
    Write-Host "🚀 Deploying to production..." -ForegroundColor Blue
    vercel --prod
} else {
    Write-Host "💡 Run 'vercel --prod' when you're ready to deploy" -ForegroundColor Yellow
}
