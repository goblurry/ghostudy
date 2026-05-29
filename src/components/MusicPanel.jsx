import { useState } from "react";
import { Plus, Trash2, Youtube, Music2 } from "lucide-react";

// ── YouTube ─────────────────────────────────
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
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`;
}
function loadYT() {
  try { return JSON.parse(localStorage.getItem("yt_links")) || []; } catch { return []; }
}
function saveYT(items) { localStorage.setItem("yt_links", JSON.stringify(items)); }

function YouTubePanel() {
  const [links, setLinks] = useState(loadYT);
  const [input, setInput] = useState("");
  const [playing, setPlaying] = useState(links[0] || null);
  const [error, setError] = useState("");

  const handleAdd = () => {
    setError("");
    const parsed = parseYouTubeId(input.trim());
    if (!parsed) { setError("유효한 URL이 아니에요"); return; }
    const newItem = { id: Date.now(), title: input.trim(), url: input.trim(), ...parsed };
    const updated = [...links, newItem];
    setLinks(updated);
    saveYT(updated);
    setInput("");
    setPlaying(newItem);
  };

  const remove = (id) => {
    const updated = links.filter(l => l.id !== id);
    setLinks(updated);
    saveYT(updated);
    if (playing?.id === id) setPlaying(updated[0] || null);
  };

  return (
    <div className="flex gap-0 h-full">
      {/* 플레이어 */}
      <div className="w-[160px] flex-shrink-0 bg-black">
        {playing
          ? <iframe key={playing.id} src={embedSrc(playing)} className="w-full h-full"
              allow="autoplay; encrypted-media" allowFullScreen frameBorder="0" />
          : <div className="w-full h-full flex items-center justify-center text-[#555] text-xs">영상 없음</div>
        }
      </div>

      {/* 목록 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 입력 */}
        <div className="flex gap-1 p-2 border-b border-[#f0e8e0]">
          <input
            type="text"
            className="flex-1 text-xs py-1 px-2"
            placeholder="YouTube 링크 붙여넣기"
            value={input}
            onChange={e => { setInput(e.target.value); setError(""); }}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
          />
          <button onClick={handleAdd} className="btn-primary text-xs px-2 py-1 flex items-center gap-0.5">
            <Plus size={11} />
          </button>
        </div>
        {error && <p className="text-[10px] text-[#e07070] px-2">{error}</p>}

        {/* 목록 */}
        <div className="flex-1 overflow-y-auto">
          {links.length === 0
            ? <p className="text-[11px] text-[#c0b0a4] text-center py-4">링크를 추가해봐요 🎬</p>
            : links.map(l => (
              <div
                key={l.id}
                onClick={() => setPlaying(l)}
                className={`flex items-center gap-2 px-2 py-1.5 cursor-pointer group transition-colors ${playing?.id === l.id ? "bg-[#ffe4d6]" : "hover:bg-[#f5ede6]"}`}
              >
                <Youtube size={12} className={playing?.id === l.id ? "text-[#f4a67a]" : "text-[#9b8c80]"} />
                <span className="flex-1 text-xs text-[#3d3530] truncate">{l.title}</span>
                <button onClick={e => { e.stopPropagation(); remove(l.id); }}
                  className="opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070]">
                  <Trash2 size={11} />
                </button>
              </div>
            ))
          }
        </div>
      </div>
    </div>
  );
}

// ── Spotify ──────────────────────────────────
const CLIENT_ID = import.meta.env.VITE_SPOTIFY_CLIENT_ID || "";

function SpotifyPanel() {
  const token = localStorage.getItem("spotify_token");
  if (!CLIENT_ID) return (
    <div className="flex items-center justify-center h-full text-xs text-[#9b8c80] p-4 text-center">
      .env에 VITE_SPOTIFY_CLIENT_ID를 설정하세요
    </div>
  );
  if (!token) return (
    <div className="flex flex-col items-center justify-center h-full gap-2">
      <span className="text-2xl">🎵</span>
      <button className="btn-primary text-xs px-4 py-1.5" onClick={() => {
        const REDIRECT_URI = "http://localhost:1420/callback";
        const SCOPES = "streaming user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private";
        window.location.href = `https://accounts.spotify.com/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
      }}>Spotify 로그인</button>
    </div>
  );
  return (
    <div className="flex items-center justify-center h-full text-xs text-[#9b8c80]">
      Spotify 연결됨 — 전체 화면에서 사용하세요
    </div>
  );
}

// ── 메인 패널 ────────────────────────────────
export default function MusicPanel() {
  const [tab, setTab] = useState("youtube");

  return (
    <div className="flex flex-col" style={{ height: 280 }}>
      <div className="flex gap-1 px-3 pt-2 pb-0 flex-shrink-0">
        {[
          { id: "youtube", icon: <Youtube size={11} />, label: "YouTube" },
          { id: "spotify", icon: <Music2 size={11} />, label: "Spotify" },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${tab === t.id ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80]"}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-hidden mt-2">
        {tab === "youtube" ? <YouTubePanel /> : <SpotifyPanel />}
      </div>
    </div>
  );
}
