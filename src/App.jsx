import { useState, useEffect, useRef } from "react";
import "./index.css";
import { useStore } from "./store";
import { format, differenceInDays, parseISO } from "date-fns";

import Todo from "./components/Todo";
import Memo from "./components/Memo";
import CalendarView from "./components/CalendarView";
import FocusReport from "./components/FocusReport";
import Diary from "./components/Diary";
import MusicPanel from "./components/MusicPanel";

// ── 미니 뽀모도로 (헤더용) ────────────────────────────
function MiniTimer({ onSession }) {
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [mode, setMode] = useState("focus"); // focus | break
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
              setMode("break");
              setSeconds(5 * 60);
            } else {
              setMode("focus");
              setSeconds(25 * 60);
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

  const reset = () => { setRunning(false); setSeconds(25 * 60); setMode("focus"); };
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const total = mode === "focus" ? 25 * 60 : 5 * 60;
  const pct = ((total - seconds) / total) * 100;

  return (
    <div className="flex items-center gap-2">
      <div className="relative w-8 h-8 flex-shrink-0">
        <svg width="32" height="32" className="-rotate-90">
          <circle cx="16" cy="16" r="13" fill="none" stroke="#f0e8e0" strokeWidth="3" />
          <circle cx="16" cy="16" r="13" fill="none"
            stroke={mode === "focus" ? "#f4a67a" : "#a8d8b0"}
            strokeWidth="3" strokeLinecap="round"
            strokeDasharray={`${2 * Math.PI * 13}`}
            strokeDashoffset={`${2 * Math.PI * 13 * (1 - pct / 100)}`}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-[#3d3530]">
          {mode === "focus" ? "🍅" : "☕"}
        </span>
      </div>
      <span className="text-sm font-bold tabular-nums text-[#3d3530]">{mm}:{ss}</span>
      <div className="flex gap-1">
        <button
          onClick={() => setRunning(r => !r)}
          className="w-6 h-6 rounded-full bg-[#f4a67a] text-white text-xs flex items-center justify-center hover:bg-[#e8895e]"
        >
          {running ? "⏸" : "▶"}
        </button>
        <button onClick={reset} className="w-6 h-6 rounded-full bg-[#f0e8e0] text-[#9b8c80] text-xs flex items-center justify-center hover:bg-[#e8d8cc]">
          ↺
        </button>
      </div>
    </div>
  );
}

// ── 미니 D-Day 칩 ────────────────────────────────────
function MiniDday() {
  const { ddays } = useStore();
  if (ddays.length === 0) return null;

  const nearest = [...ddays].sort((a, b) => {
    return Math.abs(differenceInDays(parseISO(a.date), new Date()))
         - Math.abs(differenceInDays(parseISO(b.date), new Date()));
  })[0];

  const diff = differenceInDays(parseISO(nearest.date), new Date());
  const text = diff === 0 ? "D-Day" : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;

  return (
    <div className="flex items-center gap-1 bg-[#fff3ec] border border-[#fdd9c0] rounded-full px-2.5 py-0.5">
      <span className="text-xs">📆</span>
      <span className="text-xs font-semibold text-[#c0724a]">{text}</span>
      <span className="text-xs text-[#9b8c80] max-w-[70px] truncate">{nearest.label}</span>
    </div>
  );
}

// ── 하단 탭 목록 ─────────────────────────────────────
const BOTTOM_TABS = [
  { id: "todo",   icon: "✅", label: "할 일" },
  { id: "memo",   icon: "📝", label: "메모" },
  { id: "cal",    icon: "🗓", label: "캘린더" },
  { id: "report", icon: "📊", label: "리포트" },
  { id: "diary",  icon: "🌸", label: "일기" },
];

const VIEWS = {
  todo:   <Todo />,
  memo:   <Memo />,
  cal:    <CalendarView />,
  report: <FocusReport />,
  diary:  <Diary />,
};

// ── 앱 루트 ──────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("todo");
  const [musicOpen, setMusicOpen] = useState(false);
  const { addSession } = useStore();

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#faf8f5]">

      {/* ── 헤더 ── */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#f0e8e0]">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-[#f4a67a] flex items-center justify-center text-white text-xs font-bold flex-shrink-0">S</span>
          <MiniTimer onSession={addSession} />
        </div>
        <div className="flex items-center gap-2">
          <MiniDday />
          <button
            onClick={() => setMusicOpen(o => !o)}
            className={`w-7 h-7 rounded-full flex items-center justify-center text-sm transition-colors ${musicOpen ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80] hover:bg-[#e8d8cc]"}`}
          >
            🎵
          </button>
        </div>
      </header>

      {/* ── 뮤직 패널 (접었다 폈다) ── */}
      {musicOpen && (
        <div className="flex-shrink-0 border-b border-[#f0e8e0] bg-white" style={{ maxHeight: 280 }}>
          <MusicPanel />
        </div>
      )}

      {/* ── 메인 콘텐츠 ── */}
      <main className="flex-1 overflow-hidden">
        {VIEWS[tab]}
      </main>

      {/* ── 하단 탭바 ── */}
      <nav className="flex-shrink-0 flex items-center justify-around px-2 py-1.5 bg-white border-t border-[#f0e8e0]">
        {BOTTOM_TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors ${
              tab === t.id ? "bg-[#ffe4d6] text-[#c0724a]" : "text-[#9b8c80] hover:bg-[#f5ede6]"
            }`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </nav>

    </div>
  );
}
