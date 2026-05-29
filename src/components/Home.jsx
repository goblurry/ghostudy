import { useStore } from "../store";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const GREET = ["일요일 ☀️", "월요일 💪", "화요일 ✨", "수요일 🌿", "목요일 🎯", "금요일 🎉", "토요일 🌸"];

const S = {
  wrap: { height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" },
  card: { background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" },
  label: { fontSize: 9, color: "var(--sub)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 },
};

export default function Home() {
  const { todos, toggleTodo, ddays } = useStore();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const todayTodos = todos.filter(t => t.date === today);
  const doneCount = todayTodos.filter(t => t.done).length;

  const upcomingDdays = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), now) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  return (
    <div style={S.wrap}>
      {/* 날짜 카드 */}
      <div style={{ ...S.card, background: "linear-gradient(135deg, #1C2235 0%, #1e2a40 100%)" }}>
        <div style={{ fontSize: 10, color: "var(--sub)", marginBottom: 2 }}>
          {format(now, "yyyy년 M월", { locale: ko })}
        </div>
        <div style={{ fontSize: 36, fontWeight: "bold", color: "var(--text)", lineHeight: 1 }}>
          {format(now, "d일")}
        </div>
        <div style={{ fontSize: 11, color: "var(--blue)", marginTop: 4 }}>
          {GREET[now.getDay()]}
        </div>
      </div>

      {/* 오늘 할 일 */}
      <div style={S.card}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
          <span style={S.label}>오늘 할 일</span>
          <span style={{ fontSize: 10, color: "var(--sub)" }}>{doneCount}/{todayTodos.length}</span>
        </div>
        {todayTodos.length > 0 && (
          <div style={{ height: 4, background: "var(--sidebar)", borderRadius: 2, marginBottom: 10 }}>
            <div style={{
              width: `${(doneCount / todayTodos.length) * 100}%`,
              height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s",
            }} />
          </div>
        )}
        {todayTodos.length === 0
          ? <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>오늘 할 일이 없어요 ✨</p>
          : todayTodos.map(t => (
            <button key={t.id} onClick={() => toggleTodo(t.id)} style={{
              display: "flex", alignItems: "center", gap: 8, width: "100%",
              background: "none", border: "none", cursor: "pointer", padding: "4px 0", textAlign: "left",
            }}>
              <span style={{
                width: 14, height: 14, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${t.done ? "var(--mint)" : "var(--border)"}`,
                background: t.done ? "var(--mint)" : "transparent",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 8, color: "var(--bg)",
              }}>{t.done ? "✓" : ""}</span>
              <span style={{
                fontSize: 11, color: t.done ? "var(--sub)" : "var(--text)",
                textDecoration: t.done ? "line-through" : "none",
              }}>{t.text}</span>
            </button>
          ))
        }
      </div>

      {/* D-Day */}
      {upcomingDdays.length > 0 && (
        <div style={S.card}>
          <div style={S.label}>D-Day</div>
          {upcomingDdays.map(d => (
            <div key={d.id} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
              <span style={{ fontSize: 11, color: "var(--text)" }}>{d.label}</span>
              <span style={{ fontSize: 11, fontWeight: "bold", color: d.diff === 0 ? "var(--pink)" : "var(--yellow)" }}>
                {d.diff === 0 ? "D-Day" : `D-${d.diff}`}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
