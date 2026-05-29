import { useState, useEffect, useRef } from "react";
import "./index.css";
import { useStore } from "./store";
import { format, differenceInDays, parseISO } from "date-fns";

import Home         from "./components/Home";
import Todo         from "./components/Todo";
import Memo         from "./components/Memo";
import Pomodoro     from "./components/Pomodoro";
import Dday         from "./components/Dday";
import CalendarView from "./components/CalendarView";
import FocusReport  from "./components/FocusReport";
import Diary        from "./components/Diary";
import MusicPanel   from "./components/MusicPanel";

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
  const focusText = todayMins >= 60
    ? `${Math.floor(todayMins / 60)}h ${todayMins % 60}m`
    : `${todayMins}m`;

  const nearestDday = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), new Date()) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff)[0];

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss2 = String(seconds % 60).padStart(2, "0");

  return (
    <header style={{
      background: "var(--bg)",
      borderBottom: "1px solid var(--border)",
      flexShrink: 0,
    }}>
      {/* 1줄: 음악 컨트롤 */}
      <div style={{ display: "flex", alignItems: "center", gap: 8,
        padding: "5px 12px", borderBottom: "1px solid var(--border)" }}>
        {["⏮", nowPlaying.isPlaying ? "⏸" : "▶", "⏭"].map((icon, i) => (
          <button key={i} onClick={() => { if (i === 1) setNowPlaying({ isPlaying: !nowPlaying.isPlaying }); }}
            style={{ background: "none", border: "none", color: "var(--sub)",
              cursor: "pointer", fontSize: 12, padding: "1px 2px", lineHeight: 1 }}
            onMouseEnter={e => e.target.style.color = "var(--text)"}
            onMouseLeave={e => e.target.style.color = "var(--sub)"}
          >{icon}</button>
        ))}
        <span style={{ fontSize: 10, color: nowPlaying.title ? "var(--text)" : "var(--sub)",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: 160 }}>
          {nowPlaying.title || "재생 없음"}
        </span>
        <div style={{ flex: 1, height: 2, background: "var(--border)", borderRadius: 2 }}>
          <div style={{ width: nowPlaying.isPlaying ? "40%" : "0%",
            height: "100%", background: "var(--blue)", borderRadius: 2, transition: "width 0.3s" }} />
        </div>
      </div>

      {/* 2줄: 날짜 + 집중 + D-Day */}
      <div style={{ display: "flex", alignItems: "center", gap: 8,
        padding: "4px 12px" }}>
        <span style={{ fontSize: 10, color: "var(--sub)" }}>{format(new Date(), "M/d")}</span>
        <span style={{ fontSize: 10, color: "var(--peach)" }}>🍅 {focusText}</span>
        <button onClick={() => setTimerRunning(r => !r)} style={{
          background: timerRunning ? "var(--peach)" : "var(--surface)",
          border: "1px solid var(--border)", borderRadius: 5,
          color: timerRunning ? "var(--bg)" : "var(--sub)",
          fontSize: 10, padding: "1px 7px", cursor: "pointer",
          fontFamily: "Galmuri, sans-serif",
        }}>{timerRunning ? `${mm}:${ss2} ⏸` : `${mm}:${ss2} ▶`}</button>
        <div style={{ width: 1, height: 12, background: "var(--border)" }} />
        {nearestDday ? (
          <>
            <span style={{ fontSize: 10, color: "var(--sub)", maxWidth: 80,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {nearestDday.label}
            </span>
            <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--yellow)" }}>
              D-{nearestDday.diff}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 10, color: "var(--border)" }}>D-Day 없음</span>
        )}
      </div>
    </header>
  );
}

// ── 탭 ───────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",   label: "홈" },
  { id: "todo",   label: "할 일" },
  { id: "memo",   label: "메모" },
  { id: "timer",  label: "타이머" },
  { id: "dday",   label: "디데이" },
  { id: "cal",    label: "캘린더" },
  { id: "music",  label: "음악" },
  { id: "report", label: "리포트" },
  { id: "diary",  label: "일기" },
];

const VIEWS = {
  home:   <Home />,
  todo:   <Todo />,
  memo:   <Memo />,
  timer:  <Pomodoro />,
  dday:   <Dday />,
  cal:    <CalendarView />,
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
