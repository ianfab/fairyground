#!/bin/bash

echo "[Warning] This script is intended to be run in Github Actions for continuous integration purposes."
echo "[Warning] If this is your own platform instead of Github Actions platform, use \"./make.sh\"."

function Error() {
    echo "[Error] CI build test failed."
    exit 1
}

export nodeversion="node20"

echo ""
echo "[Info] Continuous integration platform specification:"
echo "CPU:"
lscpu
echo ""
echo "Memory:"
lsmem
echo ""
echo "Disk:"
df -h
echo ""

physical_cpus=$(grep 'physical id' /proc/cpuinfo | sort -u | wc -l)
cores_per_cpu=$(grep 'cpu cores' /proc/cpuinfo | uniq | awk -F: '{print $2}')
total_cores=$((physical_cpus * cores_per_cpu))
thread_count=$(grep -c "^processor" /proc/cpuinfo)
echo "Total CPU cores: $total_cores"
echo "Total CPU threads: $thread_count"
echo ""

echo "[Info] Continuous integration starts."

sudo apt -y install p7zip-full || Error

if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count -xr!release_make -xr!.git ./source.7z ./* || Error
fi

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
mkdir -p ./release-builds/script/any

npm install || Error
cp -r ./node_modules ./node_modules_script
npm install @yao-pkg/pkg@5.16.1 || Error

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

node make_index.js > ./index.js

Make "$nodeversion"-win-x64 ./release-builds/win/x64/FairyGround.exe
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-linux-x64 ./release-builds/linux/x64/FairyGround
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-win-arm64 ./release-builds/win/arm64/FairyGround.exe
if [ $? -eq 11 ]; then Error; fi
Make "$nodeversion"-linux-arm64 ./release-builds/linux/arm64/FairyGround
if [ $? -eq 11 ]; then Error; fi
#Make "$nodeversion"-macos-x64 ./release-builds/macos/x64/FairyGround.app
#if [ $? -eq 11 ]; then Error; fi
#Make "$nodeversion"-macos-arm64 ./release-builds/macos/arm64/FairyGround.app
#if [ $? -eq 11 ]; then Error; fi

cd ..
npm install || Error
npm run build || Error

rm -f ./public/vercel.json
rm -f ./public/serve.json
rm -f ./public/_headers
find ./public -type f -name "original.*" -exec rm -f {} \;

cp -r ./public ./release_make/release-builds/win/x64/
cp -r ./public ./release_make/release-builds/linux/x64/
cp -r ./public ./release_make/release-builds/win/arm64/
cp -r ./public ./release_make/release-builds/linux/arm64/
#cp -r ./public ./release_make/release-builds/macos/x64/
#cp -r ./public ./release_make/release-builds/macos/arm64/
cp -r ./public ./release_make/release-builds/script/any/
cp -r ./release_make/node_modules_script ./release_make/release-builds/script/any/node_modules
cp ./release_make/index.js ./release_make/release-builds/script/any/server.js
echo "node server.js" > ./release_make/release-builds/script/any/Fairyground_Linux_macOS.sh
echo "node server.js" > ./release_make/release-builds/script/any/Fairyground_Windows.bat
echo "Follow steps below to use:" > ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "1. Install node.js at https://nodejs.org/en/download. Find the version that meets your OS and CPU architecture." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "2. After installation, run \"Fairyground_Windows.bat\" if you are on Windows or \"Fairyground_Linux_macOS.sh\" if on Linux/macOS." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "3. The webpage should automatically be opened. If not, open browser and go to http://localhost:5015" >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "" >> ./release_make/release-builds/script/any/HOW_TO_USE.txt
echo "If it does not work, please check your node.js installation and make sure that port 5015 is free." >> ./release_make/release-builds/script/any/HOW_TO_USE.txt

echo "[Info] CI build test OK."

if [ "$GITHUB_EVENT_NAME" != "pull_request" ]; then
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count ./release_make/release-builds/win/x64/fairyground.7z ./release_make/release-builds/win/x64/* || Error
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count ./release_make/release-builds/linux/x64/fairyground.7z ./release_make/release-builds/linux/x64/* || Error
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count ./release_make/release-builds/win/arm64/fairyground.7z ./release_make/release-builds/win/arm64/* || Error
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count ./release_make/release-builds/linux/arm64/fairyground.7z ./release_make/release-builds/linux/arm64/* || Error
    7za a -y -t7z -m0=lzma2 -mx=9 -mfb=256 -md=256m -ms=on -mmt=$thread_count ./release_make/release-builds/script/any/fairyground.7z ./release_make/release-builds/script/any/* || Error

    echo "[Info] Artifacts are ready. Pending upload..."
else
    echo "[Notice] Artifacts are not uploaded in pull requests."
fi

exit 0
