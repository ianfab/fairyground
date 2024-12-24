@echo off
SETLOCAL ENABLEEXTENSIONS
SETLOCAL ENABLEDELAYEDEXPANSION
set nodeversion=node20
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
md .\release-builds\script || goto Error
md .\release-builds\script\any || goto Error

if not exist .\node_modules (
    echo Please run "npm install" in this directory first.
    goto Error
)

echo Make sure that you have run "npm install" and "node_modules" folder exists in the root folder before running this script.
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
start /wait "" cmd.exe /C npm install @yao-pkg/pkg@5.16.1 ^> %TEMP%\make_fairyground.log ^& exit
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (goto Error)

node make_index.js>.\index.js

call :Make %nodeversion%-win-x64 .\release-builds\win\x64\FairyGround.exe
if "%ERROR%"=="1" (goto Error)
call :Make %nodeversion%-linux-x64 .\release-builds\linux\x64\FairyGround
if "%ERROR%"=="1" (goto Error)
call :Make %nodeversion%-win-arm64 .\release-builds\win\arm64\FairyGround.exe
if "%ERROR%"=="1" (goto Error)
call :Make %nodeversion%-linux-arm64 .\release-builds\linux\arm64\FairyGround
if "%ERROR%"=="1" (goto Error)
call :Make %nodeversion%-macos-x64 .\release-builds\macos\x64\FairyGround.app
if "%ERROR%"=="1" (goto Error)
call :Make %nodeversion%-macos-arm64 .\release-builds\macos\arm64\FairyGround.app
if "%ERROR%"=="1" (goto Error)

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
xcopy .\public .\release_make\release-builds\script\any\public /E /H /C /I /Q || goto Error
xcopy .\release_make\node_modules .\release_make\release-builds\script\any\node_modules /E /H /C /I /Q || goto Error
copy /Y .\release_make\index.js .\release_make\release-builds\script\any\server.js || goto Error
echo node server.js> .\release_make\release-builds\script\any\Fairyground_Linux_macOS.sh
echo node server.js> .\release_make\release-builds\script\any\Fairyground_Windows.bat
echo Follow steps below to use:> .\release_make\release-builds\script\any\HOW_TO_USE.txt
echo 1. Install node.js at https://nodejs.org/en/download. Find the version that meets your OS and CPU architecture.>> .\release_make\release-builds\script\any\HOW_TO_USE.txt
echo 2. After installation, run "Fairyground_Windows.bat" if you are on Windows or "Fairyground_Linux_macOS.sh" if on Linux/macOS.>> .\release_make\release-builds\script\any\HOW_TO_USE.txt
echo 3. The webpage should automatically be opened. If not, open browser and go to http://localhost:5015>> .\release_make\release-builds\script\any\HOW_TO_USE.txt
echo.>> .\release_make\release-builds\script\any\HOW_TO_USE.txt
echo If it does not work, please check your node.js installation and make sure that port 5015 is free.>> .\release_make\release-builds\script\any\HOW_TO_USE.txt


echo Release build finished. Check "%~dp0release-builds\" to see the results.
echo [Warning] The macOS executables are not suitably signed yet. If you want them to work, you need to be an Apple Developer and sign it with your signing certificate.
echo [Warning] Use codesign on macOS to sign your executable. If you don't have a Mac, you can use a virtual machine.
echo [Warning] If you want to build a macOS virtual machine, please visit https://www.sysnettechsolutions.com/en/install-macos-vmware/
pause
exit /b 0

:Error
echo Release build failed.
pause
exit /b 1

:Make
set ERROR=0
start /WAIT /MIN "" cmd.exe /C ^(npx pkg . --target %~1 --output %2 ^& exit ^) ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Fail: Bytecode generation failed. Trying --no-bytecode...
    call :TryNoByteCode %~1 %2
    if "!ERROR!"=="1" (
        exit /b 1
    )
    echo Pass: %~1
    exit /b 0
)
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Failed to make bytecode" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Fail: Bytecode generation failed. Trying --no-bytecode...
    call :TryNoByteCode %~1 %2
    if "!ERROR!"=="1" (
        exit /b 1
    )
    echo Pass: %~1
    exit /b 0
)
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Warning" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    type "%TEMP%\make_fairyground.log"
)
echo Pass: %~1
exit /b 0

:TryNoByteCode
start /WAIT /MIN "" cmd.exe /C ^(npx pkg . --no-bytecode --public --public-packages --target %~1 --output %2 ^& exit ^)  ^> %TEMP%\make_fairyground.log 2^>^&1
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Error" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    echo Error: Build failed. Check the log below to see what's going on. File: %TEMP%\make_fairyground.log
    type "%TEMP%\make_fairyground.log"
    set ERROR=1
    exit /b 1
)
set result=
FOR /F "usebackq" %%i IN (`findstr /L /I "Warning" "%TEMP%\make_fairyground.log"`) DO set result=%%i
if not "%result%"=="" (
    type "%TEMP%\make_fairyground.log"
)
exit /b 0