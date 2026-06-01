import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Music2 } from "lucide-react";
import { useStore } from "../store";
import { openExternalUrl, onDeepLink, isTauri } from "../tauri-compat";

// ─── YouTube ──────────────────────────────────────────────────────────────────

function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return { type: "video", id: u.pathname.slice(1) };
    if (u.searchParams.get("list")) return { type: "playlist", id: u.searchParams.get("list") };
    if (u.searchParams.get("v")) return { type: "video", id: u.searchParams.get("v") };
  } catch {}
  const vMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (vMatch) return { type: "video", id: vMatch[1] };
  const pMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (pMatch) return { type: "playlist", id: pMatch[1] };
  return null;
}

function embedSrc({ type, id }) {
  const origin = encodeURIComponent("https://ghostudy-app.vercel.app");
  return type === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1&rel=0&origin=${origin}`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&origin=${origin}`;
}

function loadYT() {
  try { return JSON.parse(localStorage.getItem("yt_links")) || []; } catch { return []; }
}
function saveYT(v) { localStorage.setItem("yt_links", JSON.stringify(v)); }

async function fetchYTTitle(parsed, fallback) {
  try {
    const videoUrl = parsed.type === "video"
      ? `https://www.youtube.com/watch?v=${parsed.id}`
      : `https://www.youtube.com/playlist?list=${parsed.id}`;
    const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
    if (res.ok) { const d = await res.json(); return d.title || fallback; }
  } catch {}
  return fallback;
}

