#!/bin/bash

function Error() {
    echo Release build failed.
    echo "Press any key to continue..."
    read -n 1
    echo
    exit 1
}

export nodeversion="node18"

rm -rf ./ldid
git clone https://github.com/daeken/ldid.git || Error
cd ldid
./make.sh
cd ..
export PATH="$PATH:$(pwd)/ldid"

rm -rf ./release-builds
mkdir -p ./release-builds/win/x64
mkdir -p ./release-builds/linux/x64
mkdir -p ./release-builds/win/arm64
mkdir -p ./release-builds/linux/arm64
mkdir -p ./release-builds/macos/x64
mkdir -p ./release-builds/macos/arm64

npm install -g pkg

function TryNoByteCode() {
    pkg . --no-bytecode --public --public-packages --target $1 --output $2 >/tmp/make_fairyground.log 2>&1
    if [ "$(grep 'Error' /tmp/make_fairyground.log)" != "" ]; then
        echo Error: Build failed. Check the log below to see what\'s going on. File: /tmp/make_fairyground.log
        cat /tmp/make_fairyground.log
        return 11
    fi
    return 0
}

function Make() {
    pkg . --target $1 --output $2 >/tmp/make_fairyground.log 2>&1
    if [ "$(grep 'Error' /tmp/make_fairyground.log)" != "" ]; then
        echo Error: Build failed. Check the log below to see what\'s going on. File: /tmp/make_fairyground.log
        cat /tmp/make_fairyground.log
        return 11
    fi
    if [ "$(grep 'Failed to make bytecode' /tmp/make_fairyground.log)" != "" ]; then
        echo "Fail: Bytecode generation failed. Trying --no-bytecode..."
        TryNoByteCode $1 $2
        if [ $? -eq 11 ]; then
            return 11
        fi
    fi
    echo "Pass: $1"
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
npm run build
cp -r ./public ./release_make/release-builds/win/x64/
cp -r ./public ./release_make/release-builds/linux/x64/
cp -r ./public ./release_make/release-builds/win/arm64/
cp -r ./public ./release_make/release-builds/linux/arm64/
cp -r ./public ./release_make/release-builds/macos/x64/
cp -r ./public ./release_make/release-builds/macos/arm64/
echo -e "Release build finished."
echo "Press any key to continue..."
read -n 1
echo
exit 0
