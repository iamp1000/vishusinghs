# VishuSingh

An Apple Music Sing-inspired karaoke experience for Spotify Desktop.

VishuSingh is an experimental Spicetify custom app with a dedicated karaoke-style page, synchronized lyric lookup, immersive mode, album art, and native Spotify playback controls. It is an independent project and is not affiliated with Apple or Spotify.

> **Status: early development.** The interface and lyric lookup are implemented on the feat/spicetify-integration branch, but have not yet been validated in a local Spotify installation. Real-time vocal removal is NOT available in the Spicetify app yet. The slider is intentionally disabled until a supported audio capture/mixing path is proven.

## Features
- Sing-focused dark interface with album artwork and immersive mode.
- Timed lyrics from LRCLIB when available; plain-lyrics fallback.
- Click a timed lyric line to seek playback.
- Spotify play/pause, previous/next, progress, and seeking controls.
- Responsive layout and explicit loading/error states.
- No fake vocal slider: audio processing is marked unavailable until it works.

## Install in Spicetify on Windows

### Requirements
- Spotify desktop app (not the web player).
- Spicetify CLI installed and working: https://spicetify.app/docs/getting-started

Confirm your setup in PowerShell:

    spicetify --version

If this is a fresh setup, finish Spicetify's initial installation and backup/apply steps before installing custom apps.

### 1. Download the app
1. Open this repository on GitHub and select the feat/spicetify-integration branch.
2. Click Code → Download ZIP and extract the archive.
3. Open the extracted folder and locate spicetify/vishusingh.
4. Copy the entire vishusingh folder into:

    %appdata%\spicetify\CustomApps\

The final paths must be directly inside the app folder:

    %appdata%\spicetify\CustomApps\vishusingh\manifest.json
    %appdata%\spicetify\CustomApps\vishusingh\index.js
    %appdata%\spicetify\CustomApps\vishusingh\style.css

Do not accidentally create CustomApps\vishusingh\spicetify\vishusingh.

### 2. Enable it
Completely exit Spotify, including from the system tray. Open PowerShell and run:

    spicetify config custom_apps vishusingh
    spicetify apply

Start Spotify again and open VishuSingh from the sidebar. The config command appends the app to the existing custom-app list; it should not remove other custom apps.

### Install from a Git clone (alternative)
Run in PowerShell from the directory where you want to store the project:

    git clone --branch feat/spicetify-integration https://github.com/iamp1000/vishusinghs.git
    $source = Join-Path (Get-Location) 'vishusinghs\spicetify\vishusingh'
    $target = Join-Path $env:APPDATA 'spicetify\CustomApps\vishusingh'
    New-Item -ItemType Directory -Force -Path $target | Out-Null
    Copy-Item -Path (Join-Path $source '*') -Destination $target -Recurse -Force

Then close Spotify and run:

    spicetify config custom_apps vishusingh
    spicetify apply

### Linux / macOS
Copy the spicetify/vishusingh folder to ~/.config/spicetify/CustomApps/vishusingh, close Spotify, then run:

    spicetify config custom_apps vishusingh
    spicetify apply

## Update
Replace the contents of your installed CustomApps/vishusingh folder with the newest files from the branch. Close Spotify first, then run spicetify apply and relaunch Spotify.

## Uninstall
Run in PowerShell:

    spicetify config custom_apps vishusingh-
    spicetify apply

Then optionally delete %appdata%\spicetify\CustomApps\vishusingh. The trailing hyphen removes the app from Spicetify's enabled list.

## Troubleshooting
**App is missing from the sidebar**
- Check that manifest.json and index.js are directly inside CustomApps\vishusingh.
- Run spicetify config custom_apps and confirm vishusingh is listed.
- Fully exit Spotify, run spicetify apply, and restart.

**Blank page or app error**
- Verify the files are from the same branch and manifest.json is valid JSON.
- Try Ctrl+Shift+R in Spotify.
- For diagnostics, run spicetify enable-devtools and open DevTools with Ctrl+Shift+I; check the console.

**Lyrics are missing**
- LRCLIB may not have a match for every song, remix, live version, or spelling.
- Line highlighting requires timed lyrics; plain lyrics cannot sync line-by-line.
- Track title and artist are sent to LRCLIB for lookup.

**Vocal removal does not work**
This is expected in the current Spicetify build. A custom app does not automatically receive Spotify Desktop's decoded audio stream. Vocal processing is not active yet.

## Privacy
- The lyric lookup sends track title and artist to LRCLIB.
- The Spicetify app does not intentionally send Spotify credentials or audio to LRCLIB.
- Audio capture and vocal removal are not active in this Spicetify app yet.

## Structure
    spicetify/vishusingh/manifest.json
    spicetify/vishusingh/index.js
    spicetify/vishusingh/style.css
    spicetify/vishusingh/README.md
    docs/VISHUSINGH_SPICETIFY_PORT.md

The repository also retains the upstream Karafilt browser-extension code and MIT license. The browser extension and Spicetify app are separate integration targets; Chrome tab-capture APIs are not automatically available in Spicetify.

## Roadmap
- [x] Initial Spicetify app structure and responsive UI
- [x] Spotify track metadata and playback controls
- [x] LRCLIB timed/plain lyric lookup
- [x] Click-to-seek lyric lines
- [ ] Test and fix against supported Spotify + Spicetify versions
- [ ] Verify real-time audio capture and output/mixing
- [ ] Integrate vocal-removal engine into a proven audio path
- [ ] Enable vocal slider only after real audio tests pass
- [ ] Add verified screenshots and release packaging

## Credits and license
This project builds on the MIT-licensed Karafilt project. See LICENSE for license terms and attribution. VishuSingh is not affiliated with Apple Music or Spotify.