import { useState } from "react";
import { useStore } from "../store";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, parseISO, addMonths, subMonths, differenceInDays
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Trash2, Plus } from "lucide-react";

const COLORS = ["#B8D4F5","#9FE1CB","#F5C4B3","#F4C0D1","#FAC775"];
const card = { background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" };

export default function CalendarDday() {
  const { events, addEvent, deleteEvent, ddays, addDday, deleteDday } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [addingEvent, setAddingEvent] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  // D-Day 입력
  const [ddayLabel, setDdayLabel] = useState("");
  const [ddayDate, setDdayDate] = useState("");

  const monthStart = startOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(current) });
  const startPad = getDay(monthStart);
  const dayEvents = d => events.filter(e => isSameDay(parseISO(e.date), d));
  const selectedEvents = selected ? dayEvents(selected) : [];

  const handleAddEvent = () => {
    if (!newTitle.trim() || !selected) return;
    addEvent(newTitle.trim(), format(selected, "yyyy-MM-dd"), newColor);
    setNewTitle(""); setAddingEvent(false);
  };

  const handleAddDday = () => {
    if (!ddayLabel.trim() || !ddayDate) return;
    addDday(ddayLabel.trim(), ddayDate);
    setDdayLabel(""); setDdayDate("");
  };

  const calcDiff = (dateStr) => {
    const diff = differenceInDays(parseISO(dateStr), new Date());
    if (diff === 0) return { text: "D-Day", color: "var(--pink)" };
    if (diff > 0) return { text: `D-${diff}`, color: "var(--yellow)" };
    return { text: `D+${Math.abs(diff)}`, color: "var(--sub)" };
  };

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 12 }}>

      {/* ── 월 네비 ── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 16, fontWeight: "bold", color: "var(--text)" }}>
          {format(current, "yyyy년 M월", { locale: ko })}
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="btn-ghost" onClick={() => setCurrent(subMonths(current, 1))}
            style={{ padding: "4px 8px" }}><ChevronLeft size={12} /></button>
          <button className="btn-ghost" onClick={() => setCurrent(new Date())}
            style={{ padding: "4px 10px", fontSize: 10 }}>오늘</button>
          <button className="btn-ghost" onClick={() => setCurrent(addMonths(current, 1))}
            style={{ padding: "4px 8px" }}><ChevronRight size={12} /></button>
        </div>
      </div>

      {/* ── 달력 ── */}
      <div style={{ ...card, padding: 14 }}>
        {/* 요일 헤더 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", marginBottom: 6 }}>
          {["일","월","화","수","목","금","토"].map((d, i) => (
            <div key={d} style={{ textAlign: "center", fontSize: 10,
              color: i === 0 ? "#F5C4B3" : i === 6 ? "#B8D4F5" : "var(--sub)",
              padding: "2px 0" }}>{d}</div>
          ))}
        </div>
        {/* 날짜 그리드 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "2px 0" }}>
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
          {days.map(d => {
            const de = dayEvents(d);
            const isToday = isSameDay(d, new Date());
            const isSel = selected && isSameDay(d, selected);
            const dow = d.getDay();
            return (
              <div key={d.toString()} onClick={() => setSelected(isSel ? null : d)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center",
                  gap: 2, padding: "5px 0", borderRadius: 8, cursor: "pointer",
                  background: isSel ? "rgba(184,212,245,0.12)" : "transparent",
                  transition: "background 0.1s",
                }}
                onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
                onMouseLeave={e => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
              >
                <span style={{
                  fontSize: 11, width: 24, height: 24,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  borderRadius: "50%",
                  background: isToday ? "var(--blue)" : "transparent",
                  color: isToday ? "var(--bg)"
                    : dow === 0 ? "var(--peach)"
                    : dow === 6 ? "var(--blue)"
                    : "var(--text)",
                  fontWeight: isToday ? "bold" : "normal",
                }}>{format(d, "d")}</span>
                <div style={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center", minHeight: 5 }}>
                  {de.slice(0, 3).map(e => (
                    <span key={e.id} style={{ width: 4, height: 4, borderRadius: "50%", background: e.color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 선택된 날 일정 ── */}
      {selected && (
        <div style={{ ...card, padding: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, color: "var(--text)" }}>
              {format(selected, "M월 d일 (EEEE)", { locale: ko })}
            </span>
            <button className="btn-primary" onClick={() => setAddingEvent(a => !a)}
              style={{ padding: "3px 10px", fontSize: 10 }}>+ 일정</button>
          </div>

          {addingEvent && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
              <input type="text" placeholder="일정 이름" value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddEvent()}
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
              <button className="btn-primary" onClick={handleAddEvent}
                style={{ fontSize: 10, padding: "4px 10px" }}>저장</button>
            </div>
          )}

          {selectedEvents.length === 0 && !addingEvent
            ? <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>일정이 없어요</p>
            : selectedEvents.map(e => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: e.color, flexShrink: 0 }} />
                <span style={{ flex: 1, fontSize: 11, color: "var(--text)" }}>{e.title}</span>
                <button onClick={() => deleteEvent(e.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--border)", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
                ><Trash2 size={12} /></button>
              </div>
            ))
          }
        </div>
      )}

      {/* ── D-Day 섹션 ── */}
      <div style={{ ...card, padding: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: "bold", color: "var(--text)" }}>D-Day</span>
        </div>

        {/* D-Day 입력 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
          <input type="text" placeholder="이름 (예: 기말고사)" value={ddayLabel}
            onChange={e => setDdayLabel(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAddDday()}
            style={{ flex: 1, minWidth: 100, fontSize: 11 }} />
          <input type="date" value={ddayDate} onChange={e => setDdayDate(e.target.value)}
            style={{ fontSize: 11 }} />
          <button className="btn-primary" onClick={handleAddDday}
            style={{ padding: "4px 10px", fontSize: 10 }}>+ 추가</button>
        </div>

        {/* D-Day 목록 */}
        {ddays.length === 0
          ? <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>중요한 날을 등록해보세요 📆</p>
          : ddays.map(d => {
            const { text, color } = calcDiff(d.date);
            return (
              <div key={d.id} style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 0", borderBottom: "1px solid var(--border)",
              }}>
                <span style={{ fontSize: 16, fontWeight: "bold", color, flexShrink: 0, minWidth: 52 }}>{text}</span>
                <span style={{ flex: 1, fontSize: 11, color: "var(--text)" }}>{d.label}</span>
                <span style={{ fontSize: 10, color: "var(--sub)", flexShrink: 0 }}>
                  {format(parseISO(d.date), "yy.MM.dd")}
                </span>
                <button onClick={() => deleteDday(d.id)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "var(--border)", padding: 2 }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
                ><Trash2 size={12} /></button>
              </div>
            );
          })
        }
      </div>
    </div>
  );
}
