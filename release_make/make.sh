#!/bin/bash

rm -rf ./release-builds
mkdir -p ./release-builds/win
mkdir -p ./release-builds/linux
npm install -g pkg
pkg . --target win --output ./release-builds/win/FairyGround.exe
pkg . --target linux --output ./release-builds/linux/FairyGround
cd ..
npm run build
cp -r ./public ./release_make/release-builds/win/
cp -r ./public ./release_make/release-builds/linux/
echo -e "Release build finished."
pause
