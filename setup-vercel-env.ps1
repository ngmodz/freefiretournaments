# PowerShell script to automate adding environment variables to Vercel without prompts

# Create a .vercel-env directory to store temporary files
if (-not (Test-Path ".vercel-env")) {
    New-Item -ItemType Directory -Path ".vercel-env" | Out-Null
}

# Function to extract environment variables from .env file
function Extract-EnvVars {
    param (
        [string]$envFilePath
    )
    
    $envContent = Get-Content -Path $envFilePath -Raw
    $regex = '(?m)^([^#][^=]+)=(.+?)(?=\r?\n[^#][^=]+=|\r?\n*$)'
    $regexMatches = [regex]::Matches($envContent, $regex)
    
    $envVars = @{}
    
    foreach ($match in $regexMatches) {
        $key = $match.Groups[1].Value.Trim()
        $value = $match.Groups[2].Value.Trim()
        
        # Skip commented lines or empty keys
        if ($key -match '^\s*#' -or $key -eq '') {
            continue
        }
        
        # Remove quotes if present
        $value = $value -replace '^"(.*)"$', '$1'
        
        # Skip the SERVICE_ACCOUNT_KEY_PATH as we'll use the actual JSON content instead
        if ($key -eq 'SERVICE_ACCOUNT_KEY_PATH') {
            continue
        }
        
        $envVars[$key] = $value
    }
    
    return $envVars
}

# Extract environment variables
$envVars = Extract-EnvVars -envFilePath ".env"

# Process each environment variable
foreach ($key in $envVars.Keys) {
    $value = $envVars[$key]
    
    # File to store the environment variable value
    $envFile = ".vercel-env/$key.env"
    
    # Write the value to the file
    Set-Content -Path $envFile -Value $value -NoNewline
    
    # Add to development environment
    Write-Host "Adding $key to development environment..."
    Get-Content -Path $envFile | & npx vercel env add $key development
    
    # Add to preview environment
    Write-Host "Adding $key to preview environment..."
    Get-Content -Path $envFile | & npx vercel env add $key preview
    
    # Add to production environment
    Write-Host "Adding $key to production environment..."
    Get-Content -Path $envFile | & npx vercel env add $key production
}

# Handle the Firebase service account specifically
$envContent = Get-Content -Path ".env" -Raw
$regex = '(?m)^SERVICE_ACCOUNT_KEY_PATH=(.+?)(?=\r?\n[^#][^=]+=|\r?\n*$)'
$match = [regex]::Match($envContent, $regex)

if ($match.Success) {
    $serviceAccountPath = $match.Groups[1].Value.Trim()
    $serviceAccountPath = $serviceAccountPath -replace '^"(.*)"$', '$1'
    
    Write-Host "Service account path: $serviceAccountPath"
    
    # Read the service account JSON file
    if (Test-Path $serviceAccountPath) {
        $serviceAccountContent = Get-Content -Path $serviceAccountPath -Raw
        $serviceAccountFile = ".vercel-env/FIREBASE_SERVICE_ACCOUNT.json"
        
        # Write the service account content to a file
        Set-Content -Path $serviceAccountFile -Value $serviceAccountContent -NoNewline
        
        # Add to development environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to development environment..."
        Get-Content -Path $serviceAccountFile | & npx vercel env add FIREBASE_SERVICE_ACCOUNT development
        
        # Add to preview environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to preview environment..."
        Get-Content -Path $serviceAccountFile | & npx vercel env add FIREBASE_SERVICE_ACCOUNT preview
        
        # Add to production environment
        Write-Host "Adding FIREBASE_SERVICE_ACCOUNT to production environment..."
        Get-Content -Path $serviceAccountFile | & npx vercel env add FIREBASE_SERVICE_ACCOUNT production
    } else {
        Write-Host "Service account file not found at path: $serviceAccountPath"
    }
} else {
    Write-Host "SERVICE_ACCOUNT_KEY_PATH not found in .env file"
}

# Clean up the temporary files
Remove-Item -Path ".vercel-env" -Recurse -Force

Write-Host "All environment variables have been added to Vercel!"
