import { useState } from "react";
import { useEffect, useRef } from "react";
import "./index.css";
import { useStore } from "./store";
import { format } from "date-fns";

import Home        from "./components/Home";
import Todo        from "./components/Todo";
import Memo        from "./components/Memo";
import Pomodoro    from "./components/Pomodoro";
import Dday        from "./components/Dday";
import CalendarView from "./components/CalendarView";
import FocusReport  from "./components/FocusReport";
import Diary        from "./components/Diary";
import MusicPanel   from "./components/MusicPanel";

// ── 미니 뽀모도로 타이머 (헤더) ───────────────────────────────────────────────
function MiniTimer({ onSession }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("focus");
  const ref = useRef(null);

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(ref.current);
            setRunning(false);
            if (mode === "focus") {
              onSession(25, format(new Date(), "yyyy-MM-dd"));
              setMode("break"); setSeconds(5 * 60);
            } else {
              setMode("focus"); setSeconds(25 * 60);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, mode]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const total = mode === "focus" ? 25 * 60 : 5 * 60;
  const pct = ((total - seconds) / total) * 100;
  const r = 11, circ = 2 * Math.PI * r;

  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-7 h-7 flex-shrink-0">
        <svg width="28" height="28" className="-rotate-90">
          <circle cx="14" cy="14" r={r} fill="none" stroke="#f0e8e0" strokeWidth="2.5" />
          <circle cx="14" cy="14" r={r} fill="none"
            stroke={mode === "focus" ? "#f4a67a" : "#a8d8b0"}
            strokeWidth="2.5" strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct / 100)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[9px]">
          {mode === "focus" ? "🍅" : "☕"}
        </span>
      </div>
      <span className="text-xs font-bold tabular-nums text-[#3d3530]">{mm}:{ss}</span>
      <button
        onClick={() => setRunning(r => !r)}
        className="w-5 h-5 rounded-full bg-[#f4a67a] text-white text-[10px] flex items-center justify-center hover:bg-[#e8895e]"
      >{running ? "⏸" : "▶"}</button>
    </div>
  );
}

// ── 탭 정의 ───────────────────────────────────────────────────────────────────
const TABS = [
  { id: "home",   label: "홈",    emoji: "🏠", color: "#ffd6c0" },
  { id: "todo",   label: "할일",  emoji: "✅", color: "#d6f0d6" },
  { id: "memo",   label: "메모",  emoji: "📝", color: "#ffefc0" },
  { id: "timer",  label: "타이머",emoji: "🍅", color: "#ffd6d6" },
  { id: "dday",   label: "디데이",emoji: "📆", color: "#d6e8ff" },
  { id: "cal",    label: "캘린더",emoji: "🗓", color: "#e8d6ff" },
  { id: "music",  label: "음악",  emoji: "🎵", color: "#d6fff0" },
  { id: "report", label: "리포트",emoji: "📊", color: "#ffe8d6" },
  { id: "diary",  label: "일기",  emoji: "🌸", color: "#ffd6ee" },
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

// ── 앱 루트 ───────────────────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("home");
  const { addSession } = useStore();

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#f5f0eb]">

      {/* ── 왼쪽 인덱스 탭 ── */}
      <div className="relative flex-shrink-0" style={{ width: 32 }}>
        <div className="absolute inset-0 flex flex-col justify-center gap-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              title={t.label}
              style={{
                background: tab === t.id ? t.color : "#ede8e3",
                borderRight: tab === t.id ? "none" : "1px solid #ddd4cc",
                borderTop: "1px solid #ddd4cc",
                borderBottom: "1px solid #ddd4cc",
                borderLeft: "2px solid " + (tab === t.id ? t.color : "#c8bfb5"),
                borderRadius: "6px 0 0 6px",
                marginRight: tab === t.id ? -1 : 0,
                zIndex: tab === t.id ? 10 : 1,
                position: "relative",
                width: tab === t.id ? 34 : 30,
                height: 44,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: tab === t.id ? "-2px 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span style={{ fontSize: 14 }}>{t.emoji}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── 메인 패널 ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white"
        style={{ borderLeft: "1px solid #e0d8d0", boxShadow: "-2px 0 12px rgba(0,0,0,0.06)" }}>

        {/* 헤더 */}
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-2 border-b border-[#f0e8e0]"
          style={{ background: TABS.find(t => t.id === tab)?.color + "55" || "#fff" }}>
          <div className="flex items-center gap-1.5">
            <span className="text-sm">{TABS.find(t => t.id === tab)?.emoji}</span>
            <span className="text-xs font-semibold text-[#5a4a3f]">
              {TABS.find(t => t.id === tab)?.label}
            </span>
          </div>
          <MiniTimer onSession={addSession} />
        </header>

        {/* 콘텐츠 */}
        <main className="flex-1 overflow-hidden">
          {VIEWS[tab]}
        </main>
      </div>

    </div>
  );
}
