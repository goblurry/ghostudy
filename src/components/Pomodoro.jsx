import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { format } from "date-fns";

const MODES = { focus: 25, short: 5, long: 15 };

export default function Pomodoro() {
  const { addSession } = useStore();
  const [mode, setMode] = useState("focus");
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [customFocus, setCustomFocus] = useState(25);
  const ref = useRef(null);

  const total = (mode === "focus" ? customFocus : MODES[mode]) * 60;

  useEffect(() => {
    if (running) {
      ref.current = setInterval(() => {
        setSeconds(s => {
          if (s <= 1) {
            clearInterval(ref.current);
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
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, mode, customFocus]);

  const switchMode = (m) => {
    setMode(m); setRunning(false);
    setSeconds((m === "focus" ? customFocus : MODES[m]) * 60);
  };
  const reset = () => { setRunning(false); setSeconds((mode === "focus" ? customFocus : MODES[mode]) * 60); };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  const r = 80, circ = 2 * Math.PI * r;
  const dash = circ * (1 - (total - seconds) / total);

  const modeColor = mode === "focus" ? "var(--peach)" : "var(--mint)";

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 20, padding: 20 }}>

      {/* 모드 전환 */}
      <div style={{ display: "flex", gap: 6 }}>
        {[["focus","집중"],["short","짧은 휴식"],["long","긴 휴식"]].map(([id, label]) => (
          <button key={id} onClick={() => switchMode(id)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 11, cursor: "pointer",
            border: "none", fontFamily: "Galmuri, sans-serif",
            background: mode === id ? modeColor : "var(--surface)",
            color: mode === id ? "var(--bg)" : "var(--sub)",
            fontWeight: mode === id ? "bold" : "normal",
          }}>{label}</button>
        ))}
      </div>

      {/* 링 타이머 */}
      <div style={{ position: "relative" }}>
        <svg width={200} height={200} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={100} cy={100} r={r} fill="none" stroke="var(--sidebar)" strokeWidth={8} />
          <circle cx={100} cy={100} r={r} fill="none"
            stroke={modeColor} strokeWidth={8} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={dash}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex",
          flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 38, fontWeight: "bold", color: "var(--text)" }}>{mm}:{ss}</span>
          <span style={{ fontSize: 10, color: "var(--sub)", marginTop: 4 }}>
            {mode === "focus" ? "집중 시간" : "휴식 중"}
          </span>
        </div>
      </div>

      {/* 컨트롤 */}
      <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
        <button className="btn-ghost" onClick={reset} style={{ padding: "6px 12px" }}>↺ 리셋</button>
        <button onClick={() => setRunning(r => !r)} style={{
          background: running ? "var(--sub)" : modeColor,
          color: "var(--bg)", border: "none", borderRadius: 8,
          padding: "8px 24px", fontSize: 12, fontWeight: "bold",
          cursor: "pointer", fontFamily: "Galmuri, sans-serif",
        }}>
          {running ? "⏸ 일시정지" : "▶ 시작"}
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontSize: 10, color: "var(--sub)" }}>집중(분)</span>
          <input type="text" value={customFocus} style={{ width: 40, textAlign: "center" }}
            onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) { setCustomFocus(v); if (mode === "focus" && !running) setSeconds(v * 60); }}} />
        </div>
      </div>

      {/* 세션 도트 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        {Array.from({ length: Math.min(cycle, 8) }).map((_, i) => (
          <span key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: "var(--peach)", display: "inline-block" }} />
        ))}
        <span style={{ fontSize: 10, color: "var(--sub)" }}>
          {cycle === 0 ? "세션 없음" : `${cycle}세션 완료`}
        </span>
      </div>
    </div>
  );
}
