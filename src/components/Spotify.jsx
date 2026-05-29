import { useState, useEffect, useRef } from "react";

const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";
const REDIRECT_URI = "http://localhost:1420/callback";
const SCOPES = [
  "streaming",
  "user-read-email",
  "user-read-private",
  "user-read-playback-state",
  "user-modify-playback-state",
  "playlist-read-private",
  "playlist-read-collaborative",
].join(" ");

function getToken() {
  return localStorage.getItem("spotify_token");
}

export default function Spotify() {
  const [token, setToken] = useState(getToken());
  const [playlists, setPlaylists] = useState([]);
  const [selected, setSelected] = useState(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [deviceId, setDeviceId] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [track, setTrack] = useState(null);
  const playerRef = useRef(null);
  const noClientId = !CLIENT_ID;

  // Handle OAuth callback
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("access_token")) {
      const params = new URLSearchParams(hash.slice(1));
      const t = params.get("access_token");
      if (t) {
        localStorage.setItem("spotify_token", t);
        setToken(t);
        window.location.hash = "";
      }
    }
  }, []);

  // Load Spotify SDK
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
      name: "Study Desk",
      getOAuthToken: cb => cb(t),
      volume: 0.6,
    });
    player.addListener("ready", ({ device_id }) => {
      setDeviceId(device_id);
      setPlayerReady(true);
    });
    player.addListener("player_state_changed", (state) => {
      if (!state) return;
      setPlaying(!state.paused);
      setTrack(state.track_window?.current_track);
    });
    player.connect();
    playerRef.current = player;
  };

  // Fetch playlists
  useEffect(() => {
    if (!token) return;
    fetch("https://api.spotify.com/v1/me/playlists?limit=20", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => { if (d.items) setPlaylists(d.items); })
      .catch(() => {});
  }, [token]);

  const login = () => {
    window.location.href =
      `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  };

  const logout = () => {
    localStorage.removeItem("spotify_token");
    setToken(null);
    setPlaylists([]);
    setTrack(null);
  };

  const play = async (uri) => {
    if (!deviceId || !token) return;
    setSelected(uri);
    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ context_uri: uri }),
    });
  };

  const togglePlay = () => playerRef.current?.togglePlay();
  const prev = () => playerRef.current?.previousTrack();
  const next = () => playerRef.current?.nextTrack();

  if (noClientId) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-4 p-6 text-center">
        <span className="text-4xl">🎵</span>
        <p className="text-sm font-medium text-[#3d3530]">Spotify 연동 설정 필요</p>
        <div className="card text-left max-w-xs w-full text-xs text-[#7a6b5f] flex flex-col gap-2">
          <p className="font-medium text-[#3d3530]">설정 방법:</p>
          <p>1. <a href="https://developer.spotify.com/dashboard" target="_blank" className="text-[#f4a67a] underline">Spotify Developer Dashboard</a>에서 앱 생성</p>
          <p>2. Redirect URI에 <code className="bg-[#f5ede6] px-1 rounded">http://localhost:1420/callback</code> 추가</p>
          <p>3. 프로젝트 루트에 <code className="bg-[#f5ede6] px-1 rounded">.env</code> 파일 생성:</p>
          <code className="bg-[#f5ede6] p-2 rounded block">VITE_SPOTIFY_CLIENT_ID=여기에_클라이언트_ID</code>
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
        <p className="text-sm text-[#9b8c80] text-center">공부할 때 음악을 틀어봐요</p>
        <button className="btn-primary px-8 py-3" onClick={login}>Spotify 로그인</button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3530]">Spotify</h2>
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
            <button onClick={prev} className="text-[#9b8c80] hover:text-[#3d3530] text-lg">⏮</button>
            <button onClick={togglePlay} className="w-10 h-10 rounded-full bg-[#f4a67a] text-white flex items-center justify-center text-lg hover:bg-[#e8895e]">
              {playing ? "⏸" : "▶"}
            </button>
            <button onClick={next} className="text-[#9b8c80] hover:text-[#3d3530] text-lg">⏭</button>
          </div>
        </div>
      )}

      {!playerReady && (
        <p className="text-xs text-[#c0b0a4] text-center">플레이어 연결 중...</p>
      )}

      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium text-[#3d3530]">내 플레이리스트</p>
        {playlists.map(p => (
          <div
            key={p.id}
            onClick={() => play(p.uri)}
            className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-colors ${
              selected === p.uri ? "bg-[#ffe4d6]" : "hover:bg-[#f5ede6]"
            }`}
          >
            {p.images?.[0]?.url ? (
              <img src={p.images[0].url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-lg bg-[#f0e8e0] flex items-center justify-center text-lg">🎵</div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-[#3d3530] truncate">{p.name}</p>
              <p className="text-xs text-[#9b8c80]">{p.tracks?.total}곡</p>
            </div>
            {selected === p.uri && playing && <span className="text-[#f4a67a] text-xs">재생 중</span>}
          </div>
        ))}
        {playlists.length === 0 && (
          <p className="text-xs text-[#c0b0a4]">플레이리스트를 불러오는 중...</p>
        )}
      </div>
    </div>
  );
}
