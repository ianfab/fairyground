@echo off
SETLOCAL ENABLEEXTENSIONS
set nodeversion=node18
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
(start /wait "" npm install -g pkg ^&^& exit) || goto error

call :Make %nodeversion%-win-x64 .\release-builds\win\x64\FairyGround.exe
if "%errorlevel%"=="11" (goto error)
call :Make %nodeversion%-linux-x64 .\release-builds\linux\x64\FairyGround
if "%errorlevel%"=="11" (goto error)
call :Make %nodeversion%-win-arm64 .\release-builds\win\arm64\FairyGround.exe
if "%errorlevel%"=="11" (goto error)
call :Make %nodeversion%-linux-arm64 .\release-builds\linux\arm64\FairyGround
if "%errorlevel%"=="11" (goto error)
call :Make %nodeversion%-macos-x64 .\release-builds\macos\x64\FairyGround.app
if "%errorlevel%"=="11" (goto error)
call :Make %nodeversion%-macos-arm64 .\release-builds\macos\arm64\FairyGround.app
if "%errorlevel%"=="11" (goto error)

cd ..
(start /wait "" npm run buildwithcmd ^&^& exit) || goto error
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

:Make
start /WAIT "" cmd.exe /C ^(pkg . --target %~1 --output %2 ^& exit ^) ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Error: Build failed. Check the log below to see what's going on. File: %TEMP%\make_fairyground.log
    type %TEMP%\make_fairyground.log
    exit /b 11
)
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Failed to make bytecode" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Fail： Bytecode generation failed. Trying --no-bytecode...
    call :TryNoByteCode %~1 %2
    if "%errorlevel%"=="11" (exit /b 11)
)
echo Pass: %~1
exit /b 0

:TryNoByteCode
set PATH=%PATH%;%~dp0ldid\win_x64
start /WAIT "" cmd.exe /C ^(pkg . --no-bytecode --public --public-packages --target %~1 --output %2 ^& exit ^)  ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Error: Build failed. Check the log below to see what's going on. File: %TEMP%\make_fairyground.log
    type %TEMP%\make_fairyground.log
    exit /b 11
)
exit /b 0