/* VishuSingh — Spicetify custom app.
 * Lyrics are sourced from LRCLIB when a track is available there.
 * Spicetify custom apps do not expose Spotify's decoded audio stream, so vocal
 * reduction is deliberately shown as unavailable until a real audio route exists.
 */
const React = Spicetify.React;
const h = React.createElement;
const { useState, useEffect, useRef } = React;
const LRCLIB = "https://lrclib.net/api";

function formatTime(ms) {
  const s = Math.max(0, Math.floor((ms || 0) / 1000));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}
function artwork(track) {
  return track?.images?.[0]?.url || track?.album?.images?.[0]?.url || "";
}
function App() {
  const [track, setTrack] = useState(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [lyrics, setLyrics] = useState([]);
  const [plainLyrics, setPlainLyrics] = useState("");
  const [lyricState, setLyricState] = useState("Waiting for a track");
  const [vocal, setVocal] = useState(100);
  const [mode, setMode] = useState("Sing");
  const [fullscreen, setFullscreen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [lyricScale, setLyricScale] = useState(() => { try { return Number(Spicetify.LocalStorage?.get("vishusingh:lyricScale")) || 1; } catch (_) { return 1; } });
  const [autoScroll, setAutoScroll] = useState(() => { try { return Spicetify.LocalStorage?.get("vishusingh:autoScroll") !== "false"; } catch (_) { return true; } });
  const requestId = useRef(0);
  const rootRef = useRef(null);

  useEffect(() => {
    let alive = true;
    const sync = () => {
      const data = Spicetify.Player?.data;
      const item = data?.item;
      if (!alive) return;
      if (item) {
        setTrack({
          uri: item.uri, name: item.name || "Unknown track",
          artists: (item.artists || []).map(a => a.name).join(", "),
          album: item.album || {}, images: item.album?.images || [],
          duration: item.duration?.milliseconds || item.duration_ms || 0
        });
      } else setTrack(null);
      setPosition(Spicetify.Player?.getProgress?.() || 0);
      setPlaying(Boolean(Spicetify.Player?.isPlaying()));
    };
    const tick = () => {
      if (!alive) return;
      setPosition(Spicetify.Player?.getProgress?.() || 0);
      setPlaying(Boolean(Spicetify.Player?.isPlaying()));
    };
    sync();
    Spicetify.Player?.addEventListener?.("songchange", sync);
    Spicetify.Player?.addEventListener?.("onplaypause", tick);
    Spicetify.Player?.addEventListener?.("onprogress", tick);
    const timer = setInterval(tick, 350);
    return () => {
      alive = false; clearInterval(timer);
      Spicetify.Player?.removeEventListener?.("songchange", sync);
      Spicetify.Player?.removeEventListener?.("onplaypause", tick);
      Spicetify.Player?.removeEventListener?.("onprogress", tick);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const id = ++requestId.current;
    setLyrics([]); setPlainLyrics(""); setLyricState(track ? "Finding synchronized lyrics…" : "Play a song to begin");
    if (!track) return () => { cancelled = true; };
    const headers = { "Accept": "application/json" };
    const isCurrent = () => !cancelled && id === requestId.current;
    const applyLyrics = data => {
      if (!isCurrent() || !data) return false;
      if (data.syncedLyrics) {
        const parsed = [];
        data.syncedLyrics.split(/\r?\n/).forEach(line => {
          const tags = [...line.matchAll(/\[(\d{1,2}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
          const textMatch = line.replace(/\[(?:\d{1,2}:\d{2})(?:[.:]\d{1,3})?\]/g, "").trim();
          tags.forEach(tag => {
            const fraction = tag[3] ? Number(("0." + tag[3])) * 1000 : 0;
            parsed.push({ time: Number(tag[1]) * 60000 + Number(tag[2]) * 1000 + fraction, text: textMatch });
          });
        });
        parsed.sort((a, b) => a.time - b.time);
        if (parsed.length) {
          setLyrics(parsed); setPlainLyrics(""); setLyricState("Synchronized lyrics"); return true;
        }
      }
      if (data.plainLyrics) {
        setPlainLyrics(data.plainLyrics); setLyrics([]); setLyricState("Unsynchronized lyrics"); return true;
      }
      return false;
    };
    const exactQuery = new URLSearchParams({ track_name: track.name, artist_name: track.artists });
    fetch(LRCLIB + "/get?" + exactQuery.toString(), { headers })
      .then(r => r.ok ? r.json() : Promise.reject(new Error("No exact match")))
      .then(data => {
        if (applyLyrics(data)) return;
        const searchQuery = new URLSearchParams({ q: [track.name, track.artists].filter(Boolean).join(" ") });
        return fetch(LRCLIB + "/search?" + searchQuery.toString(), { headers })
          .then(r => r.ok ? r.json() : Promise.reject(new Error("No search results")))
          .then(results => {
            if (!isCurrent()) return;
            const normalize = value => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
            const wantedTitle = normalize(track.name);
            const wantedArtist = normalize(track.artists.split(",")[0]);
            const ranked = (Array.isArray(results) ? results : []).map(item => {
              const title = normalize(item.trackName);
              const artist = normalize(item.artistName);
              const score = (title === wantedTitle ? 4 : title.includes(wantedTitle) || wantedTitle.includes(title) ? 2 : 0)
                + (artist === wantedArtist ? 3 : artist.includes(wantedArtist) || wantedArtist.includes(artist) ? 1 : 0)
                + (item.syncedLyrics ? 1 : 0);
              return { item, score };
            }).sort((a, b) => b.score - a.score);
            const best = ranked.find(entry => entry.score >= 4 && (entry.item.syncedLyrics || entry.item.plainLyrics));
            if (!best || !applyLyrics(best.item)) throw new Error("Lyrics unavailable");
          });
      })
      .catch(() => { if (isCurrent()) setLyricState("Lyrics unavailable for this track"); });
    return () => { cancelled = true; };
  }, [track?.uri]);

  const activeIndex = lyrics.reduce((idx, line, i) => line.time <= position ? i : idx, -1);
  useEffect(() => {
    if (!autoScroll) return;
    const el = rootRef.current?.querySelector(".vs-lyric-active");
    el?.scrollIntoView?.({ behavior: "smooth", block: "center" });
  }, [activeIndex, lyrics.length, autoScroll]);

  useEffect(() => {
    const onKeyDown = event => {
      if (event.defaultPrevented || event.ctrlKey || event.metaKey || event.altKey) return;
      const target = event.target;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      if (event.code === "Space") { event.preventDefault(); togglePlay(); }
      else if (event.key === "ArrowLeft") { event.preventDefault(); seek(Math.max(0, position - 5000)); }
      else if (event.key === "ArrowRight") { event.preventDefault(); seek(Math.min(track?.duration || position + 5000, position + 5000)); }
      else if (event.key.toLowerCase() === "n") next();
      else if (event.key.toLowerCase() === "b") previous();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playing, position, track?.duration]);

  const updateLyricScale = value => {
    const nextValue = Number(value);
    setLyricScale(nextValue);
    try { Spicetify.LocalStorage?.set("vishusingh:lyricScale", String(nextValue)); } catch (_) {}
  };
  const updateAutoScroll = value => {
    setAutoScroll(Boolean(value));
    try { Spicetify.LocalStorage?.set("vishusingh:autoScroll", String(Boolean(value))); } catch (_) {}
  };

  const seek = (value) => Spicetify.Player?.seek?.(Number(value));
  const togglePlay = () => playing ? Spicetify.Player?.pause?.() : Spicetify.Player?.play?.();
  const next = () => Spicetify.Player?.next?.();
  const previous = () => Spicetify.Player?.back?.();
  const art = artwork(track);
  const lineElements = lyrics.length ? lyrics.map((line, i) =>
    h("button", { key: i, className: "vs-lyric" + (i === activeIndex ? " vs-lyric-active" : "") + (i < activeIndex ? " vs-lyric-past" : ""),
      onClick: () => seek(line.time), title: "Seek to lyric" }, line.text || "♪")
  ) : plainLyrics ? plainLyrics.split(/\r?\n/).map((line, i) => h("p", { key: i, className: "vs-plain-line" }, line)) : null;

  return h("main", { className: "vs-app" + (fullscreen ? " vs-fullscreen" : ""), ref: rootRef, style: { "--vs-lyric-scale": lyricScale } },
    h("header", { className: "vs-topbar" },
      h("div", { className: "vs-brand" }, h("span", { className: "vs-brand-mark" }, "✦"), h("span", null, "VishuSingh")),
      h("div", { className: "vs-top-actions" },
        h("span", { className: "vs-live-dot" }), h("span", { className: "vs-small-label" }, "SPOTIFY PLAYER"),
        h("button", { className: "vs-icon-button", onClick: () => setShowSettings(!showSettings), title: "Settings" }, "⚙"),
        h("button", { className: "vs-icon-button", onClick: () => setFullscreen(!fullscreen), title: fullscreen ? "Exit immersive mode" : "Immersive mode" }, fullscreen ? "↙" : "↗")
      )
    ),
    showSettings && h("section", { className: "vs-settings" },
      h("strong", null, "VishuSingh settings"),
      h("p", null, "Lyrics are requested from LRCLIB. Lyrics and playback remain separate from audio processing."),
      h("p", null, "Vocal isolation is not enabled: Spicetify does not provide a supported decoded-audio capture API."),
      h("label", { className: "vs-setting-row" }, h("span", null, "Lyric size"), h("input", { type: "range", min: 0.8, max: 1.5, step: 0.1, value: lyricScale, onChange: e => updateLyricScale(e.target.value), "aria-label": "Lyric size" })),
      h("label", { className: "vs-setting-row" }, h("span", null, "Auto-scroll lyrics"), h("input", { type: "checkbox", checked: autoScroll, onChange: e => updateAutoScroll(e.target.checked), "aria-label": "Auto-scroll lyrics" }))
    ),
    h("section", { className: "vs-stage" },
      h("div", { className: "vs-backdrop", style: art ? { backgroundImage: "url(" + art + ")" } : {} }),
      h("div", { className: "vs-stage-inner" },
        h("div", { className: "vs-stage-heading" },
          h("div", { className: "vs-eyebrow" }, "SING ALONG"),
          h("div", { className: "vs-mode-switch" }, ["Sing", "Lyrics"].map(m => h("button", { key: m, className: mode === m ? "active" : "", onClick: () => setMode(m) }, m)))
        ),
        h("div", { className: "vs-lyrics-stage" },
          mode === "Sing" && art && h("img", { className: "vs-stage-art", src: art, alt: "Album artwork" }),
          h("div", { className: "vs-track-context" },
            h("div", { className: "vs-track-title" }, track?.name || "Your next song starts here"),
            h("div", { className: "vs-track-artist" }, track?.artists || "Play any track in Spotify")
          ),
          h("div", { className: "vs-lyric-window" },
            lyrics.length || plainLyrics ? lineElements : h("div", { className: "vs-lyric-placeholder" },
              h("span", { className: "vs-lyric-status" }, lyricState),
              h("span", { className: "vs-lyric-hint" }, track ? "Lyrics will appear here when available" : "Choose a song and make it yours")
            )
          ),
          h("div", { className: "vs-stage-footer" }, h("span", null, lyricState), h("span", null, lyrics.length ? "Tap a line to seek" : "VISHUSINGH • SING MODE"))
        )
      )
    ),
    h("aside", { className: "vs-control-panel" },
      h("div", { className: "vs-panel-heading" }, h("div", null, h("div", { className: "vs-eyebrow" }, "PERSONALIZE"), h("h2", null, "Your sound")),
        h("span", { className: "vs-panel-symbol" }, "♫")),
      h("div", { className: "vs-control-card" },
        h("div", { className: "vs-control-title" }, h("span", null, "Vocal control"), h("span", { className: "vs-pill vs-pill-muted" }, "UNAVAILABLE")),
        h("p", { className: "vs-description" }, "True vocal reduction needs access to the live audio stream. This app will not fake it with a cosmetic slider."),
        h("div", { className: "vs-range-labels" }, h("span", null, "Instrumental"), h("span", null, "Original")),
        h("input", { className: "vs-range vs-disabled-range", type: "range", min: 0, max: 100, value: vocal, disabled: true, onChange: e => setVocal(Number(e.target.value)), "aria-label": "Vocal reduction unavailable" }),
        h("div", { className: "vs-unavailable-note" }, h("span", null, "●"), " Audio engine connection required")
      ),
      h("div", { className: "vs-control-card vs-lyrics-card" },
        h("div", { className: "vs-control-title" }, h("span", null, "Lyrics"), h("span", { className: "vs-pill" }, lyrics.length ? "SYNCED" : "AUTO")),
        h("p", { className: "vs-description" }, "Word timing follows playback when synchronized lyrics are available."),
        h("button", { className: "vs-secondary-button", onClick: () => setMode(mode === "Sing" ? "Lyrics" : "Sing") }, mode === "Sing" ? "Focus on lyrics ↗" : "Back to Sing mode")
      ),
      h("div", { className: "vs-note" }, h("span", { className: "vs-note-icon" }, "✧"),
        h("div", null, h("strong", null, "Made for your voice"), h("p", null, "A focused karaoke space, designed around your music.")))
    ),
    h("footer", { className: "vs-player" },
      h("div", { className: "vs-now-playing" },
        art ? h("img", { src: art, alt: "", className: "vs-player-art" }) : h("div", { className: "vs-player-art vs-art-empty" }, "♫"),
        h("div", { className: "vs-player-meta" }, h("strong", null, track?.name || "Nothing playing"), h("span", null, track?.artists || "Your Spotify session"))
      ),
      h("div", { className: "vs-transport" },
        h("div", { className: "vs-transport-buttons" },
          h("button", { onClick: previous, title: "Previous track" }, "↶"),
          h("button", { className: "vs-play-button", onClick: togglePlay, title: playing ? "Pause" : "Play" }, playing ? "Ⅱ" : "▶"),
          h("button", { onClick: next, title: "Next track" }, "↷")
        ),
        h("div", { className: "vs-progress" },
          h("span", null, formatTime(position)),
          h("input", { type: "range", min: 0, max: track?.duration || 1, value: Math.min(position, track?.duration || 1), onChange: e => seek(e.target.value), "aria-label": "Track position" }),
          h("span", null, formatTime(track?.duration || 0))
        )
      ),
      h("div", { className: "vs-player-right" }, h("span", { className: "vs-live-dot" }), h("span", null, "Connected to Spotify"))
    )
  );
}
// Spicetify calls render() and mounts the returned React element itself.
// Do not call ReactDOM.render() or invoke render() manually here.
function render() {
  return h(App);
}
