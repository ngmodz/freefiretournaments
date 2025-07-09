@echo off
echo Running Tournament Notifications Check...
cd %~dp0
node --no-warnings scripts/send-tournament-notifications.js
echo Completed notification check. 