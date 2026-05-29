import { useState } from "react";
import { useStore } from "../store";
import { differenceInDays, parseISO, format } from "date-fns";
import { Trash2 } from "lucide-react";

export default function Dday() {
  const { ddays, addDday, deleteDday } = useStore();
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = () => {
    if (!label.trim() || !date) return;
    addDday(label.trim(), date); setLabel(""); setDate("");
  };

  const calc = (dateStr) => {
    const diff = differenceInDays(parseISO(dateStr), new Date());
    if (diff === 0) return { text: "D-Day", color: "var(--pink)" };
    if (diff > 0) return { text: `D-${diff}`, color: "var(--yellow)" };
    return { text: `D+${Math.abs(diff)}`, color: "var(--sub)" };
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" }}>
      <div style={{ background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)", display: "flex", gap: 8, flexWrap: "wrap" }}>
        <input type="text" placeholder="이름 (예: 기말고사)" value={label}
          onChange={e => setLabel(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAdd()}
          style={{ flex: 1, minWidth: 100 }} />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: 130 }} />
        <button className="btn-primary" onClick={handleAdd}>+ 추가</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {ddays.map(d => {
          const { text, color } = calc(d.date);
          return (
            <div key={d.id} style={{
              background: "var(--surface)", borderRadius: 12, padding: 16,
              border: "1px solid var(--border)", position: "relative",
              display: "flex", flexDirection: "column", alignItems: "center", gap: 6,
            }}>
              <button onClick={() => deleteDday(d.id)} style={{
                position: "absolute", top: 8, right: 8, background: "none",
                border: "none", cursor: "pointer", color: "var(--border)", padding: 2,
              }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
              ><Trash2 size={12} /></button>
              <span style={{ fontSize: 28, fontWeight: "bold", color }}>{text}</span>
              <span style={{ fontSize: 11, color: "var(--text)", textAlign: "center" }}>{d.label}</span>
              <span style={{ fontSize: 10, color: "var(--sub)" }}>
                📅 {format(parseISO(d.date), "yyyy.MM.dd")}
              </span>
            </div>
          );
        })}
      </div>

      {ddays.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--sub)", fontSize: 12 }}>중요한 날을 등록해보세요 📆</div>
      )}
    </div>
  );
}
