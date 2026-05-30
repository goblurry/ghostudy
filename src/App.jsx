import { useState, useEffect, useRef } from "react";
import "./index.css";
import { useStore } from "./store";
import { format, differenceInDays, parseISO } from "date-fns";

import Home         from "./components/Home";
import Todo         from "./components/Todo";
import Memo         from "./components/Memo";
import CalendarDday from "./components/CalendarDday";
import FocusReport  from "./components/FocusReport";
import Diary        from "./components/Diary";
import MusicPanel   from "./components/MusicPanel";
import { getCurrentWindow } from "@tauri-apps/api/window";

// ── 헤더 미니플레이어 ─────────────────────────────────────────────────────────
function Header() {
  const { nowPlaying, setNowPlaying, sessions, ddays, addSession } = useStore();
  const [seconds, setSeconds] = useState(25 * 60);
  const [timerRunning, setTimerRunning] = useState(false);
  const timerRef = useRef(null);

  // 뽀모도로 타이머
  useEffect(() => {
    if (timerRunning) {
      timerRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(timerRef.current);
            setTimerRunning(false);
            addSession(25, format(new Date(), "yyyy-MM-dd"));
            setSeconds(25 * 60);
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [timerRunning]);

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMins = sessions
    .filter(s => s.date === today)
    .reduce((a, s) => a + s.minutes, 0);
  const nearestDday = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), new Date()) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff)[0];

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss2 = String(seconds % 60).padStart(2, "0");

  const focusH = Math.floor(todayMins / 60);
  const focusM = todayMins % 60;

  return (
    <header data-tauri-drag-region style={{
      background: "rgba(184,212,245,0.13)",
      borderBottom: "1px solid rgba(184,212,245,0.18)",
      flexShrink: 0,
    }}>

      {/* ── 1줄: 신호등 + 음악 컨트롤 + marquee ── */}
      <div data-tauri-drag-region style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "7px 12px", borderBottom: "1px solid rgba(184,212,245,0.12)",
      }}>
        {/* 신호등 */}
        {[
          { color: "#FF5F57", action: () => getCurrentWindow().close() },
          { color: "#FFBD2E", action: () => getCurrentWindow().minimize() },
          { color: "#28CA41", action: () => getCurrentWindow().toggleMaximize() },
        ].map((btn, i) => (
          <button key={i} onClick={btn.action} style={{
            width: 12, height: 12, borderRadius: "50%", border: "none",
            background: btn.color, cursor: "pointer", padding: 0, flexShrink: 0,
          }} />
        ))}

        <div style={{ width: 1, height: 12, background: "rgba(184,212,245,0.2)", marginLeft: 2 }} />

        {/* 음악 컨트롤 */}
        {["⏮", nowPlaying.isPlaying ? "⏸" : "▶", "⏭"].map((icon, i) => (
          <button key={i}
            onClick={() => { if (i === 1) setNowPlaying({ isPlaying: !nowPlaying.isPlaying }); }}
            style={{
              background: "none", border: "none", color: "rgba(184,212,245,0.7)",
              cursor: "pointer", fontSize: 13, padding: "1px 3px", lineHeight: 1,
            }}
            onMouseEnter={e => e.target.style.color = "#B8D4F5"}
            onMouseLeave={e => e.target.style.color = "rgba(184,212,245,0.7)"}
          >{icon}</button>
        ))}

        {/* 트랙명 marquee pill */}
        <div style={{
          flex: 1, background: "rgba(10,14,28,0.6)", borderRadius: 20,
          padding: "3px 14px", overflow: "hidden", minWidth: 0,
        }}>
          <div style={{
            fontSize: 11, color: "#B8D4F5", whiteSpace: "nowrap",
            display: "inline-block",
            animation: nowPlaying.title ? "marquee 22s linear infinite" : "none",
          }}>
            {nowPlaying.title || "재생 없음"}
          </div>
        </div>
      </div>

      {/* ── 2줄: 날짜(+D-Day) + 집중시간 ── */}
      <div data-tauri-drag-region style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 16px 12px",
      }}>
        {/* 날짜 + D-Day */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
          <span style={{ fontSize: 12, fontWeight: "normal", color: "var(--sub)", lineHeight: 1 }}>
            {format(new Date(), "yyyy.MM.dd (EEE)").toUpperCase()}
          </span>
          {nearestDday && (
            <span style={{ fontSize: 11, fontWeight: "bold", color: "var(--yellow)" }}>
              D-{nearestDday.diff}
            </span>
          )}
        </div>

        {/* 집중 시간 */}
        <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
          <span style={{ fontSize: 14, fontWeight: "bold", color: "var(--sub)", lineHeight: 1 }}>
            {String(focusH).padStart(2,"0")}
          </span>
          <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)", marginRight: 3 }}>H</span>
          <span style={{ fontSize: 14, fontWeight: "bold", color: "var(--sub)", lineHeight: 1 }}>
            {String(focusM).padStart(2,"0")}
          </span>
          <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)" }}>M</span>
        </div>
      </div>
    </header>
  );
}

// ── 탭 ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",   label: "홈" },
  { id: "todo",   label: "할 일" },
  { id: "cal",    label: "캘린더" },
  { id: "memo",   label: "메모" },
  { id: "music",  label: "음악" },
  { id: "report", label: "리포트" },
  { id: "diary",  label: "일기" },
];

const VIEWS = {
  home:   <Home />,
  todo:   <Todo />,
  cal:    <CalendarDday />,
  memo:   <Memo />,
  music:  <MusicPanel fullPage />,
  report: <FocusReport />,
  diary:  <Diary />,
};

// ── 앱 루트 ──────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw",
      background: "transparent", paddingLeft: 22 }}>

      {/* 인덱스 탭 */}
      <div style={{ width: 22, marginLeft: -22, display: "flex",
        flexDirection: "column", justifyContent: "center", zIndex: 20, flexShrink: 0 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`sidebar-item ${tab === t.id ? "active" : ""}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* 메인 패널 */}
      <div style={{
        flex: 1, display: "flex", flexDirection: "column", overflow: "hidden",
        background: "var(--bg)",
        border: "1px solid var(--border)",
        borderLeft: "none",
        borderRadius: "0 10px 10px 0",
        boxShadow: "4px 4px 20px rgba(0,0,0,0.4)",
      }}>
        <Header />
        <main style={{ flex: 1, overflow: "hidden" }}>
          {VIEWS[tab]}
        </main>
      </div>
    </div>
  );
}
