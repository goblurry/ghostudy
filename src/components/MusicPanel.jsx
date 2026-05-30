import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Music2 } from "lucide-react";
import { useStore } from "../store";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { open } from "@tauri-apps/plugin-opener";

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

function YouTubePanel() {
  const { ytItem, setYtItem, setNowPlaying } = useStore();
  const [links, setLinks] = useState(loadYT);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");

  const select = (item) => {
    setYtItem(item);
    setNowPlaying({ title: item.title, isPlaying: true, source: "youtube" });
  };

  const handleAdd = () => {
    setError("");
    const parsed = parseYouTubeId(input.trim());
    if (!parsed) { setError("유효한 YouTube URL이 아니에요"); return; }
    const item = { id: Date.now(), title: input.trim(), ...parsed };
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
      {/* 현재 재생 중 표시 */}
      {ytItem && (
        <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--border)",
          fontSize: 10, color: "var(--sub)", display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ color: "var(--blue)" }}>▶ 재생 중</span>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
            {ytItem.title}
          </span>
          <span style={{ fontSize: 9, color: "var(--sub)" }}>홈 화면에서 재생</span>
        </div>
      )}

      {/* 입력 */}
      <div style={{ display: "flex", gap: 6, padding: "10px 12px",
        borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        <input type="text" style={{ flex: 1, fontSize: 11 }}
          placeholder="YouTube 링크 붙여넣기"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} className="btn-primary" style={{ padding: "4px 10px", fontSize: 11 }}>추가</button>
      </div>
      {error && <p style={{ fontSize: 10, color: "#e07070", margin: "4px 12px 0", padding: 0 }}>{error}</p>}

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {links.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--sub)", textAlign: "center", padding: "24px 0" }}>
            링크를 추가해봐요 🎬
          </p>
        ) : links.map(l => (
          <div key={l.id} onClick={() => select(l)}
            style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "8px 12px", cursor: "pointer",
              background: ytItem?.id === l.id ? "rgba(184,212,245,0.1)" : "transparent",
              borderBottom: "1px solid var(--border)",
              transition: "background 0.1s",
            }}
            onMouseEnter={e => { if (ytItem?.id !== l.id) e.currentTarget.style.background = "var(--sidebar)"; }}
            onMouseLeave={e => { if (ytItem?.id !== l.id) e.currentTarget.style.background = "transparent"; }}
          >
            <span style={{ flexShrink: 0 }}>{l.type === "playlist" ? "📋" : "▶"}</span>
            <span style={{ flex: 1, fontSize: 11, color: "var(--text)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{l.title}</span>
            {ytItem?.id === l.id && <span style={{ fontSize: 9, color: "var(--blue)", flexShrink: 0 }}>재생 중</span>}
            <button onClick={e => { e.stopPropagation(); remove(l.id); }}
              style={{ background: "none", border: "none", cursor: "pointer",
                color: "var(--border)", flexShrink: 0, padding: 2 }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
            ><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spotify PKCE ─────────────────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = "studydesk://callback";
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

  // 딥링크 콜백 처리 (PKCE)
  useEffect(() => {
    const unlisten = onOpenUrl(async (urls) => {
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
    });
    return () => { unlisten.then(f => f()); };
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
    await open(url.toString());
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
    <div className="flex flex-col" style={{ height: fullPage ? "100%" : 280 }}>
      <div className="flex gap-1 px-3 pt-2 pb-1.5 flex-shrink-0">
        {[
          { id: "youtube", label: "🎬 YouTube" },
          { id: "spotify", label: "🎵 Spotify" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${tab === t.id ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80]"}`}>
            {t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "youtube" ? <YouTubePanel /> : <SpotifyPanel />}
      </div>
    </div>
  );
}
