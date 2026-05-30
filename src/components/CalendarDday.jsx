import { useState } from "react";
import { useStore } from "../store";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, parseISO, addMonths, subMonths,
  differenceInDays, isToday, addDays
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

const COLORS = ["#B8D4F5","#9FE1CB","#F5C4B3","#F4C0D1","#FAC775"];

export default function CalendarDday() {
  const { events, addEvent, deleteEvent, ddays, addDday, deleteDday, todos } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventColor, setNewEventColor] = useState(COLORS[0]);
  const [addingEvent, setAddingEvent] = useState(false);

  // D-Day 입력
  const [ddayLabel, setDdayLabel] = useState("");
  const [ddayDate, setDdayDate] = useState("");

  const monthStart = startOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(current) });
  const startPad = getDay(monthStart);

  const dayEvents = d => events.filter(e => isSameDay(parseISO(e.date), d));
  const dayTodos = d => todos.filter(t => t.date === format(d, "yyyy-MM-dd"));

  const selEvents = selected ? dayEvents(selected) : [];
  const selTodos = selected ? dayTodos(selected) : [];

  const calcDiff = dateStr => {
    const diff = differenceInDays(parseISO(dateStr), new Date());
    if (diff === 0) return { text: "D-Day", color: "var(--pink)" };
    if (diff > 0) return { text: `D-${diff}`, color: "var(--yellow)" };
    return { text: `D+${Math.abs(diff)}`, color: "var(--sub)" };
  };

  const handleAddEvent = () => {
    if (!newEventTitle.trim() || !selected) return;
    addEvent(newEventTitle.trim(), format(selected, "yyyy-MM-dd"), newEventColor);
    setNewEventTitle(""); setAddingEvent(false);
  };

  const handleAddDday = () => {
    if (!ddayLabel.trim() || !ddayDate) return;
    addDday(ddayLabel.trim(), ddayDate);
    setDdayLabel(""); setDdayDate("");
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* ── 월 네비 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 18px 10px", flexShrink: 0 }}>
        <span style={{ fontSize: 15, fontWeight: "bold", color: "var(--text)" }}>
          {format(current, "yyyy년 M월", { locale: ko })}
        </span>
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          <button onClick={() => setCurrent(subMonths(current, 1))} style={{
            background: "var(--sidebar)", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--sub)", cursor: "pointer", width: 24, height: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><ChevronLeft size={12}/></button>
          <button onClick={() => { setCurrent(new Date()); setSelected(new Date()); }} style={{
            background: "var(--sidebar)", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--sub)", cursor: "pointer", padding: "3px 8px", fontSize: 10,
            fontFamily: "Galmuri, sans-serif",
          }}>오늘</button>
          <button onClick={() => setCurrent(addMonths(current, 1))} style={{
            background: "var(--sidebar)", border: "1px solid var(--border)", borderRadius: 6,
            color: "var(--sub)", cursor: "pointer", width: 24, height: 24,
            display: "flex", alignItems: "center", justifyContent: "center",
          }}><ChevronRight size={12}/></button>
        </div>
      </div>

      {/* ── 달력 ── */}
      <div style={{ padding: "0 16px", flexShrink: 0 }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 11, padding: "4px 0",
              color: i === 0 ? "var(--peach)" : i === 6 ? "var(--blue)" : "var(--sub)" }}>{d}</div>
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)" }}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
          {days.map(d => {
            const de = dayEvents(d);
            const dt = dayTodos(d);
            const isSel = selected && isSameDay(d, selected);
            const tod = isToday(d);
            const dow = d.getDay();
            return (
              <div key={d.toString()} onClick={() => setSelected(d)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  padding: "5px 2px", borderRadius: 8, cursor: "pointer",
                  background: isSel ? "rgba(184,212,245,0.15)" : "transparent",
                  transition: "background 0.1s",
                }}
              >
                <span style={{
                  fontSize: 13, width: 30, height: 30,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  background: tod ? "var(--blue)" : "transparent",
                  color: tod ? "var(--bg)"
                    : dow === 0 ? "var(--peach)"
                    : dow === 6 ? "var(--blue)"
                    : "var(--text)",
                  fontWeight: tod ? "bold" : "normal",
                }}>{format(d, "d")}</span>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", minHeight: 7, marginTop: 3 }}>
                  {de.slice(0, 2).map(e => (
                    <span key={e.id} style={{ width: 4, height: 4, borderRadius: "50%", background: e.color }} />
                  ))}
                  {dt.slice(0, 2).map(t => (
                    <span key={t.id} style={{ width: 4, height: 4, borderRadius: "50%", background: t.color || "var(--sub)", opacity: 0.6 }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 선택된 날 상세 ── */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 18px" }}>
        {selected && (
          <>
            {/* 날짜 헤더 */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
              marginBottom: 8, paddingBottom: 6, borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontSize: 12, fontWeight: "bold", color: "var(--text)" }}>
                {format(selected, "M월 d일 (EEEE)", { locale: ko })}
              </span>
              <button onClick={() => setAddingEvent(a => !a)} style={{
                background: "none", border: "none", cursor: "pointer",
                color: "var(--sub)", fontSize: 18, lineHeight: 1, padding: "0 2px",
              }}>+</button>
            </div>

            {/* 일정 추가 인풋 */}
            {addingEvent && (
              <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap" }}>
                <input type="text" placeholder="일정 이름" value={newEventTitle}
                  onChange={e => setNewEventTitle(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAddEvent()}
                  style={{ flex: 1, fontSize: 11 }} autoFocus />
                <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={() => setNewEventColor(c)} style={{
                      width: 14, height: 14, borderRadius: "50%", background: c, border: "none",
                      outline: newEventColor === c ? `2px solid var(--text)` : "none",
                      cursor: "pointer", padding: 0,
                    }} />
                  ))}
                </div>
                <button onClick={handleAddEvent} style={{
                  background: "var(--sidebar)", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 10,
                  color: "var(--text)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
                }}>저장</button>
                <button onClick={() => setAddingEvent(false)} style={{
                  background: "none", border: "1px solid var(--border)",
                  borderRadius: 6, padding: "4px 10px", fontSize: 10,
                  color: "var(--sub)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
                }}>취소</button>
              </div>
            )}

            {/* 일정 목록 */}
            {selEvents.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", marginBottom: 3, borderRadius: 8,
                borderLeft: `3px solid ${e.color}`, background: e.color + "15" }}>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text)" }}>{e.title}</span>
                <button onClick={() => deleteEvent(e.id)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "transparent", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                  onMouseLeave={e => e.currentTarget.style.color = "transparent"}
                ><Trash2 size={12}/></button>
              </div>
            ))}

            {/* 할일 목록 */}
            {selTodos.map(t => (
              <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", marginBottom: 3, borderRadius: 8,
                borderLeft: `3px solid ${t.color || "var(--sub)"}`,
                background: (t.color || "#888") + "15",
                opacity: t.done ? 0.5 : 1 }}>
                <span style={{ fontSize: 10, flexShrink: 0 }}>{t.done ? "✓" : "○"}</span>
                <span style={{ flex: 1, fontSize: 12, color: "var(--text)",
                  textDecoration: t.done ? "line-through" : "none" }}>{t.text}</span>
              </div>
            ))}

            {selEvents.length === 0 && selTodos.length === 0 && !addingEvent && (
              <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>일정이 없어요</p>
            )}
          </>
        )}

        {/* ── D-Day ── */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
          <span style={{ fontSize: 12, fontWeight: "bold", color: "var(--text)",
            display: "block", marginBottom: 12 }}>
            D-Day
          </span>

          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 8 }}>
            <input type="text" placeholder="이름 (예: 기말고사)" value={ddayLabel}
              onChange={e => setDdayLabel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAddDday()}
              style={{ width: "100%", fontSize: 11 }} />
            <div style={{ display: "flex", gap: 6 }}>
              <input type="date" value={ddayDate} onChange={e => setDdayDate(e.target.value)}
                style={{ flex: 1, fontSize: 11 }} />
              <button onClick={handleAddDday} style={{
                background: "var(--sidebar)", border: "1px solid var(--border)",
                borderRadius: 8, padding: "0 14px", fontSize: 18, fontWeight: 300,
                color: "var(--sub)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ display: "block", marginTop: "-1px" }}>+</span>
              </button>
            </div>
          </div>

          {ddays.map(d => {
            const { text, color } = calcDiff(d.date);
            return (
              <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 8,
                padding: "6px 8px", marginBottom: 3, borderRadius: 8, background: "var(--surface)",
                border: "1px solid var(--border)" }}>
                <span style={{ fontSize: 13, fontWeight: "bold", color, flexShrink: 0, minWidth: 46 }}>{text}</span>
                <span style={{ flex: 1, fontSize: 11, color: "var(--text)" }}>{d.label}</span>
                <span style={{ fontSize: 9, color: "var(--sub)", flexShrink: 0 }}>
                  {format(parseISO(d.date), "yy.MM.dd")}
                </span>
                <button onClick={() => deleteDday(d.id)} style={{
                  background: "none", border: "none", cursor: "pointer", color: "transparent", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                  onMouseLeave={e => e.currentTarget.style.color = "transparent"}
                ><Trash2 size={12}/></button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
