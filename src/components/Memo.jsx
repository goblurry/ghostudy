import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Plus } from "lucide-react";

const card = { background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" };

export default function Memo() {
  const { memos, addMemo, updateMemo, deleteMemo, todos } = useStore();
  const [selected, setSelected] = useState(null); // { type: "memo"|"todo", id }
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // 노트가 있는 할일 목록
  const todosWithNote = todos.filter(t => t.note && t.note.trim());

  const openMemo = (m) => {
    setSelected({ type: "memo", id: m.id });
    setTitle(m.title); setBody(m.body);
  };
  const openTodoNote = (t) => {
    setSelected({ type: "todo", id: t.id });
    setTitle(t.text); setBody(t.note || "");
  };
  const handleNew = () => {
    addMemo("제목 없음", "");
    const memos2 = [...memos];
    setSelected({ type: "memo", id: Date.now() });
    setTitle("제목 없음"); setBody("");
  };
  const handleChange = (newTitle, newBody) => {
    if (selected?.type !== "memo") return;
    if (newTitle !== undefined) setTitle(newTitle);
    if (newBody !== undefined) setBody(newBody);
    updateMemo(selected.id, newTitle ?? title, newBody ?? body);
  };

  // 편집 뷰
  if (selected) {
    const isTodo = selected.type === "todo";
    return (
      <div style={{ height: "100%", display: "flex", flexDirection: "column", padding: 16, gap: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button onClick={() => setSelected(null)} style={{
            background: "none", border: "none", cursor: "pointer", color: "var(--sub)", padding: 4,
          }}>←</button>
          <input type="text" value={title}
            onChange={e => !isTodo && handleChange(e.target.value, undefined)}
            readOnly={isTodo}
            style={{ flex: 1, fontSize: 14, fontWeight: "bold",
              background: "transparent", border: "none", outline: "none",
              color: "var(--text)", padding: 0, fontFamily: "Galmuri, sans-serif",
              cursor: isTodo ? "default" : "text",
            }}
          />
          {!isTodo && (
            <button onClick={() => { deleteMemo(selected.id); setSelected(null); }}
              style={{ background: "none", border: "none", cursor: "pointer", color: "var(--sub)" }}
              onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--sub)"}
            ><Trash2 size={14} /></button>
          )}
        </div>
        {isTodo && (
          <p style={{ fontSize: 10, color: "var(--sub)", margin: 0 }}>할 일에 달린 메모 (읽기 전용)</p>
        )}
        <textarea value={body}
          onChange={e => {
            setBody(e.target.value);
            if (!isTodo) handleChange(undefined, e.target.value);
          }}
          readOnly={isTodo}
          placeholder="내용을 입력하세요..."
          style={{ flex: 1, width: "100%", fontSize: 12, lineHeight: 1.8,
            border: "1px solid var(--border)", borderRadius: 10,
            padding: 12, background: "var(--surface)", color: "var(--text)",
            resize: "none", fontFamily: "Galmuri, sans-serif",
            cursor: isTodo ? "default" : "text",
          }}
        />
      </div>
    );
  }

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
      {/* 독립 메모 섹션 */}
      <div style={{ padding: "12px 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)",
            textTransform: "uppercase", letterSpacing: "0.06em" }}>메모</span>
          <button className="btn-primary" onClick={handleNew}
            style={{ padding: "3px 10px", fontSize: 10, display: "flex", alignItems: "center", gap: 4 }}>
            <Plus size={11} /> 새 메모
          </button>
        </div>

        {memos.length === 0 ? (
          <p style={{ fontSize: 11, color: "var(--sub)", margin: "0 0 10px" }}>메모를 추가해보세요 📝</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            {[...memos].reverse().map(m => (
              <div key={m.id} onClick={() => openMemo(m)} style={{
                ...card, padding: 12, cursor: "pointer", minHeight: 80,
                display: "flex", flexDirection: "column", gap: 4, transition: "border-color 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = "var(--blue)"}
              onMouseLeave={e => e.currentTarget.style.borderColor = "var(--border)"}
              >
                <p style={{ fontSize: 11, fontWeight: "bold", color: "var(--text)", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {m.title || "제목 없음"}
                </p>
                <p style={{ fontSize: 10, color: "var(--sub)", margin: 0, flex: 1,
                  display: "-webkit-box", WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                  {m.body || "내용 없음"}
                </p>
                <p style={{ fontSize: 9, color: "var(--border)", margin: 0 }}>
                  {format(new Date(m.createdAt), "MM.dd")}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 할일 메모 섹션 */}
      {todosWithNote.length > 0 && (
        <div style={{ padding: "6px 14px 14px" }}>
          <div style={{ height: 1, background: "var(--border)", marginBottom: 12 }} />
          <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)",
            textTransform: "uppercase", letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
            할 일 메모
          </span>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {todosWithNote.map(t => (
              <div key={t.id} onClick={() => openTodoNote(t)}
                style={{ ...card, padding: "10px 12px", cursor: "pointer",
                  borderLeft: `3px solid ${t.color || "var(--blue)"}`,
                  transition: "border-color 0.15s",
                }}
                onMouseEnter={e => e.currentTarget.style.background = "var(--sidebar)"}
                onMouseLeave={e => e.currentTarget.style.background = "var(--surface)"}
              >
                <p style={{ fontSize: 11, fontWeight: "bold", color: "var(--text)", margin: "0 0 3px",
                  textDecoration: t.done ? "line-through" : "none",
                  color: t.done ? "var(--sub)" : "var(--text)",
                }}>{t.text}</p>
                <p style={{ fontSize: 10, color: "var(--sub)", margin: 0,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {t.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
