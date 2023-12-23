# Fairyground Release Maker

Here you can make releases of fairyground by packaging node.js runtime and distribute it to others without installing node.js. It is a one-click-to-run executable.

It only packages the server. Unlike using frameworks like electron, users still need to open the HTML in their browsers.

This directory is independent of its parent. You don't need to change anything here if you are only making changes to fairyground (in the parent directory).

Running make scripts here will apply the changes you have made in fairyground at once.

## Usage

First install dependencies in the parent directory.

Install dependencies in this directory (Make sure that the working directory is this directory!)

```bash
npm install
```

Run make script (Make sure that the working directory is this directory!)

```batch
::Windows
make.bat
```
```bash
#Linux
./make.sh
```

If no errors occurred, you should see the make results at .\release-builds, containing both linux and windows version. You can see the binary files in "win" and "linux" directory.

You can execute these binary executables to check if it's working correctly.

Then you can put the "release-builds" directory into an archive (TAR.GZ, ZIP or others) and publish this release.
