@echo off
SETLOCAL ENABLEEXTENSIONS
cd /d "%~dp0"
rd /s /q .\release-builds
md .\release-builds || goto error
md .\release-builds\win || goto error
md .\release-builds\linux || goto error
md .\release-builds\macos || goto error
md .\release-builds\win\x64 || goto error
md .\release-builds\linux\x64 || goto error
md .\release-builds\win\arm64 || goto error
md .\release-builds\linux\arm64 || goto error
md .\release-builds\macos\x64 || goto error
md .\release-builds\macos\arm64 || goto error

::Platforms include x86, x64, arm, arm64
(start /wait "" npm install -g pkg ^& exit) || goto error
(start /wait "" pkg . --target win-x64 --output .\release-builds\win\x64\FairyGround.exe ^& exit) || goto error
(start /wait "" pkg . --target linux-x64 --output .\release-builds\linux\x64\FairyGround ^& exit) || goto error
(start /wait "" pkg . --target win-arm64 --output .\release-builds\win\arm64\FairyGround.exe ^& exit) || goto error
(start /wait "" pkg . --target linux-arm64 --output .\release-builds\linux\arm64\FairyGround ^& exit) || goto error
(start /wait "" pkg . --target macos-x64 --output .\release-builds\macos\x64\FairyGround ^& exit) || goto error
(start /wait "" pkg . --target macos-arm64 --output .\release-builds\macos\arm64\FairyGround ^& exit) || goto error
cd ..
(start /wait "" npm run buildwithcmd ^& exit) || goto error
xcopy .\public .\release_make\release-builds\win\x64\public /E /H /C /I /Q || goto error
xcopy .\public .\release_make\release-builds\linux\x64\public /E /H /C /I /Q || goto error
xcopy .\public .\release_make\release-builds\win\arm64\public /E /H /C /I /Q || goto error
xcopy .\public .\release_make\release-builds\linux\arm64\public /E /H /C /I /Q || goto error
xcopy .\public .\release_make\release-builds\macos\x64\public /E /H /C /I /Q || goto error
xcopy .\public .\release_make\release-builds\macos\arm64\public /E /H /C /I /Q || goto error
echo Release build finished. Check "%~dp0release-builds\" to see the results.
pause
exit /b 0

:error
echo Release build failed.
pause
exit /b 1
