#!/bin/bash

echo "[Warning] This script is intended to be run in Github Actions for continuous integration purposes."
echo "[Warning] If this is your own platform instead of Github Actions platform, use \"./make.sh\"."

function Error() {
    echo "[Error] CI build test failed."
    exit 1
}

export nodeversion="node18"

cd ./release_make

chmod -R 744 $(pwd)/ldid

if [ "$(lscpu | grep 'x86_64')" != "" ]; then
    export PATH="$PATH:$(pwd)/ldid/linux/x64"
elif [ "$(lscpu | grep 'ARM64')" != "" ]; then
    export PATH="$PATH:$(pwd)/ldid/linux/arm64"
else
    echo Unknown CPU architecture:
    lscpu | grep 'Architecture:'
    Error
fi

rm -rf ./release-builds
mkdir -p ./release-builds/win/x64
mkdir -p ./release-builds/linux/x64
mkdir -p ./release-builds/win/arm64
mkdir -p ./release-builds/linux/arm64
mkdir -p ./release-builds/macos/x64
mkdir -p ./release-builds/macos/arm64

npm install || Error
npm install pkg || Error

function TryNoByteCode() {
    npx pkg . --no-bytecode --public --public-packages --target $1 --output $2 >/tmp/make_fairyground.log 2>&1
    if [ "$(grep 'Error' /tmp/make_fairyground.log)" != "" ]; then
        echo "[Error] CI failed. Check the log below to see what\'s going on. File: /tmp/make_fairyground.log"
        cat /tmp/make_fairyground.log
        return 11
    fi
    if [ "$(grep 'Warning' /tmp/make_fairyground.log)" != "" ]; then
        cat /tmp/make_fairyground.log
    fi
    return 0
}

function Make() {
    npx pkg . --target $1 --output $2 >/tmp/make_fairyground.log 2>&1
    if [ "$(grep 'Error' /tmp/make_fairyground.log)" != "" ]; then
        echo "[Warning] Fail: Bytecode generation failed. Trying --no-bytecode..."
        TryNoByteCode $1 $2
        if [ $? -eq 11 ]; then
            return 11
        fi
        echo "[Info] Pass: $1"
        return 0
    fi
    if [ "$(grep 'Failed to make bytecode' /tmp/make_fairyground.log)" != "" ]; then
        echo "[Warning] Fail: Bytecode generation failed. Trying --no-bytecode..."
        TryNoByteCode $1 $2
        if [ $? -eq 11 ]; then
            return 11
        fi
        echo "[Info] Pass: $1"
        return 0
    fi
    if [ "$(grep 'Warning' /tmp/make_fairyground.log)" != "" ]; then
        cat /tmp/make_fairyground.log
    fi
    echo "[Info] Pass: $1"
    return 0
}


Make "$nodeversion"-win-x64 ./release-builds/win/x64/FairyGround.exe
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-linux-x64 ./release-builds/linux/x64/FairyGround
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-win-arm64 ./release-builds/win/arm64/FairyGround.exe
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-linux-arm64 ./release-builds/linux/arm64/FairyGround
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-macos-x64 ./release-builds/macos/x64/FairyGround.app
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-macos-arm64 ./release-builds/macos/arm64/FairyGround.app
if [ $? -eq 11 ]; then Error; fi

cd ..
npm install || Error
npm run build || Error
cp -r ./public ./release_make/release-builds/win/x64/
cp -r ./public ./release_make/release-builds/linux/x64/
cp -r ./public ./release_make/release-builds/win/arm64/
cp -r ./public ./release_make/release-builds/linux/arm64/
cp -r ./public ./release_make/release-builds/macos/x64/
cp -r ./public ./release_make/release-builds/macos/arm64/
echo "[Warning] The macOS executables are not suitably signed yet. If you want them to work, you need to be an Apple Developer and sign it with your signing certificate."
echo "[Warning] Use codesign on macOS to sign your executable. If you don't have a Mac, you can use a virtual machine."
echo "[Warning] If you want to build a macOS virtual machine, please visit https://www.sysnettechsolutions.com/en/install-macos-vmware/"
echo "[Info] CI build test OK."
echo "[Info] Compressing & packing artifacts to prepare for uploading..."

cd ./release_make
mkdir artifacts

zip -9 -r ./artifacts/Windows-x86_64.zip ./release-builds/win/x64 || Error
zip -9 -r ./artifacts/Windows-ARM64.zip ./release-builds/win/arm64 || Error
zip -9 -r ./artifacts/Linux-x86_64.zip ./release-builds/linux/x64 || Error
zip -9 -r ./artifacts/Linux-ARM64.zip ./release-builds/linux/arm64 || Error

echo "[Info] Artifacts packed. Pending for upload..."
exit 0
