# PowerShell script to add environment variables from .env to Vercel

# Read the .env file
$envContent = Get-Content -Path '.env' -Raw

# Parse the content using regular expressions to handle multi-line values
$regex = '(?m)^([^#][^=]+)=(.+?)(?=\r?\n[^#][^=]+=|\r?\n*$)'
$regexMatches = [regex]::Matches($envContent, $regex)

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
    
    Write-Host "Adding $key to Vercel..."
    
    # Create a temporary file with the value
    $tempFile = [System.IO.Path]::GetTempFileName()
    Set-Content -Path $tempFile -Value $value -NoNewline
    
    # Add to development environment without prompting
    Write-Host "Adding $key to development environment..."
    Get-Content -Path $tempFile | & npx vercel env add $key development
    
    # Add to preview environment without prompting
    Write-Host "Adding $key to preview environment..."
    Get-Content -Path $tempFile | & npx vercel env add $key preview
    
    # Add to production environment without prompting
    Write-Host "Adding $key to production environment..."
    Get-Content -Path $tempFile | & npx vercel env add $key production
    
    # Remove the temporary file
    Remove-Item -Path $tempFile
    
    # Wait a bit between commands to avoid rate limiting
    Start-Sleep -Seconds 1
}

Write-Host "All environment variables have been added to Vercel!"
