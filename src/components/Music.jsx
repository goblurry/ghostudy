import { useState, useEffect, useRef } from "react";
import { Trash2, Plus, Youtube, Music2 } from "lucide-react";

// ─────────────────────────────────────────────
//  YouTube
// ─────────────────────────────────────────────

function parseYouTubeId(url) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtu.be")) return { type: "video", id: u.pathname.slice(1) };
    if (u.searchParams.get("list")) return { type: "playlist", id: u.searchParams.get("list") };
    if (u.searchParams.get("v")) return { type: "video", id: u.searchParams.get("v") };
  } catch {}
  // short patterns
  const vMatch = url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
  if (vMatch) return { type: "video", id: vMatch[1] };
  const pMatch = url.match(/[?&]list=([A-Za-z0-9_-]+)/);
  if (pMatch) return { type: "playlist", id: pMatch[1] };
  return null;
}

function embedSrc({ type, id }) {
  if (type === "playlist")
    return `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1`;
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
}

function loadYT() {
  try { return JSON.parse(localStorage.getItem("yt_links")) || []; } catch { return []; }
}
function saveYT(items) { localStorage.setItem("yt_links", JSON.stringify(items)); }

function YouTubeTab() {
  const [links, setLinks] = useState(loadYT);
  const [input, setInput] = useState("");
  const [label, setLabel] = useState("");
  const [playing, setPlaying] = useState(null);
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const parsed = parseYouTubeId(input.trim());
    if (!parsed) { setError("유효한 YouTube URL을 입력해주세요"); return; }
    const title = label.trim() || input.trim();
    const newLinks = [...links, { id: Date.now(), title, url: input.trim(), ...parsed }];
    setLinks(newLinks);
    saveYT(newLinks);
    setInput("");
    setLabel("");
    setPlaying(newLinks[newLinks.length - 1]);
  };

  const remove = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    saveYT(updated);
    if (playing?.id === id) setPlaying(null);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      {playing && (
        <div className="rounded-xl overflow-hidden bg-black aspect-video w-full flex-shrink-0">
          <iframe
            key={playing.id}
            src={embedSrc(playing)}
            className="w-full h-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
            frameBorder="0"
          />
        </div>
      )}

      <div className="card flex flex-col gap-2">
        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 text-sm"
            placeholder="YouTube 링크 붙여넣기 (영상 or 재생목록)"
            value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <button className="btn-primary flex items-center gap-1" onClick={handleAdd}>
            <Plus size={14} /> 추가
          </button>
        </div>
        <input
          type="text"
          className="w-full text-sm"
          placeholder="이름 (선택, 비워두면 URL로 저장)"
          value={label}
          onChange={e => setLabel(e.target.value)}
        />
        {error && <p className="text-xs text-[#e07070]">{error}</p>}
      </div>

      <div className="flex flex-col gap-2">
        {links.length === 0 && (
          <p className="text-sm text-[#c0b0a4] text-center py-4">
            유튜브 링크를 추가해보세요 🎬
          </p>
        )}
        {links.map(l => (
          <div
            key={l.id}
            className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors group ${
              playing?.id === l.id ? "bg-[#ffe4d6]" : "bg-white hover:bg-[#f5ede6]"
            }`}
            onClick={() => setPlaying(l)}
          >
            <div className="w-8 h-8 rounded-lg bg-[#f0e8e0] flex items-center justify-center flex-shrink-0">
              <Youtube size={16} className={playing?.id === l.id ? "text-[#f4a67a]" : "text-[#9b8c80]"} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3d3530] truncate">{l.title}</p>
              <p className="text-xs text-[#9b8c80]">{l.type === "playlist" ? "재생목록" : "영상"}</p>
            </div>
            {playing?.id === l.id && (
              <span className="text-xs text-[#f4a67a] font-medium flex-shrink-0">재생 중</span>
            )}
            <button
              onClick={e => { e.stopPropagation(); remove(l.id); }}
              className="opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070] transition-opacity flex-shrink-0"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
//  Spotify
// ─────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = "http://localhost:1420/callback";
const SCOPES = [
  "streaming", "user-read-email", "user-read-private",
  "user-read-playback-state", "user-modify-playback-state",
  "playlist-read-private", "playlist-read-collaborative",
].join(" ");

function getToken() { return localStorage.getItem("spotify_token"); }

function SpotifyTab() {
  const [token, setToken] = useState(getToken());
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [playing, setPlaying] = useState(false);
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
    if (window.Spotify) { initPlayer(token); return; }
    const script = document.createElement("script");
    script.src = "https://sdk.scdn.co/spotify-player.js";
    script.async = true;
    document.body.appendChild(script);
    window.onSpotifyWebPlaybackSDKReady = () => initPlayer(token);
  }, [token]);

  const initPlayer = (t) => {
    const player = new window.Spotify.Player({
      name: "Study Desk", getOAuthToken: cb => cb(t), volume: 0.6,
    });
    player.addListener("ready", ({ device_id }) => { setDeviceId(device_id); setPlayerReady(true); });
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      setPlaying(!state.paused);
      setTrack(state.track_window?.current_track);
    });
    player.connect();
    playerRef.current = player;
  };

  useEffect(() => {
    if (!token) return;
    fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    }).then(r => r.json()).then(d => { if (d.items) setPlaylists(d.items); }).catch(() => {});
  }, [token]);

  const login = () => {
    window.location.href =
      `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  };
  const logout = () => { localStorage.removeItem("spotify_token"); setToken(null); setPlaylists([]); setTrack(null); };
  const play = async (uri) => {
    if (!deviceId || !token) return;
    setSelected(uri);
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: uri }),
    });
  };

  if (!CLIENT_ID) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-4xl">🎵</span>
        <p className="text-sm font-medium text-[#3d3530]">Spotify 연동 설정 필요</p>
        <div className="card text-left max-w-xs w-full text-xs text-[#7a6b5f] flex flex-col gap-2">
          <p>1. <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-[#f4a67a] underline">Spotify Developer Dashboard</a>에서 앱 생성</p>
          <p>2. Redirect URI → <code className="bg-[#f5ede6] px-1 rounded">http://localhost:1420/callback</code></p>
          <p>3. 프로젝트 루트 <code className="bg-[#f5ede6] px-1 rounded">.env</code>에 추가:</p>
          <code className="bg-[#f5ede6] p-2 rounded block">VITE_SPOTIFY_CLIENT_ID=클라이언트ID</code>
          <p>4. 앱 재시작</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6">
        <span className="text-5xl">🎵</span>
        <p className="text-lg font-semibold text-[#3d3530]">Spotify 연결</p>
        <p className="text-sm text-[#9b8c80]">공부할 때 음악을 틀어봐요</p>
        <button className="btn-primary px-8 py-3" onClick={login}>Spotify 로그인</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#3d3530]">내 플레이리스트</span>
        <button onClick={logout} className="btn-ghost text-xs px-3 py-1">로그아웃</button>
      </div>

      {track && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center gap-3">
            {track.album?.images?.[0]?.url && (
              <img src={track.album.images[0].url} alt="" className="w-12 h-12 rounded-lg object-cover" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3d3530] truncate">{track.name}</p>
              <p className="text-xs text-[#9b8c80] truncate">{track.artists?.map(a => a.name).join(", ")}</p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-4">
            <button onClick={() => playerRef.current?.previousTrack()} className="text-[#9b8c80] hover:text-[#3d3530] text-lg">⏮</button>
            <button onClick={() => playerRef.current?.togglePlay()} className="w-10 h-10 rounded-full bg-[#f4a67a] text-white flex items-center justify-center text-lg hover:bg-[#e8895e]">
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={() => playerRef.current?.nextTrack()} className="text-[#9b8c80] hover:text-[#3d3530] text-lg">⏭</button>
          </div>
        </div>
      )}

      {!playerReady && <p className="text-xs text-[#c0b0a4] text-center">플레이어 연결 중...</p>}

      {playlists.map(p => (
        <div key={p.id} onClick={() => play(p.uri)}
          className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${selected === p.uri ? "bg-[#ffe4d6]" : "hover:bg-[#f5ede6]"}`}>
          {p.images?.[0]?.url
            ? <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            : <div className="w-10 h-10 rounded-lg bg-[#f0e8e0] flex items-center justify-center text-lg">🎵</div>
          }
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-[#3d3530] truncate">{p.name}</p>
            <p className="text-xs text-[#9b8c80]">{p.tracks?.total}곡</p>
          </div>
          {selected === p.uri && playing && <span className="text-[#f4a67a] text-xs">재생 중</span>}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
//  Music (탭 전환)
// ─────────────────────────────────────────────

export default function Music() {
  const [tab, setTab] = useState("youtube");

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center gap-1 px-6 pt-5 pb-0 flex-shrink-0">
        <h2 className="text-lg font-semibold text-[#3d3530] mr-3">음악</h2>
        <button
          onClick={() => setTab("youtube")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "youtube" ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80]"}`}
        >
          <Youtube size={13} /> YouTube
        </button>
        <button
          onClick={() => setTab("spotify")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all ${tab === "spotify" ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80]"}`}
        >
          <Music2 size={13} /> Spotify
        </button>
      </div>
      <div className="flex-1 overflow-hidden">
        {tab === "youtube" ? <YouTubeTab /> : <SpotifyTab />}
      </div>
    </div>
  );
}
