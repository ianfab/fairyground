@echo off
SETLOCAL ENABLEEXTENSIONS
set nodeversion=node18
cd /d "%~dp0"
rd /s /q .\release-builds
md .\release-builds || goto Error
md .\release-builds\win || goto Error
md .\release-builds\linux || goto Error
md .\release-builds\macos || goto Error
md .\release-builds\win\x64 || goto Error
md .\release-builds\linux\x64 || goto Error
md .\release-builds\win\arm64 || goto Error
md .\release-builds\linux\arm64 || goto Error
md .\release-builds\macos\x64 || goto Error
md .\release-builds\macos\arm64 || goto Error

echo What is the CPU architecture of your build platform (This computer)? (Enter x86_64 or ARM64)
set /P input=^> 
if "%input%"=="ARM64" (
    set arch=arm64
) else if "%input%"=="x86_64" (
    set arch=x64
) else (
    echo Bad input. Build failed.
    pause
    exit /b 1
)

set PATH=%PATH%;%~dp0ldid\win\%arch%

::Platforms include x86, x64, arm, arm64
set result=
start /wait "" cmd.exe /C npm install pkg ^> %TEMP%\make_fairyground.log ^& exit
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (goto Error)

call :Make %nodeversion%-win-x64 .\release-builds\win\x64\FairyGround.exe
if "%errorlevel%"=="11" (goto Error)
call :Make %nodeversion%-linux-x64 .\release-builds\linux\x64\FairyGround
if "%errorlevel%"=="11" (goto Error)
call :Make %nodeversion%-win-arm64 .\release-builds\win\arm64\FairyGround.exe
if "%errorlevel%"=="11" (goto Error)
call :Make %nodeversion%-linux-arm64 .\release-builds\linux\arm64\FairyGround
if "%errorlevel%"=="11" (goto Error)
call :Make %nodeversion%-macos-x64 .\release-builds\macos\x64\FairyGround.app
if "%errorlevel%"=="11" (goto Error)
call :Make %nodeversion%-macos-arm64 .\release-builds\macos\arm64\FairyGround.app
if "%errorlevel%"=="11" (goto Error)

cd ..
set result=
start /wait "" cmd.exe /C npm run buildwithcmd ^> %TEMP%\make_fairyground.log ^& exit
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (goto Error)

xcopy .\public .\release_make\release-builds\win\x64\public /E /H /C /I /Q || goto Error
xcopy .\public .\release_make\release-builds\linux\x64\public /E /H /C /I /Q || goto Error
xcopy .\public .\release_make\release-builds\win\arm64\public /E /H /C /I /Q || goto Error
xcopy .\public .\release_make\release-builds\linux\arm64\public /E /H /C /I /Q || goto Error
xcopy .\public .\release_make\release-builds\macos\x64\public /E /H /C /I /Q || goto Error
xcopy .\public .\release_make\release-builds\macos\arm64\public /E /H /C /I /Q || goto Error
echo Release build finished. Check "%~dp0release-builds\" to see the results.
::echo [Warning] The macOS executables are not signed yet. If you want them to work, you need to be an Apple Developer and sign it with your signing certificate.
::echo [Warning] Use codesign on macOS to sign your executable. If you don't have a Mac, you can use a virtual machine.
::echo [Warning] If you want to build a macOS virtual machine, please visit https://www.sysnettechsolutions.com/en/install-macos-vmware/
pause
exit /b 0

:Error
echo Release build failed.
pause
exit /b 1

:Make
start /WAIT "" cmd.exe /C ^(npx pkg . --target %~1 --output %2 ^& exit ^) ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Fail: Bytecode generation failed. Trying --no-bytecode...
    call :TryNoByteCode %~1 %2
    if "%errorlevel%"=="11" (exit /b 11)
)
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Failed to make bytecode" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Fail: Bytecode generation failed. Trying --no-bytecode...
    call :TryNoByteCode %~1 %2
    if "%errorlevel%"=="11" (exit /b 11)
)
echo Pass: %~1
exit /b 0

:TryNoByteCode
start /WAIT "" cmd.exe /C ^(npx pkg . --no-bytecode --public --public-packages --target %~1 --output %2 ^& exit ^)  ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Error: Build failed. Check the log below to see what's going on. File: %TEMP%\make_fairyground.log
    type %TEMP%\make_fairyground.log
    exit /b 11
)
exit /b 0