# Demo Video for Auth Modal

The auth modal displays a video demonstration of the game creation process.

## Required Files

Place your demo video in this directory with one of these filenames:
- `demo-game-creation.webm` (preferred for web)
- `demo-game-creation.mp4` (fallback)

## Video Specifications

- **Aspect Ratio**: 16:9 (standard video aspect ratio)
- **Recommended Resolution**: 1280x720 or 1920x1080
- **Duration**: 10-30 seconds (will loop)
- **Content**: Show the game creation process - typing a description, clicking generate, and seeing the game come to life

## Creating the Video

You can:
1. Screen record your game creation process
2. Use a screen recording tool like:
   - macOS: QuickTime Player or Screenshot.app
   - Windows: Xbox Game Bar or OBS Studio
   - Cross-platform: OBS Studio

## Converting to WebM

For best web performance, convert to WebM:

```bash
# Using ffmpeg
ffmpeg -i demo-game-creation.mp4 -c:v libvpx-vp9 -b:v 1M -c:a libopus demo-game-creation.webm
```

## Fallback

If no video is found, the modal will show a placeholder with a video icon.

