# PowerShell script to add Firebase service account to Vercel

# Read the service account file path from .env
$envContent = Get-Content -Path '.env' -Raw
$regex = '(?m)^SERVICE_ACCOUNT_KEY_PATH=(.+?)(?=\r?\n[^#][^=]+=|\r?\n*$)'
$match = [regex]::Match($envContent, $regex)

if ($match.Success) {
    $serviceAccountPath = $match.Groups[1].Value.Trim()
    $serviceAccountPath = $serviceAccountPath -replace '^"(.*)"$', '$1'
    
    Write-Host "Service account path: $serviceAccountPath"
    
    # Read the service account JSON file
    if (Test-Path $serviceAccountPath) {
        $serviceAccountContent = Get-Content -Path $serviceAccountPath -Raw
        
        # Add to development environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to development environment..."
        $serviceAccountContent | npx vercel env add FIREBASE_SERVICE_ACCOUNT development
        
        # Add to preview environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to preview environment..."
        $serviceAccountContent | npx vercel env add FIREBASE_SERVICE_ACCOUNT preview
        
        # Add to production environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to production environment..."
        $serviceAccountContent | npx vercel env add FIREBASE_SERVICE_ACCOUNT production
        
        Write-Host "Firebase service account has been added to all Vercel environments!"
    } else {
        Write-Host "Service account file not found at path: $serviceAccountPath"
    }
} else {
    Write-Host "SERVICE_ACCOUNT_KEY_PATH not found in .env file"
}
