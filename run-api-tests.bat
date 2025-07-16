@echo off
echo 🚀 FreeFire Tournaments - Comprehensive API Health Check
echo ==================================================

echo.
echo 📦 Installing test dependencies...
npm install --save-dev firebase@^10.7.1 node-fetch@^3.3.2 dotenv@^16.3.1 cross-env@^7.0.3

echo.
echo 🧪 Running comprehensive API tests...
echo This will test every single API endpoint in your application
echo.

node final-api-test.js

echo.
echo ✅ Test execution completed!
echo Check the output above for detailed results.
echo.

if %ERRORLEVEL% EQU 0 (
    echo 🎉 All critical systems are working!
) else (
    echo ⚠️ Some issues detected - see report above for details
)

echo.
pause
