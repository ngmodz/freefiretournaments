# Git History Rewrite Notice

## Important Notice for All Collaborators

The git history of this repository has been rewritten to remove sensitive information (Google Cloud Service Account credentials) that were accidentally committed. This action was necessary to ensure the security of our project and to comply with GitHub's secret scanning protections.

## Actions Required by All Collaborators

To continue working with this repository, **all collaborators must follow these steps**:

1. **Backup your changes**: If you have any uncommitted changes or unpushed commits, back them up separately.

2. **Delete your local copy and re-clone the repository**:
   ```powershell
   # Navigate to the parent directory of your current repository
   cd ..
   
   # Rename your current repo folder as a backup (optional)
   mv freefiretournaments freefiretournaments_backup
   
   # Clone the repository again
   git clone https://github.com/ngmodz/freefiretournaments.git
   
   # Navigate to the newly cloned repository
   cd freefiretournaments
   ```

3. **Set up your environment again**:
   - Run the `setup-env.bat` script to configure your environment variables
   - Ensure you have a proper service account key file referenced in your `.env` file
   - The `.env` file should reference the service account key file path, not contain the key directly

4. **Reapply any local changes** if necessary, but do not reintroduce any sensitive information.

## What Changed

- All Google Cloud Service Account credentials have been removed from the git history
- Scripts now load credentials from environment variables or external files
- The repository is now compliant with GitHub's secret scanning protections

## Why This Was Necessary

GitHub's secret scanning detected service account credentials in our git history, which posed a significant security risk. Even though these credentials may have been removed in the latest commits, they remained accessible in the git history.

By rewriting the history, we have ensured that these sensitive credentials are completely removed from the repository, both in the current state and in the historical commits.

## Security Best Practices Going Forward

1. Never commit sensitive information like API keys, passwords, or service account credentials
2. Always use environment variables or external files (properly gitignored) for secrets
3. If you accidentally commit sensitive information, report it immediately

If you have any questions or encounter any issues, please contact the repository maintainer.

## Technical Details of the Change

The git history was rewritten using `git filter-branch` to replace all occurrences of service account credentials with placeholder text. The entire commit history was preserved, but with the sensitive information removed.

```powershell
git checkout -b secure-history-fix
git filter-branch --tree-filter "powershell -File ./rewrite-history.ps1" --prune-empty HEAD
git push -f origin secure-history-fix
git checkout master
git reset --hard secure-history-fix
git push -f origin master
```
