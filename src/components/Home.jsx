import { useState, useEffect, useRef } from "react";
import { useStore } from "../store";
import { format, differenceInDays, parseISO,
  startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { ko } from "date-fns/locale";

const GREET = ["일요일 ☀️","월요일 💪","화요일 ✨","수요일 🌿","목요일 🎯","금요일 🎉","토요일 🌸"];

const MODES = { focus: 25, short: 5, long: 15 };

// ── 뽀모도로 위젯 ─────────────────────────────────────────
function PomodoroWidget() {
  const { addSession } = useStore();
  const [mode, setMode] = useState("focus");
  const [customFocus, setCustomFocus] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [running, setRunning] = useState(false);
  const [cycle, setCycle] = useState(0);
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
              setMode("short"); setSeconds(MODES.short * 60);
            } else {
              setMode("focus"); setSeconds(customFocus * 60);
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
  const pct = (total - seconds) / total;
  const r = 44, circ = 2 * Math.PI * r;
  const modeColor = mode === "focus" ? "var(--peach)" : "var(--mint)";

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12,
      padding: 14, border: "1px solid var(--border)",
      display: "flex", alignItems: "center", gap: 16 }}>

      {/* 링 타이머 */}
      <div style={{ position: "relative", flexShrink: 0 }}>
        <svg width={100} height={100} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={50} cy={50} r={r} fill="none" stroke="var(--sidebar)" strokeWidth={6} />
          <circle cx={50} cy={50} r={r} fill="none"
            stroke={modeColor} strokeWidth={6} strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s linear" }}
          />
        </svg>
        <div style={{ position: "absolute", inset: 0,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18, fontWeight: "bold", color: "var(--text)" }}>{mm}:{ss}</span>
          <span style={{ fontSize: 8, color: "var(--sub)", marginTop: 1 }}>
            {mode === "focus" ? "집중" : "휴식"}
          </span>
        </div>
      </div>

      {/* 오른쪽 컨트롤 */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* 모드 탭 */}
        <div style={{ display: "flex", gap: 4 }}>
          {[["focus","집중"],["short","짧은휴식"],["long","긴휴식"]].map(([id, label]) => (
            <button key={id} onClick={() => switchMode(id)} style={{
              padding: "3px 8px", borderRadius: 20, fontSize: 9, cursor: "pointer",
              border: "none", fontFamily: "Galmuri, sans-serif",
              background: mode === id ? modeColor : "var(--sidebar)",
              color: mode === id ? "var(--bg)" : "var(--sub)",
              fontWeight: mode === id ? "bold" : "normal",
            }}>{label}</button>
          ))}
        </div>

        {/* 버튼 + 집중시간 설정 */}
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <button onClick={() => setRunning(r => !r)} style={{
            background: running ? "var(--sub)" : modeColor,
            color: "var(--bg)", border: "none", borderRadius: 7,
            padding: "5px 14px", fontSize: 11, fontWeight: "bold",
            cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          }}>{running ? "⏸ 멈춤" : "▶ 시작"}</button>
          <button onClick={reset} style={{
            background: "var(--sidebar)", border: "1px solid var(--border)",
            borderRadius: 7, padding: "4px 8px", fontSize: 11,
            color: "var(--sub)", cursor: "pointer",
          }}>↺</button>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: "auto" }}>
            <span style={{ fontSize: 9, color: "var(--sub)" }}>집중</span>
            <input type="text" value={customFocus}
              onChange={e => { const v = parseInt(e.target.value); if (!isNaN(v) && v > 0) { setCustomFocus(v); if (mode === "focus" && !running) setSeconds(v * 60); }}}
              style={{ width: 32, textAlign: "center", fontSize: 10, padding: "2px 4px" }}
            />
            <span style={{ fontSize: 9, color: "var(--sub)" }}>분</span>
          </div>
        </div>

        {/* 세션 도트 */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          {Array.from({ length: Math.min(cycle, 8) }).map((_, i) => (
            <span key={i} style={{ width: 7, height: 7, borderRadius: "50%",
              background: "var(--peach)", display: "inline-block" }} />
          ))}
          <span style={{ fontSize: 9, color: "var(--sub)", marginLeft: 2 }}>
            {cycle === 0 ? "오늘 세션 없음" : `${cycle}세션 완료`}
          </span>
        </div>
      </div>
    </div>
  );
}

function embedSrc({ type, id }) {
  return type === "playlist"
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${id}&autoplay=1&rel=0`
    : `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
}

