#!/bin/bash

rm -rf ./release-builds
mkdir -p ./release-builds/win/x64
mkdir -p ./release-builds/linux/x64
mkdir -p ./release-builds/win/arm64
mkdir -p ./release-builds/linux/arm64
mkdir -p ./release-builds/macos/x64
mkdir -p ./release-builds/macos/arm64
npm install -g pkg
pkg . --target win-x64 --output ./release-builds/win/x64/FairyGround.exe
pkg . --target linux-x64 --output ./release-builds/linux/x64/FairyGround
pkg . --target win-arm64 --output ./release-builds/win/arm64/FairyGround.exe
pkg . --target linux-arm64 --output ./release-builds/linux/arm64/FairyGround
pkg . --target macos-x64 --output ./release-builds/macos/x64/FairyGround
pkg . --target macos-arm64 --output ./release-builds/macos/arm64/FairyGround
cd ..
npm run build
cp -r ./public ./release_make/release-builds/win/x64/
cp -r ./public ./release_make/release-builds/linux/x64/
cp -r ./public ./release_make/release-builds/win/arm64/
cp -r ./public ./release_make/release-builds/linux/arm64/
cp -r ./public ./release_make/release-builds/macos/x64/
cp -r ./public ./release_make/release-builds/macos/arm64/
echo -e "Release build finished."
pause
