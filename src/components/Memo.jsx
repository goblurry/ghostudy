import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ArrowLeft } from "lucide-react";

export default function Memo() {
  const { memos, addMemo, updateMemo, deleteMemo } = useStore();
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const openMemo = (m) => { setSelected(m.id); setTitle(m.title); setBody(m.body); };
  const handleNew = () => {
    addMemo("제목 없음", "");
    const id = Date.now();
    setSelected(id); setTitle("제목 없음"); setBody("");
  };
  const handleChange = (t, b) => {
    if (t !== undefined) setTitle(t);
    if (b !== undefined) setBody(b);
    updateMemo(selected, t ?? title, b ?? body);
  };

  if (selected !== null) {
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 16, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setSelected(null)} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--sub)", padding: 4,
          }}><ArrowLeft size={16} /></button>
          <input type="text" value={title}
            onChange={e => handleChange(e.target.value, undefined)}
            style={{ flex: 1, fontSize: 14, fontWeight: "bold",
              background: "transparent", border: "none", outline: "none", color: "var(--text)" }}
          />
          <button onClick={() => { deleteMemo(selected); setSelected(null); }}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sub)" }}
            onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
            onMouseLeave={e => e.currentTarget.style.color = "var(--sub)"}
          ><Trash2 size={14} /></button>
        </div>
        <textarea value={body}
          onChange={e => handleChange(undefined, e.target.value)}
          placeholder="내용을 입력하세요..."
          style={{ flex: 1, width: "100%", fontSize: 12, lineHeight: 1.7,
            border: "1px solid var(--border)", borderRadius: 10,
            padding: 12, background: "var(--surface)", color: "var(--text)" }}
        />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" }}>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button className="btn-primary" onClick={handleNew}>+ 새 메모</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {[...memos].reverse().map(m => (
          <div key={m.id} onClick={() => openMemo(m)} style={{
            background: "var(--surface)", borderRadius: 12, padding: 12,
            border: "1px solid var(--border)", cursor: "pointer", minHeight: 90,
            display: "flex", flexDirection: "column", gap: 6,
            transition: "border-color 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
          onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
          >
            <p style={{ fontSize: 11, fontWeight: "bold", color: "var(--text)", margin: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {m.title || "제목 없음"}
            </p>
            <p style={{ fontSize: 10, color: "var(--sub)", margin: 0, flex: 1,
              display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
              {m.body || "내용 없음"}
            </p>
            <p style={{ fontSize: 9, color: "var(--border)", margin: 0 }}>
              {format(new Date(m.createdAt), "MM.dd")}
            </p>
          </div>
        ))}
      </div>
      {memos.length === 0 && (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
          color: "var(--sub)", fontSize: 12 }}>새 메모를 작성해보세요 📝</div>
      )}
    </div>
  );
}