// ── 미니 주간 캘린더 ──────────────────────────────────────
function MiniWeekCalendar() {
  const { events } = useStore();
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  return (
    <div style={{ background: "var(--surface)", borderRadius: 12,
      padding: 14, border: "1px solid var(--border)" }}>
      <p style={{ fontSize: 9, color: "var(--sub)", margin: "0 0 10px",
        textTransform: "uppercase", letterSpacing: "0.08em" }}>이번 주</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 }}>
        {["일","월","화","수","목","금","토"].map(d => (
          <div key={d} style={{ textAlign: "center", fontSize: 8,
            color: "var(--sub)", marginBottom: 4 }}>{d}</div>
        ))}
        {days.map(d => {
          const isToday = isSameDay(d, now);
          const dayEvts = events.filter(e => isSameDay(parseISO(e.date), d));
          return (
            <div key={d.toString()} style={{ display: "flex", flexDirection: "column",
              alignItems: "center", gap: 3 }}>
              <span style={{
                width: 22, height: 22, borderRadius: "50%", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: 10,
                background: isToday ? "var(--blue)" : "transparent",
                color: isToday ? "var(--bg)" : isSameMonth(d, now) ? "var(--text)" : "var(--border)",
                fontWeight: isToday ? "bold" : "normal",
              }}>{format(d, "d")}</span>
              <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center",
                minHeight: 6 }}>
                {dayEvts.slice(0, 2).map(e => (
                  <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%",
                    background: e.color }} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
      {/* 이번 주 일정 */}
      {events.filter(e => {
        const d = parseISO(e.date);
        return d >= weekStart && d <= weekEnd;
      }).slice(0, 3).map(e => (
        <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 6,
          marginTop: 6, padding: "3px 0", borderTop: "1px solid var(--border)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%",
            background: e.color, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: "var(--sub)", flexShrink: 0 }}>
            {format(parseISO(e.date), "d일")}
          </span>
          <span style={{ fontSize: 10, color: "var(--text)",
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.title}</span>
        </div>
      ))}
    </div>
  );
}

// ── 홈 메인 ──────────────────────────────────────────────
export default function Home() {
  const { todos, toggleTodo, ddays, ytItem, nowPlaying } = useStore();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const todayTodos = todos.filter(t => t.date === today);
  const doneCount = todayTodos.filter(t => t.done).length;

  const upcomingDdays = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), now) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 2);

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 14,
      display: "flex", flexDirection: "column", gap: 10 }}>

      {/* 날짜 + D-Day */}
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1, background: "var(--surface)", borderRadius: 12,
          padding: 14, border: "1px solid var(--border)" }}>
          <div style={{ fontSize: 9, color: "var(--sub)", marginBottom: 2 }}>
            {format(now, "yyyy년 M월", { locale: ko })}
          </div>
          <div style={{ fontSize: 30, fontWeight: "bold", color: "var(--text)", lineHeight: 1 }}>
            {format(now, "d일")}
          </div>
          <div style={{ fontSize: 10, color: "var(--blue)", marginTop: 4 }}>
            {GREET[now.getDay()]}
          </div>
        </div>
        {upcomingDdays.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6, justifyContent: "center" }}>
            {upcomingDdays.map(d => (
              <div key={d.id} style={{ background: "var(--surface)", borderRadius: 10,
                padding: "8px 12px", border: "1px solid var(--border)",
                display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 9, color: "var(--sub)" }}>{d.label}</span>
                <span style={{ fontSize: 16, fontWeight: "bold",
                  color: d.diff === 0 ? "var(--pink)" : "var(--yellow)" }}>
                  {d.diff === 0 ? "D-Day" : `D-${d.diff}`}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 오늘 할 일 */}
      <div style={{ background: "var(--surface)", borderRadius: 12,
        padding: 14, border: "1px solid var(--border)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
          <span style={{ fontSize: 9, color: "var(--sub)", textTransform: "uppercase",
            letterSpacing: "0.08em" }}>오늘 할 일</span>
          <span style={{ fontSize: 9, color: "var(--sub)" }}>{doneCount}/{todayTodos.length}</span>
        </div>
        {todayTodos.length > 0 && (
          <div style={{ height: 3, background: "var(--sidebar)", borderRadius: 2, marginBottom: 10 }}>
            <div style={{ width: `${(doneCount / todayTodos.length) * 100}%`,
              height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s" }} />
          </div>
        )}
        {todayTodos.length === 0
          ? <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>오늘 할 일이 없어요 ✨</p>
          : todayTodos.map(t => (
            <button key={t.id} onClick={() => toggleTodo(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: "none", border: "none", cursor: "pointer",
              padding: "4px 0", textAlign: "left",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${t.done ? "var(--mint)" : "var(--border)"}`,
                background: t.done ? "var(--mint)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "var(--bg)",
              }}>{t.done ? "✓" : ""}</span>
              <span style={{ fontSize: 11,
                color: t.done ? "var(--sub)" : "var(--text)",
                textDecoration: t.done ? "line-through" : "none",
              }}>{t.text}</span>
            </button>
          ))
        }
      </div>

      {/* 뽀모도로 */}
      <PomodoroWidget />

      {/* 미니 주간 캘린더 */}
      <MiniWeekCalendar />

      {/* 음악 플레이어 (재생 중일 때만) */}
      {ytItem && (
        <div style={{ background: "var(--surface)", borderRadius: 12,
          border: "1px solid var(--border)", overflow: "hidden" }}>
          <div style={{ padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 9, color: "var(--blue)" }}>▶ 재생 중</span>
            <span style={{ fontSize: 10, color: "var(--text)", flex: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {ytItem.title}
            </span>
          </div>
          <div style={{ background: "#000", aspectRatio: "16/9", width: "100%" }}>
            <iframe
              key={ytItem.id}
              src={embedSrc(ytItem)}
              style={{ width: "100%", height: "100%", display: "block" }}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              frameBorder="0"
            />
          </div>
        </div>
      )}

    </div>
  );
}
