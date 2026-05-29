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
  { id: "home",   label: "홈",    color: "#fff8f4" },
  { id: "todo",   label: "할 일", color: "#f4fff4" },
  { id: "memo",   label: "메모",  color: "#fffdf0" },
  { id: "timer",  label: "타이머",color: "#fff4f4" },
  { id: "dday",   label: "디데이",color: "#f0f6ff" },
  { id: "cal",    label: "캘린더",color: "#f6f0ff" },
  { id: "music",  label: "음악",  color: "#f0fff8" },
  { id: "report", label: "리포트",color: "#fff8f0" },
  { id: "diary",  label: "일기",  color: "#fff0f8" },
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

  const activeColor = TABS.find(t => t.id === tab)?.color || "#fff";

  return (
    // 바깥: 투명 배경, 탭이 삐져나올 공간 확보
    <div className="flex h-screen w-screen overflow-visible" style={{ background: "transparent" }}>

      {/* ── 왼쪽 인덱스 탭 ── */}
      <div className="flex-shrink-0 flex flex-col justify-center" style={{ width: 22, zIndex: 20 }}>
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                transform: "rotate(180deg)",
                background: isActive ? activeColor : "#ede8e2",
                border: "1px solid #d4c8bc",
                borderRight: isActive ? "none" : "1px solid #d4c8bc",
                borderRadius: "0 0 6px 6px",
                // 활성 탭은 오른쪽 경계 없애서 메인과 이어짐
                marginRight: isActive ? 0 : 0,
                width: 22,
                height: 52,
                fontSize: 9,
                fontFamily: "Galmuri, sans-serif",
                color: isActive ? "#5a4a3f" : "#9b8c80",
                fontWeight: isActive ? "bold" : "normal",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                letterSpacing: "0.05em",
                transition: "all 0.12s",
                position: "relative",
                zIndex: isActive ? 10 : 1,
                boxShadow: isActive ? "-2px 0 6px rgba(0,0,0,0.06)" : "none",
                flexShrink: 0,
              }}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* ── 메인 패널 ── */}
      <div className="flex-1 flex flex-col overflow-hidden"
        style={{
          background: activeColor,
          border: "1px solid #d4c8bc",
          borderRadius: "0 8px 8px 0",
          boxShadow: "2px 2px 12px rgba(0,0,0,0.1)",
          transition: "background 0.15s",
        }}>

        {/* 헤더 */}
        <header className="flex-shrink-0 flex items-center justify-between px-3 py-2"
          style={{ borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
          <span className="text-xs font-bold text-[#5a4a3f]">
            {TABS.find(t => t.id === tab)?.label}
          </span>
          <MiniTimer onSession={addSession} />
        </header>

        {/* 콘텐츠 — 흰 카드 영역 */}
        <main className="flex-1 overflow-hidden bg-white m-2 rounded-lg"
          style={{ boxShadow: "inset 0 1px 4px rgba(0,0,0,0.04)" }}>
          {VIEWS[tab]}
        </main>
      </div>

    </div>
  );
}
