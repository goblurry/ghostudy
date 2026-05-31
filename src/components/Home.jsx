import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { format, differenceInDays, parseISO } from "date-fns";
import ghostSvg from "../assets/ghost.svg";
import ghostSmileSvg from "../assets/ghost_smile.svg";

const MODES = { focus: 25, short: 5, long: 15 };

// ── 뽀모도로 위젯 (유령 버전) ─────────────────────────────
function PomodoroWidget() {
  const { addSession, setLiveSeconds } = useStore();
  const [mode, setMode] = useState("focus");
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 });
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
  const ref = useRef(null);

  const customFocus = durations.focus; // 하위 호환
  const total = durations[mode] * 60;

  const setModeDuration = (val) => {
    if (isNaN(val) || val <= 0) return;
    setDurations(d => ({ ...d, [mode]: val }));
    if (!running) setSeconds(val * 60);
  };

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
              setMode("short"); setSeconds(MODES.short * 60);
            } else {
              setMode("focus"); setSeconds(customFocus * 60);
            }
            return 0;
          }
          // 집중 모드일 때만 실시간 반영
          if (mode === "focus") {
            setLiveSeconds(total - (s - 1));
          }
          return s - 1;
        });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [running, mode, durations]);

  const switchMode = (m) => {
    setMode(m); setRunning(false); setLiveSeconds(0);
    setSeconds(durations[m] * 60);
  };
  const reset = () => {
    setRunning(false);
    setLiveSeconds(0);
    setSeconds(durations[mode] * 60);
  };

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss2 = String(seconds % 60).padStart(2, "0");
  const modeColor = mode === "focus" ? "var(--peach)" : "var(--mint)";

  // float 속도: 집중 중 2s / 정지 3s / 휴식 3.5s
  const floatDuration = running
    ? (mode === "focus" ? "2s" : "3.5s")
    : "3s";

  const pct = Math.max(0, Math.min(1, (total - seconds) / total));
  // 유령 크기 90px, 좌우 패딩 8px 고려해서 이동 범위 계산
  const GHOST_SIZE = 90;
  const SIDE_PAD = 8;

  return (
    <div style={{
      background: "var(--surface)", borderRadius: 12,
      padding: "16px 16px 16px", border: "1px solid var(--border)",
      display: "flex", flexDirection: "column", gap: 0,
    }}>

      {/* 모드 탭 + 분 설정 */}
      <div style={{ display: "flex", gap: 6, justifyContent: "center", alignItems: "center", marginBottom: 28 }}>
        {[["focus","집중"],["short","짧은 휴식"],["long","긴 휴식"]].map(([id, label]) => (
          <button key={id} onClick={() => switchMode(id)} style={{
            padding: "5px 12px", borderRadius: 20, fontSize: 10, cursor: "pointer",
            border: "none", fontFamily: "Galmuri, sans-serif",
            background: mode === id ? modeColor : "var(--sidebar)",
            color: mode === id ? "var(--bg)" : "var(--sub)",
            fontWeight: mode === id ? "bold" : "normal",
            transition: "all 0.15s",
          }}>{label}</button>
        ))}

        {/* 분 설정: 현재 모드 시간 표시/수정 */}
        <div style={{
          display: "flex", alignItems: "center", gap: 4,
          background: "var(--sidebar)", borderRadius: 20,
          padding: "5px 12px", border: "1px solid var(--border)",
        }}>
          <input
            type="text"
            value={durations[mode]}
            onChange={e => setModeDuration(parseInt(e.target.value))}
            style={{
              width: 28, textAlign: "center", fontSize: 11,
              background: "transparent", border: "none", outline: "none",
              color: "var(--text)", fontFamily: "Galmuri, sans-serif",
              padding: 0,
            }}
          />
          <span style={{ fontSize: 10, color: "var(--sub)" }}>분</span>
        </div>
      </div>

      {/* 유령 이동 트랙 영역 */}
      <div style={{ position: "relative", height: GHOST_SIZE + 24, overflow: "visible" }}>
        {/*
          레이어 구조 (transform 충돌 방지):
          1. 위치 div  → left 이동만 (transform 없음)
          2. sway div  → translateX 좌우 흔들
          3. float div → translateY 위아래 둥실
        */}
        {/* 1. 위치: 왼쪽 끝(pct=0) ~ 오른쪽 끝(pct=1), 유령 너비만큼 빼서 끝에 딱 맞춤 */}
        <div style={{
          position: "absolute",
          top: 16,
          left: `calc(${pct} * (100% - ${GHOST_SIZE}px))`,
          transition: "left 1s linear",
          width: GHOST_SIZE,
        }}>
          {/* 2. sway: 좌우 ±2.5px */}
          <div style={{
            animation: `ghostSway ${(parseFloat(floatDuration) * 1.4).toFixed(1)}s ease-in-out infinite`,
          }}>
            {/* 3. float: 위아래 12px */}
            <div style={{
              animation: `ghostFloat ${floatDuration} ease-in-out infinite`,
              filter: "drop-shadow(0 6px 14px rgba(0,0,0,0.3))",
            }}>
              <img src={mode === "focus" ? ghostSvg : ghostSmileSvg} width={GHOST_SIZE} height={GHOST_SIZE} alt="ghost" draggable={false} />
            </div>
          </div>
        </div>
      </div>

      {/* 타이머 숫자 */}
      <div style={{ textAlign: "center", marginTop: 2 }}>
        <div style={{ fontSize: 22, fontWeight: "bold", color: "var(--text)", letterSpacing: 3, lineHeight: 1 }}>
          {mm}:{ss2}
        </div>
      </div>

      {/* 컨트롤 버튼 */}
      <div style={{ display: "flex", gap: 10, alignItems: "center", justifyContent: "center", marginTop: 20 }}>
        <button onClick={reset} style={{
          background: "var(--sidebar)", border: "1px solid var(--border)",
          borderRadius: 10, padding: "6px 12px", fontSize: 12,
          color: "var(--sub)", cursor: "pointer",
        }}>↺</button>
        <button onClick={() => setRunning(r => !r)} style={{
          background: running ? "var(--sub)" : modeColor,
          color: "var(--bg)", border: "none", borderRadius: 10,
          padding: "7px 24px", fontSize: 11, fontWeight: "bold",
          cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          transition: "background 0.15s",
        }}>{running ? "⏸ 멈춤" : "▶ 시작"}</button>
      </div>

      {/* 세션 도트 */}
      {cycle > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, justifyContent: "center", marginTop: 8 }}>
          {Array.from({ length: Math.min(cycle, 8) }).map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: "50%",
              background: "var(--peach)", display: "inline-block" }} />
          ))}
          <span style={{ fontSize: 9, color: "var(--sub)", marginLeft: 2 }}>{cycle}세션 완료</span>
        </div>
      )}
    </div>
  );
}

