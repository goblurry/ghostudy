import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Trash2, Music2 } from "lucide-react";
import { useStore } from "../store";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { openUrl } from "@tauri-apps/plugin-opener";

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
  return type === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1&rel=0`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
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
      }
      setLinks(updated);
      saveYT(updated);
    })();
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
          background: "var(--blue)", color: "var(--bg)", border: "none",
          borderRadius: 8, padding: "0 14px", fontSize: 11, fontWeight: "bold",
          cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          display: "flex", alignItems: "center", justifyContent: "center", minWidth: 44,
        }}>추가</button>
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
const REDIRECT_URI = IS_DEV ? "http://127.0.0.1:1420" : "studydesk://callback";
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

function VinylDisc({ imageUrl, isPlaying }) {
  return (
    <div className={`relative ${isPlaying ? "vinyl-spinning" : "vinyl-paused"}`}
      style={{ width: 120, height: 120 }}>
      {/* 외곽 레코드 */}
      <div className="absolute inset-0 rounded-full"
        style={{
          background: "conic-gradient(#1a1a1a 0deg, #2a2a2a 30deg, #1a1a1a 60deg, #2a2a2a 90deg, #1a1a1a 120deg, #2a2a2a 150deg, #1a1a1a 180deg, #2a2a2a 210deg, #1a1a1a 240deg, #2a2a2a 270deg, #1a1a1a 300deg, #2a2a2a 330deg, #1a1a1a 360deg)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
        }}
      />
      {/* 반사선 */}
      <div className="absolute inset-[6px] rounded-full"
        style={{ background: "conic-gradient(rgba(255,255,255,0.03) 0deg, transparent 60deg, rgba(255,255,255,0.05) 120deg, transparent 180deg, rgba(255,255,255,0.03) 240deg, transparent 300deg, rgba(255,255,255,0.03) 360deg)" }}
      />
      {/* 앨범 커버 */}
      <div className="absolute inset-[22px] rounded-full overflow-hidden"
        style={{ boxShadow: "inset 0 0 8px rgba(0,0,0,0.5)" }}>
        {imageUrl
          ? <img src={imageUrl} alt="album" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-[#f4a67a] to-[#e8895e] flex items-center justify-center">
              <span className="text-white text-2xl">🎵</span>
            </div>
        }
      </div>
      {/* 중앙 구멍 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-3 h-3 rounded-full bg-white/20 border border-white/30" />
      </div>
    </div>
  );
}

function SpotifyPanel() {
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

  // 딥링크 콜백 처리 (PKCE, 프로덕션)
  useEffect(() => {
    if (IS_DEV) return;
    let cleanup;
    onOpenUrl(async (urls) => {
      for (const url of urls) {
        if (!url.startsWith("studydesk://callback")) continue;
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
        setIsPlaying(!state.paused);
        setTrack(state.track_window?.current_track);
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
    await openUrl(url.toString());
  };

  if (!CLIENT_ID) return (
    <div className="flex items-center justify-center h-full text-xs text-[#9b8c80] p-4 text-center">
      .env에 VITE_SPOTIFY_CLIENT_ID를 설정하세요
    </div>
  );

  if (!token) return (
    <div className="flex flex-col items-center justify-center h-full gap-3">
      <VinylDisc isPlaying={false} />
      <button className="btn-primary text-xs px-5 py-2" onClick={login}>Spotify 로그인</button>
    </div>
  );

  const albumImg = track?.album?.images?.[0]?.url;

  return (
    <div className="flex flex-col h-full">
      {/* 바이닐 + 트랙 정보 */}
      <div className="flex items-center gap-4 px-4 py-3 flex-shrink-0">
        <VinylDisc imageUrl={albumImg} isPlaying={isPlaying} />
        <div className="flex-1 min-w-0 flex flex-col gap-2">
          {track ? (
            <>
              <p className="text-sm font-semibold text-[#3d3530] leading-tight line-clamp-2">{track.name}</p>
              <p className="text-xs text-[#9b8c80]">{track.artists?.map(a => a.name).join(", ")}</p>
            </>
          ) : (
            <p className="text-xs text-[#c0b0a4]">플레이리스트를 선택하세요</p>
          )}
          {/* 컨트롤 */}
          <div className="flex items-center gap-2 mt-1">
            <button onClick={() => playerRef.current?.previousTrack()}
              className="w-7 h-7 rounded-full bg-[#f0e8e0] text-[#7a6b5f] text-xs flex items-center justify-center hover:bg-[#e8d8cc]">⏮</button>
            <button onClick={() => playerRef.current?.togglePlay()}
              className="w-8 h-8 rounded-full bg-[#f4a67a] text-white text-sm flex items-center justify-center hover:bg-[#e8895e]">
              {isPlaying ? "⏸" : "▶"}
            </button>
            <button onClick={() => playerRef.current?.nextTrack()}
              className="w-7 h-7 rounded-full bg-[#f0e8e0] text-[#7a6b5f] text-xs flex items-center justify-center hover:bg-[#e8d8cc]">⏭</button>
          </div>
        </div>
      </div>

      {/* 플레이리스트 목록 */}
      <div className="flex-1 overflow-y-auto border-t border-[#f0e8e0]">
        {playlists.map(p => (
          <div key={p.id} onClick={() => play(p.uri)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors ${selected === p.uri ? "bg-[#ffe4d6]" : "hover:bg-[#f5ede6]"}`}>
            {p.images?.[0]?.url
              ? <img src={p.images[0].url} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
              : <div className="w-8 h-8 rounded-lg bg-[#f0e8e0] flex items-center justify-center flex-shrink-0 text-sm">🎵</div>
            }
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#3d3530] truncate">{p.name}</p>
              <p className="text-[10px] text-[#9b8c80]">{p.tracks?.total}곡</p>
            </div>
            {selected === p.uri && isPlaying && <span className="text-[10px] text-[#f4a67a]">재생 중</span>}
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
