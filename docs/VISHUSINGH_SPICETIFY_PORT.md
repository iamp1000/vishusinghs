# VishuSingh — Spicetify integration plan

VishuSingh is the Spicetify-focused evolution of the MIT-licensed Karafilt project. The goal is an Apple Music Sing-inspired experience inside Spotify Desktop: synchronized karaoke lyrics plus a vocal-reduction mix control, with audio processing performed locally.

## What already exists upstream

Karafilt provides a browser-side vocal-cancellation engine built around WebAssembly, an AudioWorklet, and spectral/center-channel processing. It also has lyrics matching and timing logic. This is a better starting point than rewriting the DSP from scratch.

## Integration strategy

### 1. Keep the DSP engine isolated
- Reuse the existing MIT-licensed WASM vocal-removal implementation and its documented build process.
- Keep audio processing on an audio thread where possible; do not run per-sample DSP on the UI thread.
- Make processing mode and vocal-reduction strength explicit settings.
- Never upload captured audio or store audio recordings.

### 2. Build a Spicetify custom app first
- Use Spicetify's custom-app conventions and its `Spicetify` runtime APIs.
- Read the current track and playback position through supported player APIs where available.
- Render a focused karaoke screen with current/next lyric lines, progress, seek controls, and a vocal-reduction slider.
- Reuse an existing synchronized-lyrics provider where possible; gracefully fall back when only line-synced or unsynced lyrics exist.

### 3. Prove the audio route before promising live vocal removal
Spicetify custom apps run inside Spotify's renderer, but a custom app does not automatically have access to the decoded audio output or a safe way to replace it. The first technical spike must verify whether the desktop client exposes a viable, stable audio capture/mixing route. If not, document the limitation and evaluate a companion audio-capture component rather than pretending a UI slider can alter the sound.

### 4. Test in small milestones
1. Custom app loads and detects track changes.
2. Lyrics stay synchronized through pause, seek, and track changes.
3. WASM module builds and passes an offline audio fixture test.
4. Audio capture/mix route is validated on the target Spotify Desktop version.
5. Vocal-reduction control changes processed output, with bypass and clean teardown.
6. Package installation and compatibility instructions are documented.

## Acceptance criteria

- No fake vocal-reduction control: moving the slider must affect the actual processed audio.
- No fabricated word timing: use word-level karaoke only when the provider supplies it; otherwise use line-level sync.
- Handle track changes, pause/resume, seeking, and unavailable lyrics without stale UI.
- Local audio processing by default; explain all external lyric requests and their privacy implications.
- Preserve upstream license and attribution notices for reused code.

## Important compatibility note

The existing Karafilt extension's `tabCapture` / offscreen AudioWorklet path is a Chrome-extension capability. It cannot simply be copied into a Spicetify custom app. The audio-route feasibility test is therefore a blocker before claiming native Spotify Desktop vocal removal works.