function YouTubePanel() {
  const { ytItem, setYtItem, setNowPlaying } = useStore();
  const [links, setLinks] = useState(loadYT);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  // 기존 저장된 링크 중 URL이 제목인 것들 자동으로 제목 fetch
  useEffect(() => {
    const needsFetch = links.filter(l => l.title?.startsWith("http"));
    if (needsFetch.length === 0) return;
    (async () => {
      let updated = [...links];
      for (const l of needsFetch) {
        const title = await fetchYTTitle(l, l.title);
        updated = updated.map(x => x.id === l.id ? { ...x, title } : x);
        // 현재 재생 중인 항목이면 헤더도 업데이트
        if (ytItem?.id === l.id) {
          setYtItem({ ...l, title });
          setNowPlaying({ title, isPlaying: true, source: "youtube" });
        }
      }
      setLinks(updated);
      saveYT(updated);
    })();
  }, []);

  // ytItem이 있으면 nowPlaying 동기화 (앱 재시작 후 복원 시)
  useEffect(() => {
    if (ytItem && ytItem.title && !ytItem.title.startsWith("http")) {
      setNowPlaying({ title: ytItem.title, isPlaying: true, source: "youtube" });
    }
  }, []);

  const select = (item) => {
    setYtItem(item);
    setNowPlaying({ title: item.title, isPlaying: true, source: "youtube" });
  };

  const handleAdd = async () => {
    setError("");
    const url = input.trim();
    const parsed = parseYouTubeId(url);
    if (!parsed) { setError("유효한 YouTube URL이 아니에요"); return; }

    // 일단 URL로 임시 저장
    const id = Date.now();
    let title = url;
    try {
      const videoUrl = parsed.type === "video"
        ? `https://www.youtube.com/watch?v=${parsed.id}`
        : `https://www.youtube.com/playlist?list=${parsed.id}`;
      const res = await fetch(`https://www.youtube.com/oembed?url=${encodeURIComponent(videoUrl)}&format=json`);
      if (res.ok) {
        const data = await res.json();
        title = data.title || url;
      }
    } catch {}

    const item = { id, title, url, ...parsed };
    const updated = [...links, item];
    setLinks(updated); saveYT(updated);
    setInput(""); select(item);
  };

  const remove = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated); saveYT(updated);
    if (ytItem?.id === id) setYtItem(updated[0] || null);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>

      {/* YouTube 플레이어 */}
      <div style={{ background: "#000", flexShrink: 0,
        height: ytItem ? 160 : 0, transition: "height 0.2s" }}>
        {ytItem && (
          <iframe
            key={ytItem.id}
            src={embedSrc(ytItem)}
            style={{ width: "100%", height: "100%", display: "block" }}
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        )}
      </div>

      {/* 입력 */}
      <div style={{ display: "flex", gap: 6, padding: "8px 14px 10px", flexShrink: 0 }}>
        <input type="text" style={{ flex: 1, fontSize: 11 }}
          placeholder="YouTube 링크 붙여넣기"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} style={{
          background: "none", border: "none", cursor: "pointer",
          color: "var(--sub)", fontSize: 18, lineHeight: 1, padding: "0 4px", flexShrink: 0,
        }}>+</button>
      </div>
      {error && <p style={{ fontSize: 10, color: "#e07070", margin: "0 14px 6px", padding: 0 }}>{error}</p>}

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--border)" }}>
        {links.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--sub)", textAlign: "center", padding: "24px 0" }}>
            링크를 추가해봐요 🎬
          </p>
        ) : links.map(l => (
          <div key={l.id} onClick={() => select(l)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "9px 14px", cursor: "pointer",
              background: ytItem?.id === l.id ? "rgba(184,212,245,0.08)" : "transparent",
              borderBottom: "1px solid var(--border)",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (ytItem?.id !== l.id) e.currentTarget.style.background = "var(--sidebar)"; }}
            onMouseLeave={e => { if (ytItem?.id !== l.id) e.currentTarget.style.background = "transparent"; }}
          >
            {/* 작은 재생 인디케이터 */}
            <span style={{
              fontSize: 8, color: ytItem?.id === l.id ? "var(--blue)" : "var(--border)",
              flexShrink: 0, width: 12, textAlign: "center",
            }}>▶</span>
            <span style={{ flex: 1, fontSize: 11, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
            {ytItem?.id === l.id && (
              <span style={{ fontSize: 9, color: "var(--blue)", flexShrink: 0 }}>재생 중</span>
            )}
            <button onClick={e => { e.stopPropagation(); remove(l.id); }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "transparent", flexShrink: 0, padding: 2, transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "transparent"}
            ><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spotify PKCE ─────────────────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const IS_DEV = import.meta.env.DEV;
const REDIRECT_URI = isTauri()
  ? (IS_DEV ? "http://127.0.0.1:1420" : "ghostudy://callback")
  : window.location.origin;
const SCOPES = [
  "streaming", "user-read-email", "user-read-private",
  "user-read-playback-state", "user-modify-playback-state",
  "playlist-read-private", "playlist-read-collaborative",
].join(" ");

// PKCE 헬퍼
async function generatePKCE() {
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(64)))
    .map(b => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"[b % 66])
    .join("");
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  return { verifier, challenge };
}

async function exchangeCode(code, verifier) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      code_verifier: verifier,
    }),
  });
  return res.json();
}

async function refreshToken(refresh) {
  const res = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      refresh_token: refresh,
      client_id: CLIENT_ID,
    }),
  });
  return res.json();
}

const SP_GREEN = "#1DB954";

