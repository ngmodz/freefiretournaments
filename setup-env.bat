@echo off
echo.
echo 🚨 EMERGENCY SECURITY SETUP 🚨
echo.
echo Creating environment files from templates...
echo.

REM Create main .env file
if not exist ".env" (
    copy ".env.example" ".env"
    echo ✅ Created .env from template
) else (
    echo ⚠️ .env already exists - skipping
)

REM Create scripts .env file
if not exist "scripts\.env" (
    copy "scripts\.env.example" "scripts\.env"
    echo ✅ Created scripts\.env from template
) else (
    echo ⚠️ scripts\.env already exists - skipping
)

echo.
echo 🔥 CRITICAL: You must now:
echo.
echo 1. Go to Firebase Console and ROTATE the compromised credentials
echo 2. Edit .env files with your NEW rotated credentials
echo 3. NEVER commit .env files to version control
echo.
echo Firebase Console: https://console.firebase.google.com/project/freefire-tournaments-ba2a6/settings/serviceaccounts/adminsdk
echo.
echo Delete the compromised key with Private Key ID: 2ede2bbed81ac8e5c809ae3961bc688b455eefda
echo.
pause
