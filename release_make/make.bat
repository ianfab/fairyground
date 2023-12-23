@echo off
SETLOCAL ENABLEEXTENSIONS
cd /d "%~dp0"
rd /s /q .\release-builds
md .\release-builds || goto error
md .\release-builds\win || goto error
md .\release-builds\linux || goto error
(start /wait "" npm install -g pkg ^& exit) || goto error
(start /wait "" pkg . --target win --output .\release-builds\win\FairyGround.exe ^& exit) || goto error
(start /wait "" pkg . --target linux --output .\release-builds\linux\FairyGround ^& exit) || goto error
cd ..
(start /wait "" npm run buildwithcmd ^& exit) || goto error
xcopy .\public .\release_make\release-builds\win\public /E /H /C /I || goto error
xcopy .\public .\release_make\release-builds\linux\public /E /H /C /I || goto error
echo Release build finished. Check "%~dp0release-builds\" to see the results.
pause
exit /b 0

:error
echo Release build failed.
pause
exit /b 1