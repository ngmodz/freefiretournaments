# PowerShell script to rewrite git history and remove sensitive information

# Identify the private key pattern
$privateKeyPattern = '-----BEGIN PRIVATE KEY-----[\s\S]*?-----END PRIVATE KEY-----'
$placeholderKey = '-----BEGIN PRIVATE KEY-----
REDACTED_PRIVATE_KEY
-----END PRIVATE KEY-----'

# Identify the service account credential pattern
$credentialPattern = '"\s*type\s*":\s*"\s*service_account\s*",[\s\S]*?"private_key":\s*"[^"]*",[\s\S]*?"client_email":\s*"[^"]*",[\s\S]*?"client_id":\s*"[^"]*"'
$placeholderCredential = '"type": "service_account", "project_id": "project-id-redacted", "private_key": "REDACTED", "client_email": "redacted@example.com", "client_id": "redacted"'

# Target files to fix
$targetFiles = @(
    "scripts/create-automatic-test-tournament.js",
    "scripts/create-fully-automatic-tournament.js",
    "scripts/create-immediate-notification-tournament.js",
    "scripts/create-second-test-tournament.js",
    "scripts/update-tournament-time.js",
    "scripts/create-test-data-admin.js"
)

Write-Host "Starting Git history rewrite process..."
Write-Host "This will rewrite history to remove sensitive credentials."
Write-Host "Target files: $($targetFiles -join ', ')"

# First, create a branch to work on
git checkout -b secure-history-fix

# For each target file, run a filter-branch operation
foreach ($file in $targetFiles) {
    if (Test-Path $file) {
        Write-Host "Processing $file..."
        
        # Create a temporary file with the replacement script
        $tempScriptPath = [System.IO.Path]::GetTempFileName() + ".ps1"
        @"
param(`$blobId)
`$content = git cat-file -p `$blobId
if (`$content -match '$privateKeyPattern') {
    `$content = `$content -replace '$privateKeyPattern', '$placeholderKey'
}
if (`$content -match '$credentialPattern') {
    `$content = `$content -replace '$credentialPattern', '$placeholderCredential'
}
`$content
"@ | Out-File -FilePath $tempScriptPath -Encoding utf8

        # Use git filter-branch to rewrite history for this file
        git filter-branch --force --tree-filter "if [ -f '$file' ]; then powershell -ExecutionPolicy Bypass -File '$tempScriptPath' HEAD:'$file' > '$file.tmp' && mv '$file.tmp' '$file'; fi" HEAD
        
        # Clean up
        Remove-Item $tempScriptPath
    } else {
        Write-Host "File $file not found, skipping..."
    }
}

Write-Host "History rewrite complete."
Write-Host "If everything looks good, you can push with 'git push origin secure-history-fix --force'"
Write-Host "IMPORTANT: After pushing, all team members should clone the repository fresh to avoid issues."
