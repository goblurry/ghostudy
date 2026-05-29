import { useState } from "react";
import { useStore } from "../store";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay,
  isSameDay, parseISO, addMonths, subMonths } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const COLORS = ["#B8D4F5","#9FE1CB","#F5C4B3","#F4C0D1","#FAC775"];
const card = { background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" };

export default function CalendarView() {
  const { events, addEvent, deleteEvent } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const monthStart = startOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(current) });
  const startPad = getDay(monthStart);
  const dayEvents = d => events.filter(e => isSameDay(parseISO(e.date), d));
  const selectedEvents = selected ? dayEvents(selected) : [];

  const handleAdd = () => {
    if (!newTitle.trim() || !selected) return;
    addEvent(newTitle.trim(), format(selected, "yyyy-MM-dd"), newColor);
    setNewTitle(""); setAdding(false);
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" }}>
      {/* 월 네비 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: "bold", color: "var(--text)" }}>
          {format(current, "yyyy년 M월", { locale: ko })}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn-ghost" onClick={() => setCurrent(subMonths(current, 1))}
            style={{ padding: "4px 8px" }}><ChevronLeft size={12} /></button>
          <button className="btn-ghost" onClick={() => setCurrent(new Date())}
            style={{ padding: "4px 8px", fontSize: 10 }}>오늘</button>
          <button className="btn-ghost" onClick={() => setCurrent(addMonths(current, 1))}
            style={{ padding: "4px 8px" }}><ChevronRight size={12} /></button>
        </div>
      </div>

      {/* 달력 */}
      <div style={card}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 8 }}>
          {["일","월","화","수","목","금","토"].map(d => (
            <div key={d} style={{ textAlign: "center", fontSize: 9, color: "var(--sub)", padding: "2px 0" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
          {days.map(d => {
            const de = dayEvents(d);
            const isToday = isSameDay(d, new Date());
            const isSel = selected && isSameDay(d, selected);
            return (
              <div key={d.toString()} onClick={() => setSelected(isSel ? null : d)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 2, padding: "4px 0", borderRadius: 6, cursor: "pointer",
                  background: isSel ? "rgba(184,212,245,0.15)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "var(--sidebar)"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontSize: 10, width: 20, height: 20, display: "flex",
                  alignItems: "center", justifyContent: "center", borderRadius: "50%",
                  background: isToday ? "var(--blue)" : "transparent",
                  color: isToday ? "var(--bg)" : "var(--text)",
                  fontWeight: isToday ? "bold" : "normal",
                }}>{format(d, "d")}</span>
                <div style={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "center" }}>
                  {de.slice(0, 3).map(e => (
                    <span key={e.id} style={{ width: 5, height: 5, borderRadius: "50%", background: e.color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 선택된 날 이벤트 */}
      {selected && (
        <div style={card}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <span style={{ fontSize: 11, color: "var(--text)" }}>
              {format(selected, "M월 d일 (EEEE)", { locale: ko })}
            </span>
            <button className="btn-primary" onClick={() => setAdding(a => !a)}
              style={{ padding: "3px 10px", fontSize: 10 }}>+ 일정</button>
          </div>

          {adding && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
              <input type="text" placeholder="일정 이름" value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAdd()}
                style={{ flex: 1, fontSize: 11 }} autoFocus />
              <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setNewColor(c)} style={{
                    width: 14, height: 14, borderRadius: "50%", background: c,
                    border: newColor === c ? "2px solid var(--text)" : "none",
                    cursor: "pointer", padding: 0,
                  }} />
                ))}
              </div>
              <button className="btn-primary" onClick={handleAdd} style={{ fontSize: 10, padding: "4px 10px" }}>저장</button>
              <button className="btn-ghost" onClick={() => setAdding(false)} style={{ fontSize: 10, padding: "4px 10px" }}>취소</button>
            </div>
          )}

          {selectedEvents.length === 0 && !adding && (
            <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>일정이 없어요</p>
          )}
          {selectedEvents.map(e => (
            <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
              <span style={{ flex: 1, fontSize: 11, color: "var(--text)" }}>{e.title}</span>
              <button onClick={() => deleteEvent(e.id)} style={{
                background: "none", border: "none", cursor: "pointer", color: "var(--border)",
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
              ><Trash2 size={12} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
