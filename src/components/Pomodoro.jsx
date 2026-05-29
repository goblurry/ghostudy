import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Play, Pause, RotateCcw, Settings } from "lucide-react";

const MODES = { focus: 25, short: 5, long: 15 };

export default function Pomodoro() {
  const { addSession } = useStore();
  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(MODES.focus * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [customFocus, setCustomFocus] = useState(25);
  const intervalRef = useRef(null);

  const total = (mode === "focus" ? customFocus : MODES[mode]) * 60;
  const progress = 1 - seconds / total;

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(intervalRef.current);
            setRunning(false);
            if (mode === "focus") {
              addSession(customFocus, format(new Date(), "yyyy-MM-dd"));
              setCycle(c => c + 1);
            }
            return 0;
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }
    return () => clearInterval(intervalRef.current);
  }, [running, mode, customFocus]);

  const switchMode = (m) => {
    setMode(m);
    setRunning(false);
    setSeconds((m === "focus" ? customFocus : MODES[m]) * 60);
  };

  const reset = () => {
    setRunning(false);
    setSeconds((mode === "focus" ? customFocus : MODES[mode]) * 60);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");

  const r = 80;
  const circumference = 2 * Math.PI * r;
  const dash = circumference * (1 - progress);

  return (
    <div className="h-full flex flex-col items-center justify-center gap-6 p-6">
      <div className="flex gap-2">
        {["focus", "short", "long"].map(m => (
          <button
            key={m}
            onClick={() => switchMode(m)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              mode === m ? "bg-[#f4a67a] text-white" : "bg-[#f0e8e0] text-[#9b8c80]"
            }`}
          >
            {m === "focus" ? "집중" : m === "short" ? "짧은 휴식" : "긴 휴식"}
          </button>
        ))}
      </div>

      <div className="relative">
        <svg width={200} height={200} className="-rotate-90">
          <circle cx={100} cy={100} r={r} fill="none" stroke="#f0e8e0" strokeWidth={8} />
          <circle
            cx={100} cy={100} r={r}
            fill="none"
            stroke={mode === "focus" ? "#f4a67a" : "#a8d8b0"}
            strokeWidth={8}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold text-[#3d3530] tabular-nums">{mm}:{ss}</span>
          <span className="text-xs text-[#9b8c80] mt-1">
            {mode === "focus" ? "집중 시간" : "휴식 중"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button onClick={reset} className="btn-ghost flex items-center gap-1">
          <RotateCcw size={14} />
        </button>
        <button onClick={() => setRunning(r => !r)} className="btn-primary flex items-center gap-2 px-8">
          {running ? <Pause size={16} /> : <Play size={16} />}
          {running ? "일시정지" : "시작"}
        </button>
        <button onClick={() => setShowSettings(s => !s)} className="btn-ghost flex items-center gap-1">
          <Settings size={14} />
        </button>
      </div>

      {showSettings && (
        <div className="card flex items-center gap-3">
          <label className="text-sm text-[#7a6b5f]">집중 시간 (분)</label>
          <input
            type="text"
            className="w-16 text-center"
            value={customFocus}
            onChange={e => {
              const v = parseInt(e.target.value);
              if (!isNaN(v) && v > 0) {
                setCustomFocus(v);
                if (mode === "focus" && !running) setSeconds(v * 60);
              }
            }}
          />
        </div>
      )}

      <div className="flex items-center gap-2 text-sm text-[#9b8c80]">
        <span>오늘</span>
        {Array.from({ length: Math.min(cycle, 8) }).map((_, i) => (
          <span key={i} className="w-3 h-3 rounded-full bg-[#f4a67a] inline-block" />
        ))}
        {cycle === 0 && <span className="text-[#c0b0a4]">세션 없음</span>}
        {cycle > 0 && <span>{cycle}세션 완료</span>}
      </div>
    </div>
  );
}
