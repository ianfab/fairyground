#!/bin/zsh

function Error() {
    echo Release build failed.
    echo "Press Enter to continue..."
    read -n 1
    echo
    exit 1
}

export nodeversion="node20"

if [ -d "./node_modules" ]; then
    echo
else
    echo "Please run \"npm install\" in this directory first."
    Error
fi

echo "Make sure that you have run \"npm install\" and \"node_modules\" folder exists in the root folder before running this script."
echo "What is the CPU architecture of your build platform (This computer)? (Enter x86_64 or ARM64)"
read input || export input=null
if [ "$input" = "ARM64" ]; then
    export arch=arm64
elif [ "$input" = "x86_64" ]; then
    export arch=x64
else
    echo Bad input. Build failed.
    echo "Press Enter to continue..."
    read -n 1
    echo
    exit 1
fi

export PATH="$PATH:$(pwd)/ldid/macos/$arch"

rm -rf ./release-builds
mkdir -p ./release-builds/win/x64
mkdir -p ./release-builds/linux/x64
mkdir -p ./release-builds/win/arm64
mkdir -p ./release-builds/linux/arm64
mkdir -p ./release-builds/macos/x64
mkdir -p ./release-builds/macos/arm64
mkdir -p ./release-builds/script/any

npm install @yao-pkg/pkg@5.16.1 || Error

function TryNoByteCode() {
    npx pkg . --no-bytecode --public --public-packages --target $1 --output $2 >/tmp/make_fairyground.log 2>&1
    if [ "$(grep 'Error' /tmp/make_fairyground.log)" != "" ]; then
        echo Error: Build failed. Check the log below to see what\'s going on. File: /tmp/make_fairyground.log
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
        echo "Fail: Bytecode generation failed. Trying --no-bytecode..."
        TryNoByteCode $1 $2
        if [ $? -eq 11 ]; then
            return 11
        fi
        echo "Pass: $1"
        return 0
    fi
    if [ "$(grep 'Failed to make bytecode' /tmp/make_fairyground.log)" != "" ]; then
        echo "Fail: Bytecode generation failed. Trying --no-bytecode..."
        TryNoByteCode $1 $2
        if [ $? -eq 11 ]; then
            return 11
        fi
        echo "Pass: $1"
        return 0
    fi
    if [ "$(grep 'Warning' /tmp/make_fairyground.log)" != "" ]; then
        cat /tmp/make_fairyground.log
    fi
    echo "Pass: $1"
    return 0
}

node make_index.js > ./index.js

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
npm run build || Error
cp -r ./public ./release_make/release-builds/win/x64/
cp -r ./public ./release_make/release-builds/linux/x64/
cp -r ./public ./release_make/release-builds/win/arm64/
cp -r ./public ./release_make/release-builds/linux/arm64/
cp -r ./public ./release_make/release-builds/macos/x64/
cp -r ./public ./release_make/release-builds/macos/arm64/
cp -r ./public ./release_make/release-builds/script/any/
cp -r ./release_make/node_modules ./release_make/release-builds/script/any/node_modules
cp ./release_make/index.js ./release_make/release-builds/script/any/server.js
echo "node server.js" > ./release_make/release-builds/script/any/Fairyground_Linux_macOS.sh
echo "node server.js" > ./release_make/release-builds/script/any/Fairyground_Windows.bat
echo "Follow steps below to use:" > ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "1. Install node.js at https://nodejs.org/en/download. Find the version that meets your OS and CPU architecture." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "2. After installation, run \"Fairyground_Windows.bat\" if you are on Windows or \"Fairyground_Linux_macOS.sh\" if on Linux/macOS." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "3. The webpage should automatically be opened. If not, open browser and go to http://localhost:5015" >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "" >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "If it does not work, please check your node.js installation and make sure that port 5015 is free." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt

echo -e "Release build finished."
echo "[Warning] The macOS executables are not suitably signed yet. If you want them to work, you need to be an Apple Developer and sign it with your signing certificate."
echo "[Warning] Use codesign on macOS to sign your executable. If you don't have a Mac, you can use a virtual machine."
echo "[Warning] If you want to build a macOS virtual machine, please visit https://www.sysnettechsolutions.com/en/install-macos-vmware/"
echo "Press Enter to continue..."
read -n 1
echo
exit 0
