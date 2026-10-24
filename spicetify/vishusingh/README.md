# VishuSingh for Spicetify

An Apple Music Sing-inspired karaoke interface for Spotify Desktop, with synchronized lyric lookup and native Spotify playback controls.

## Install (Windows)

1. Install and apply [Spicetify](https://spicetify.app/docs/getting-started).
2. Copy the `vishusingh` folder into `%appdata%\spicetify\CustomApps\`.
3. In PowerShell, run:

   ```powershell
   spicetify config custom_apps vishusingh
   spicetify apply
   ```

4. Restart Spotify and open **VishuSingh** in the sidebar.

Linux/macOS: copy the folder to `~/.config/spicetify/CustomApps/vishusingh` and run the same Spicetify config commands.

## Current implementation

- Apple Music Sing-inspired responsive layout and immersive mode.
- Reads the current track, artwork, playback status, progress, and native player controls through Spicetify.
- Fetches exact-match lyrics from LRCLIB and falls back to ranked search results; synchronized LRC lines follow playback and can be clicked to seek. Multiple timestamps per LRC line are supported, and plain lyrics are shown when timed lyrics are unavailable.
- Explicit loading/error states and cleanup of player listeners and lyric requests.
- Persistent lyric-size and auto-scroll settings.
- Keyboard shortcuts: Space play/pause, Left/Right seek five seconds, N next track, B previous track (disabled while typing in inputs).

## Important: vocal reduction is not active yet

The vocal slider is intentionally disabled. A Spicetify custom app can read player metadata and control playback, but it does **not** automatically receive Spotify Desktop's decoded audio samples. The browser-extension capture path in the original Karafilt project is not a supported assumption for this app. A real vocal-removal engine must be connected to a verified audio-capture/mixing route before enabling the slider. We will not pretend that a UI-only slider changes the sound.

## Privacy

Lyrics lookup sends the track title and artist name to LRCLIB. No Spotify credentials or audio are sent by this app. See [LRCLIB](https://lrclib.net/) and the repository's MIT license for upstream project attribution.

## Development

Custom apps require `index.js` with a `render()` function and a `manifest.json`. The styles are loaded through the manifest's `subfiles` list. Refer to the [Spicetify custom app docs](https://spicetify.app/docs/development/custom-apps).

This is an initial integration milestone; validate against your installed Spotify and Spicetify versions before treating it as a release.
