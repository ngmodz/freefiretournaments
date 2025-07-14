@echo off
REM Script to easily update host status for users
REM Usage: update-host-status.bat <email> <true|false>

if "%~2"=="" (
    echo.
    echo Usage: update-host-status.bat ^<email^> ^<true^|false^>
    echo.
    echo Examples:
    echo   update-host-status.bat user@example.com true
    echo   update-host-status.bat user@example.com false
    echo.
    goto :eof
)

echo Running host status update script...
cd /d "%~dp0"
node update-host-status.js %1 %2

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Host status update completed successfully!
) else (
    echo.
    echo ❌ Host status update failed. Check the output above for details.
)

pause
