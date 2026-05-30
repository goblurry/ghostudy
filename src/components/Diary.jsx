import { useState } from "react";
import { useStore } from "../store";
import { format, subDays } from "date-fns";

const MOODS = [
  { emoji: "😄", label: "최고" }, { emoji: "🙂", label: "좋음" },
  { emoji: "😐", label: "보통" }, { emoji: "😕", label: "별로" },
  { emoji: "😢", label: "힘듦" },
];

const card = { background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" };

export default function Diary() {
  const { diary, saveDiary, getDiary } = useStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const existing = getDiary(today);
  const [text, setText] = useState(existing?.text || "");
  const [mood, setMood] = useState(existing?.mood || null);
  const [saved, setSaved] = useState(!!existing);

  const handleSave = () => { saveDiary(today, text, mood); setSaved(true); };

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    return { date: d, entry: diary.find(e => e.date === d) };
  });

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" }}>
      {/* 오늘 입력 */}
      <div style={card}>
        {/* 기분 */}
        <p style={{ fontSize: 14, fontWeight: "bold", color: "var(--text)", margin: "0 0 14px", textAlign: "center" }}>
          오늘 기분은?
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 14, justifyContent: "center" }}>
          {MOODS.map(m => (
            <button key={m.emoji} onClick={() => { setMood(m.emoji); setSaved(false); }} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "6px 8px", borderRadius: 10, cursor: "pointer",
              border: mood === m.emoji ? "1px solid var(--pink)" : "1px solid transparent",
              background: mood === m.emoji ? "rgba(244,192,209,0.15)" : "transparent",
              transform: mood === m.emoji ? "scale(1.1)" : "scale(1)",
              transition: "all 0.15s",
            }}>
              <span style={{ fontSize: 20 }}>{m.emoji}</span>
              <span style={{ fontSize: 8, color: "var(--sub)" }}>{m.label}</span>
            </button>
          ))}
        </div>

        <textarea value={text} onChange={e => { setText(e.target.value); setSaved(false); }}
          placeholder="오늘 하루 어땠어요? ✏️"
          style={{ width: "100%", height: 100, fontSize: 11, lineHeight: 1.7,
            border: "1px solid var(--border)", borderRadius: 8, padding: 10,
            background: "var(--sidebar)", color: "var(--text)" }}
        />

        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, marginTop: 12 }}>
          <button onClick={handleSave} style={{
            background: "var(--sidebar)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "5px 20px", fontSize: 11,
            color: "var(--sub)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          }}>저장</button>
          {saved && <span style={{ fontSize: 10, color: "var(--mint)" }}>✓ 저장됐어요</span>}
        </div>
      </div>

      {/* 7일 무드 트래커 */}
      <div style={card}>
        <p style={{ fontSize: 10, color: "var(--sub)", margin: "0 0 10px" }}>최근 7일</p>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {last7.map(({ date, entry }) => (
            <div key={date} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 18 }}>{entry?.mood || "·"}</span>
              <span style={{ fontSize: 9, color: "var(--sub)" }}>{format(new Date(date + "T12:00"), "d")}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 지난 기록 */}
      <div style={card}>
        <p style={{ fontSize: 10, color: "var(--sub)", margin: "0 0 10px" }}>지난 기록</p>
        {[...diary].reverse().slice(0, 10).map(entry => (
          <div key={entry.date} style={{
            display: "flex", gap: 10, padding: "8px 0",
            borderBottom: "1px solid var(--border)",
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{entry.mood || "📝"}</span>
            <div>
              <p style={{ fontSize: 9, color: "var(--sub)", margin: "0 0 2px" }}>{entry.date}</p>
              <p style={{ fontSize: 11, color: "var(--text)", margin: 0 }}>{entry.text || "(내용 없음)"}</p>
            </div>
          </div>
        ))}
        {diary.length === 0 && <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>아직 기록이 없어요</p>}
      </div>
    </div>
  );
}