// ── 홈 메인 ──────────────────────────────────────────────
const COLORS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];

// ── D-Day 위젯 ───────────────────────────────────────────
function DdayWidget() {
  const { ddays } = useStore();
  const now = new Date();

  const sorted = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), now) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff);

  const past = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), now) }))
    .filter(d => d.diff < 0)
    .sort((a, b) => b.diff - a.diff) // 가장 최근 지난 것 먼저
    .slice(0, 2);

  if (ddays.length === 0) return (
    <div style={{ background: "var(--surface)", borderRadius: 12,
      padding: 14, border: "1px solid var(--border)",
      display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <span style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.08em", alignSelf: "flex-start" }}>D-DAY</span>
      <p style={{ fontSize: 11, color: "var(--sub)", margin: "4px 0 0" }}>캘린더 탭에서 D-Day를 추가해보세요</p>
    </div>
  );

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12,
      padding: 14, border: "1px solid var(--border)" }}>
      <span style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase",
        letterSpacing: "0.08em", display: "block", marginBottom: 10 }}>D-DAY</span>

      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {/* 다가오는 D-Day */}
        {sorted.slice(0, 3).map((d, i) => (
          <div key={d.id} style={{
            display: "flex", alignItems: "center", gap: 10,
            padding: "8px 10px", borderRadius: 8,
            background: i === 0 ? "rgba(196,181,245,0.12)" : "transparent",
            border: i === 0 ? "1px solid rgba(196,181,245,0.25)" : "1px solid transparent",
          }}>
            <span style={{
              fontSize: i === 0 ? 16 : 12, fontWeight: "bold",
              color: d.diff === 0 ? "var(--mint)" : "var(--peach)",
              minWidth: 52, flexShrink: 0,
            }}>
              {d.diff === 0 ? "D-Day" : `D-${d.diff}`}
            </span>
            <span style={{ fontSize: 11, color: i === 0 ? "var(--text)" : "var(--sub)", flex: 1 }}>{d.label}</span>
            <span style={{ fontSize: 9, color: "var(--border)", flexShrink: 0 }}>
              {format(parseISO(d.date), "M.d")}
            </span>
          </div>
        ))}

        {/* 지난 D-Day (있을 때만) */}
        {past.length > 0 && (
          <div style={{ borderTop: "1px solid var(--border)", paddingTop: 6, marginTop: 2, display: "flex", gap: 8 }}>
            {past.map(d => (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <span style={{ fontSize: 10, color: "var(--border)" }}>D+{Math.abs(d.diff)}</span>
                <span style={{ fontSize: 10, color: "var(--sub)" }}>{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Home() {
  const { todos, toggleTodo, addTodo } = useStore();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const todayTodos = todos.filter(t => t.date === today);
  const doneCount = todayTodos.filter(t => t.done).length;
  const [quickText, setQuickText] = useState("");

  const handleQuickAdd = () => {
    if (!quickText.trim()) return;
    addTodo(quickText.trim(), today);
    setQuickText("");
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 14,
      display: "flex", flexDirection: "column", gap: 10 }}>

      {/* D-Day */}
      <DdayWidget />

      {/* 오늘 할 일 */}
      <div style={{ background: "var(--surface)", borderRadius: 12,
        padding: 14, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase",
            letterSpacing: "0.08em" }}>오늘 할 일</span>
          <span style={{ fontSize: 9, color: "var(--sub)" }}>{doneCount}/{todayTodos.length}</span>
        </div>

        {/* 빠른 추가 */}
        <input type="text" placeholder="오늘 할 일 추가하기"
          value={quickText} onChange={e => setQuickText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleQuickAdd()}
          style={{ width: "100%", fontSize: 11, padding: "6px 10px",
            marginBottom: todayTodos.length > 0 ? 8 : 0 }}
        />

        {todayTodos.length > 0 && (
          <div style={{ height: 3, background: "var(--sidebar)", borderRadius: 2, marginBottom: 8 }}>
            <div style={{ width: `${(doneCount / todayTodos.length) * 100}%`,
              height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        )}

        {todayTodos.map((t, i) => {
          const color = t.color || COLORS[i % COLORS.length];
          return (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "6px 8px", marginBottom: 3, borderRadius: 8,
              background: t.done ? "transparent" : color + "22",
              border: `1px solid ${t.done ? "var(--border)" : color + "55"}`,
            }}>
              <button onClick={() => toggleTodo(t.id)} style={{
                width: 14, height: 14, borderRadius: 3, flexShrink: 0,
                border: `2px solid ${t.done ? color : "var(--sub)"}`,
                background: t.done ? color : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 8, color: "var(--bg)", padding: 0,
              }}>{t.done ? "✓" : ""}</button>
              <span style={{ fontSize: 11, flex: 1,
                color: t.done ? "var(--sub)" : "var(--text)",
                textDecoration: t.done ? "line-through" : "none",
              }}>{t.text}</span>
            </div>
          );
        })}
      </div>

      {/* 뽀모도로 */}
      <PomodoroWidget />

    </div>
  );
}
