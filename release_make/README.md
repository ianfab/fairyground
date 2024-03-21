# Fairyground Release Maker

Here you can make releases of fairyground by packaging node.js runtime and distribute it to others without installing node.js. It is a one-click-to-run executable.

It only packages the server. Unlike using frameworks like electron, users still need to open the HTML in their browsers.

This directory is independent of its parent. You don't need to change anything here if you are only making changes to fairyground (in the parent directory).

Running make scripts here will apply the changes you have made in fairyground at once.

## Usage

Make sure that you have read & execute permission of this directory and its sub directories.

First install dependencies in the parent directory (The root directory of fairyground). If you have done this before, you can skip this step.

```bash
#In the parent directory
npm install
```

Install dependencies in this directory (Make sure that the working directory is this directory, same as the directory where this document is placed.). If you have done this before, you can skip this step.

```bash
#In this directory
npm install
```

Run make script (Make sure that the working directory is this directory, same as the directory where this document is placed.)

```batch
::If your build platform is Windows
make.bat
```
```bash
#If your build platform is Linux
./make.sh
```
```zsh
#If your build platform is macOS
./make_macos.sh
```

If no errors occurred, you should see the make results at .\release-builds, containing linux, windows and macOS versions. You can see the binary files in "win", "macos" and "linux" directory.

You can execute these binary executables to check if it's working correctly.

Note that macOS executables may be killed on launch due to signature problems. If this occurs, you will need to use codesign or ldid utility to sign the executable.

If you want to run macOS in a virtual machine, you can visit [https://www.sysnettechsolutions.com/en/install-macos-vmware/](https://www.sysnettechsolutions.com/en/install-macos-vmware/) for guidance.

Then you can put the "release-builds" directory into an archive (TAR.GZ, ZIP or others) and publish this release.