function VinylDisc({ imageUrl, isPlaying, size = 140 }) {
  const s = size;
  return (
    <div className={isPlaying ? "vinyl-spinning" : "vinyl-paused"}
      style={{ width: s, height: s, position: "relative", flexShrink: 0 }}>
      {/* 외곽 레코드 */}
      <div style={{
        position: "absolute", inset: 0, borderRadius: "50%",
        background: "conic-gradient(#111 0deg,#222 25deg,#111 50deg,#1a1a1a 75deg,#111 100deg,#222 130deg,#111 160deg,#1a1a1a 190deg,#111 220deg,#222 250deg,#111 280deg,#1a1a1a 310deg,#111 340deg,#222 360deg)",
        boxShadow: "0 6px 24px rgba(0,0,0,0.5)",
      }}/>
      {/* 광택 */}
      <div style={{
        position: "absolute", inset: 5, borderRadius: "50%",
        background: "conic-gradient(rgba(255,255,255,0.04) 0deg,transparent 90deg,rgba(255,255,255,0.04) 180deg,transparent 270deg,rgba(255,255,255,0.04) 360deg)",
      }}/>
      {/* 앨범 커버 */}
      <div style={{
        position: "absolute",
        inset: Math.round(s * 0.17),
        borderRadius: "50%", overflow: "hidden",
        boxShadow: "inset 0 0 10px rgba(0,0,0,0.6)",
      }}>
        {imageUrl
          ? <img src={imageUrl} alt="album" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          : <div style={{
              width: "100%", height: "100%", borderRadius: "50%",
              background: `radial-gradient(circle, #1a2a1a, #0d1a0d)`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill={SP_GREEN}>
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.779.779 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 01-.973-.52.779.779 0 01.52-.972c3.632-1.102 8.147-.568 11.233 1.329a.779.779 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 01-.955 1.608z"/>
              </svg>
            </div>
        }
      </div>
      {/* 중앙 구멍 */}
      <div style={{
        position: "absolute", inset: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        pointerEvents: "none",
      }}>
        <div style={{ width: 10, height: 10, borderRadius: "50%", background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.25)" }}/>
      </div>
    </div>
  );
}

function SpotifyPanel() {
  const { setNowPlaying } = useStore();
  const [token, setToken] = useState(localStorage.getItem("spotify_token"));
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [deviceId, setDeviceId] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [track, setTrack] = useState(null);
  const playerRef = useRef(null);

  // 개발 모드: localhost 콜백에서 code 파라미터 읽기
  useEffect(() => {
    if (!IS_DEV) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const verifier = localStorage.getItem("spotify_verifier");
    if (!code || !verifier) return;
    exchangeCode(code, verifier).then(data => {
      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        if (data.refresh_token) localStorage.setItem("spotify_refresh", data.refresh_token);
        localStorage.removeItem("spotify_verifier");
        setToken(data.access_token);
        window.history.replaceState({}, "", "/"); // URL 정리
      }
    });
  }, []);

  // 딥링크 콜백 처리 (Tauri 프로덕션)
  useEffect(() => {
    if (!isTauri() || IS_DEV) return;
    let cleanup;
    onDeepLink(async (urls) => {
      for (const url of urls) {
        if (!url.startsWith("ghostudy://callback")) continue;
        const query = url.split("?")[1];
        if (!query) continue;
        const params = new URLSearchParams(query);
        const code = params.get("code");
        const verifier = localStorage.getItem("spotify_verifier");
        if (!code || !verifier) continue;
        const data = await exchangeCode(code, verifier);
        if (data.access_token) {
          localStorage.setItem("spotify_token", data.access_token);
          if (data.refresh_token) localStorage.setItem("spotify_refresh", data.refresh_token);
          localStorage.removeItem("spotify_verifier");
          setToken(data.access_token);
        }
      }
    }).then(f => { cleanup = f; });
    return () => { cleanup?.(); };
  }, []);

  // 웹 콜백 처리 (브라우저에서 Spotify redirect)
  useEffect(() => {
    if (isTauri()) return;
    const params = new URLSearchParams(window.location.search);
    const code = params.get("code");
    const verifier = localStorage.getItem("spotify_verifier");
    if (!code || !verifier) return;
    exchangeCode(code, verifier).then(data => {
      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        if (data.refresh_token) localStorage.setItem("spotify_refresh", data.refresh_token);
        localStorage.removeItem("spotify_verifier");
        setToken(data.access_token);
        window.history.replaceState({}, "", "/");
      }
    });
  }, []);

  // 토큰 만료 시 자동 갱신 (1시간)
  useEffect(() => {
    const refresh = localStorage.getItem("spotify_refresh");
    if (!refresh) return;
    const timer = setTimeout(async () => {
      const data = await refreshToken(refresh);
      if (data.access_token) {
        localStorage.setItem("spotify_token", data.access_token);
        setToken(data.access_token);
      }
    }, 55 * 60 * 1000);
    return () => clearTimeout(timer);
  }, [token]);

  // Web Playback SDK 초기화
  useEffect(() => {
    if (!token) return;
    const load = () => {
      const player = new window.Spotify.Player({
        name: "Study Desk", getOAuthToken: cb => cb(token), volume: 0.6,
      });
      player.addListener("ready", ({ device_id }) => setDeviceId(device_id));
      player.addListener("player_state_changed", state => {
        if (!state) return;
        const playing = !state.paused;
        const currentTrack = state.track_window?.current_track;
        setIsPlaying(playing);
        setTrack(currentTrack);
        // 헤더 nowPlaying 업데이트
        if (currentTrack) {
          const title = `${currentTrack.name} — ${currentTrack.artists?.map(a => a.name).join(", ")}`;
          setNowPlaying({ title, isPlaying: playing, source: "spotify" });
        }
      });
      player.connect();
      playerRef.current = player;
    };
    if (window.Spotify) { load(); return; }
    const s = document.createElement("script");
    s.src = "https://sdk.scdn.co/spotify-player.js"; s.async = true;
    document.body.appendChild(s);
    window.onSpotifyWebPlaybackSDKReady = load;
  }, [token]);

  useEffect(() => {
    if (!token) return;
    fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => d.items && setPlaylists(d.items)).catch(() => {});
  }, [token]);

  const play = async (uri) => {
    if (!deviceId || !token) return;
    setSelected(uri);
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: uri }),
    });
  };

  const logout = () => {
    localStorage.removeItem("spotify_token");
    localStorage.removeItem("spotify_refresh");
    localStorage.removeItem("spotify_verifier");
    playerRef.current?.disconnect();
    setToken(null);
    setPlaylists([]);
    setTrack(null);
    setDeviceId(null);
  };

  const login = async () => {
    const { verifier, challenge } = await generatePKCE();
    localStorage.setItem("spotify_verifier", verifier);
    const url = new URL("https://accounts.spotify.com/authorize");
    url.searchParams.set("client_id", CLIENT_ID);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", REDIRECT_URI);
    url.searchParams.set("scope", SCOPES);
    url.searchParams.set("code_challenge_method", "S256");
    url.searchParams.set("code_challenge", challenge);
    await openExternalUrl(url.toString());
  };

  if (!CLIENT_ID) return (
    <div className="flex items-center justify-center h-full text-xs text-[#9b8c80] p-4 text-center">
      .env에 VITE_SPOTIFY_CLIENT_ID를 설정하세요
    </div>
  );

  if (!token) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", height: "100%", gap: 32 }}>
      <VinylDisc isPlaying={false} size={150} />
      <button onClick={login} style={{
        display: "flex", alignItems: "center", gap: 8,
        background: SP_GREEN, border: "none", borderRadius: 24,
        padding: "10px 24px", cursor: "pointer",
        fontFamily: "Galmuri, sans-serif", fontSize: 12, fontWeight: "bold",
        color: "#000",
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="#000">
          <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.623.623 0 01-.277-1.215c3.809-.87 7.076-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.779.779 0 01-1.072.257c-2.687-1.652-6.785-2.131-9.965-1.166a.779.779 0 01-.973-.52.779.779 0 01.52-.972c3.632-1.102 8.147-.568 11.233 1.329a.779.779 0 01.257 1.072zm.105-2.835c-3.223-1.914-8.54-2.09-11.618-1.156a.935.935 0 11-.542-1.79c3.532-1.072 9.404-.865 13.115 1.338a.935.935 0 01-.955 1.608z"/>
        </svg>
        Spotify 로그인
      </button>
    </div>
  );

  const albumImg = track?.album?.images?.[0]?.url;

  return (
    <div className="flex flex-col h-full">
      {/* 바이닐 + 트랙 정보 */}
      {/* 로그아웃 버튼 */}
      <div style={{ display: "flex", justifyContent: "flex-end", padding: "6px 14px 0" }}>
        <button onClick={logout} style={{
          background: "none", border: "none", cursor: "pointer",
          fontSize: 9, color: "var(--sub)", fontFamily: "Galmuri, sans-serif",
          padding: "2px 4px",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--sub)"}
        >로그아웃</button>
      </div>

      {/* 바이닐 + 트랙 정보 */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "6px 14px 10px", flexShrink: 0 }}>
        <VinylDisc imageUrl={albumImg} isPlaying={isPlaying} size={110} />
        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
          {track ? (
            <>
              <p style={{ fontSize: 12, fontWeight: "bold", color: "var(--text)", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{track.name}</p>
              <p style={{ fontSize: 10, color: "var(--sub)", margin: 0 }}>
                {track.artists?.map(a => a.name).join(", ")}
              </p>
            </>
          ) : (
            <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>플레이리스트를 선택하세요</p>
          )}
          {/* 컨트롤 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
            {[
              { icon: "⏮", action: () => playerRef.current?.previousTrack(), size: 28 },
              { icon: isPlaying ? "⏸" : "▶", action: () => playerRef.current?.togglePlay(), size: 32, primary: true },
              { icon: "⏭", action: () => playerRef.current?.nextTrack(), size: 28 },
            ].map((btn, i) => (
              <button key={i} onClick={btn.action} style={{
                width: btn.size, height: btn.size, borderRadius: "50%", border: "none",
                background: btn.primary ? SP_GREEN : "var(--sidebar)",
                color: btn.primary ? "#000" : "var(--sub)",
                cursor: "pointer", fontSize: btn.primary ? 13 : 11,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>{btn.icon}</button>
            ))}
          </div>
        </div>
      </div>

      {/* 플레이리스트 목록 */}
      <div style={{ flex: 1, overflowY: "auto", borderTop: "1px solid var(--border)" }}>
        {playlists.map(p => (
          <div key={p.id} onClick={() => play(p.uri)}
            style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "8px 14px", cursor: "pointer",
              background: selected === p.uri ? `${SP_GREEN}18` : "transparent",
              borderBottom: "1px solid var(--border)", transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (selected !== p.uri) e.currentTarget.style.background = "var(--sidebar)"; }}
            onMouseLeave={e => { if (selected !== p.uri) e.currentTarget.style.background = "transparent"; }}
          >
            {p.images?.[0]?.url
              ? <img src={p.images[0].url} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 32, height: 32, borderRadius: 6, background: "var(--sidebar)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>🎵</div>
            }
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 11, fontWeight: "bold", color: "var(--text)", margin: 0,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</p>
              <p style={{ fontSize: 9, color: "var(--sub)", margin: 0 }}>{p.tracks?.total}곡</p>
            </div>
            {selected === p.uri && isPlaying &&
              <span style={{ fontSize: 9, color: SP_GREEN, flexShrink: 0 }}>재생 중</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 메인 패널 ────────────────────────────────────────────────────────────────

export default function MusicPanel({ fullPage = false }) {
  const [tab, setTab] = useState("youtube");

  return (
    <div style={{ display: "flex", flexDirection: "column", height: fullPage ? "100%" : 280 }}>
      <div style={{ display: "flex", gap: 6, padding: "10px 14px 8px", flexShrink: 0 }}>
        {[
          { id: "youtube", label: "YouTube" },
          { id: "spotify", label: "Spotify" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: "4px 14px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            border: "none", fontFamily: "Galmuri, sans-serif",
            background: tab === t.id ? "var(--blue)" : "var(--sidebar)",
            color: tab === t.id ? "var(--bg)" : "var(--sub)",
            fontWeight: tab === t.id ? "bold" : "normal",
          }}>{t.label}</button>
        ))}
      </div>
      <div style={{ flex: 1, overflow: "hidden" }}>
        {tab === "youtube" ? <YouTubePanel /> : <SpotifyPanel />}
      </div>
    </div>
  );
}
