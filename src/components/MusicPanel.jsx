import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Music2 } from "lucide-react";

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
  const [links, setLinks] = useState(loadYT);
  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const parsed = parseYouTubeId(input.trim());
    if (!parsed) { setError("유효한 YouTube URL이 아니에요"); return; }
    const item = { id: Date.now(), title: input.trim(), ...parsed };
    const updated = [...links, item];
    setLinks(updated); saveYT(updated);
    setInput(""); setPlaying(item);
  };

  const remove = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated); saveYT(updated);
    if (playing?.id === id) setPlaying(updated[0] || null);
  };

  return (
    <div className="flex flex-col h-full">
      {/* 영상 플레이어 */}
      <div className="flex-shrink-0 bg-black" style={{ height: 150 }}>
        {playing ? (
          <iframe
            key={playing.id}
            src={embedSrc(playing)}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#555]">
            <span className="text-3xl">🎬</span>
            <span className="text-xs">링크를 추가해서 재생해봐요</span>
          </div>
        )}
      </div>

      {/* 입력 */}
      <div className="flex gap-1.5 px-3 py-2 border-b border-[#f0e8e0] flex-shrink-0">
        <input
          type="text"
          className="flex-1 text-xs py-1.5 px-2"
          placeholder="YouTube 링크 붙여넣기"
          value={input}
          onChange={e => { setInput(e.target.value); setError(""); }}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <button onClick={handleAdd} className="btn-primary text-xs px-2.5 py-1">추가</button>
      </div>
      {error && <p className="text-[10px] text-[#e07070] px-3 pt-1">{error}</p>}

      {/* 목록 */}
      <div className="flex-1 overflow-y-auto">
        {links.length === 0 ? (
          <p className="text-xs text-[#c0b0a4] text-center py-6">링크를 추가해봐요 🎬</p>
        ) : links.map(l => (
          <div
            key={l.id}
            onClick={() => setPlaying(l)}
            className={`flex items-center gap-2 px-3 py-2 cursor-pointer group transition-colors ${playing?.id === l.id ? "bg-[#ffe4d6]" : "hover:bg-[#f5ede6]"}`}
          >
            <span className="text-sm flex-shrink-0">{l.type === "playlist" ? "📋" : "▶"}</span>
            <span className="flex-1 text-xs text-[#3d3530] truncate">{l.title}</span>
            {playing?.id === l.id && <span className="text-[10px] text-[#f4a67a] font-medium">재생 중</span>}
            <button
              onClick={e => { e.stopPropagation(); remove(l.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070] flex-shrink-0"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Spotify Vinyl ────────────────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = "http://localhost:1420/callback";
const SCOPES = [
  "streaming", "user-read-email", "user-read-private",
  "user-read-playback-state", "user-modify-playback-state",
  "playlist-read-private", "playlist-read-collaborative",
].join(" ");

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

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const t = params.get("access_token");
      if (t) { localStorage.setItem("spotify_token", t); setToken(t); window.location.hash = ""; }
    }
  }, []);

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

  const login = () => {
    window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
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
