import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");

const S = {
  wrap: { height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" },
  card: { background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" },
  dateLabel: { fontSize: 9, color: "var(--sub)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" },
};

export default function Todo() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore();
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), date);
    setText("");
  };

  const byDate = todos.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});
  const sortedDates = Object.keys(byDate).sort().reverse();
  const todayTodos = todos.filter(t => t.date === today());
  const doneCount = todayTodos.filter(t => t.done).length;

  return (
    <div style={S.wrap}>
      {/* 진행률 */}
      {todayTodos.length > 0 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ flex: 1, height: 4, background: "var(--sidebar)", borderRadius: 2 }}>
            <div style={{
              width: `${(doneCount / todayTodos.length) * 100}%`,
              height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s",
            }} />
          </div>
          <span style={{ fontSize: 10, color: "var(--sub)", flexShrink: 0 }}>
            {doneCount}/{todayTodos.length}
          </span>
        </div>
      )}

      {/* 입력 */}
      <div style={{ ...S.card, display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="text" style={{ flex: 1, minWidth: 120 }}
          placeholder="할 일 추가..."
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 130 }} />
        <button className="btn-primary" onClick={handleAdd}>+ 추가</button>
      </div>

      {/* 목록 */}
      {sortedDates.map(d => (
        <div key={d} style={S.card}>
          <div style={S.dateLabel}>{d === today() ? "📅 오늘" : d}</div>
          {byDate[d].map(t => (
            <div key={t.id} style={{
              display: "flex", alignItems: "center", gap: 8, padding: "5px 0",
              borderBottom: "1px solid var(--border)",
            }}
            className="group">
              <button onClick={() => toggleTodo(t.id)} style={{
                width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                border: `2px solid ${t.done ? "var(--mint)" : "var(--border)"}`,
                background: t.done ? "var(--mint)" : "transparent",
                cursor: "pointer", display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 9, color: "var(--bg)",
              }}>{t.done ? "✓" : ""}</button>
              <span style={{
                flex: 1, fontSize: 11,
                color: t.done ? "var(--sub)" : "var(--text)",
                textDecoration: t.done ? "line-through" : "none",
              }}>{t.text}</span>
              <button onClick={() => deleteTodo(t.id)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--border)", padding: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
              ><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      ))}

      {todos.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--sub)", fontSize: 12 }}>
          할 일을 추가해보세요 ✏️
        </div>
      )}
    </div>
  );
}
