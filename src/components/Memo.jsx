import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ArrowLeft, Plus } from "lucide-react";

const card = { background: "var(--surface)", borderRadius: 12, border: "1px solid var(--border)" };

// 파스텔 포스트잇 색상 팔레트
const PASTEL_COLORS = [
  { bg: "#FFF9C4", line: "#F0E68C", text: "#5C4A00" }, // 노랑
  { bg: "#FFD6E0", line: "#FFB3C6", text: "#5C1A2E" }, // 핑크
  { bg: "#C8F0E0", line: "#A0DCC8", text: "#0D4030" }, // 민트
  { bg: "#D6E8FF", line: "#B0CCEE", text: "#0D2A50" }, // 블루
  { bg: "#EAD6FF", line: "#D0AAEE", text: "#2D0D50" }, // 라벤더
];

// 포스트잇 모달
function PostitModal({ onClose, onSave }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [colorIdx, setColorIdx] = useState(0);
  const col = PASTEL_COLORS[colorIdx];
  const LINE_HEIGHT = 24;
  const LINE_COUNT = 10;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.45)",
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width: 280, borderRadius: 4,
        background: col.bg,
        boxShadow: "4px 6px 24px rgba(0,0,0,0.35), 0 1px 0 rgba(0,0,0,0.08)",
        display: "flex", flexDirection: "column",
        transform: "rotate(-1deg)",
        overflow: "hidden",
      }}>
        {/* 색상 선택 바 */}
        <div style={{ display: "flex", gap: 6, padding: "10px 14px 8px", justifyContent: "center" }}>
          {PASTEL_COLORS.map((c, i) => (
            <button key={i} onClick={() => setColorIdx(i)} style={{
              width: 16, height: 16, borderRadius: "50%",
              background: c.bg, border: i === colorIdx ? `2px solid ${c.text}` : "2px solid transparent",
              cursor: "pointer", padding: 0, flexShrink: 0,
              boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
            }} />
          ))}
        </div>

        {/* 제목 */}
        <input
          type="text"
          placeholder="제목"
          value={title}
          onChange={e => setTitle(e.target.value)}
          autoFocus
          style={{
            background: "transparent", border: "none", outline: "none",
            fontSize: 14, fontWeight: "bold", color: col.text,
            padding: "4px 16px 8px",
            fontFamily: "Galmuri, sans-serif",
            borderBottom: `2px solid ${col.line}`,
          }}
        />

        {/* 줄 노트 본문 */}
        <div style={{ position: "relative", height: LINE_HEIGHT * LINE_COUNT }}>
          {/* 배경 줄 */}
          {Array.from({ length: LINE_COUNT }).map((_, i) => (
            <div key={i} style={{
              position: "absolute", left: 0, right: 0,
              top: i * LINE_HEIGHT + LINE_HEIGHT - 1,
              height: 1, background: col.line,
            }} />
          ))}
          <textarea
            value={body}
            onChange={e => setBody(e.target.value)}
            placeholder="내용을 입력하세요..."
            style={{
              position: "absolute", inset: 0,
              width: "100%", height: "100%",
              background: "transparent", border: "none", outline: "none", resize: "none",
              fontSize: 12, color: col.text, lineHeight: `${LINE_HEIGHT}px`,
              padding: `0 16px`,
              fontFamily: "Galmuri, sans-serif",
            }}
          />
        </div>

        {/* 버튼 */}
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, padding: "10px 14px" }}>
          <button onClick={onClose} style={{
            background: "transparent", border: `1px solid ${col.line}`,
            borderRadius: 6, padding: "4px 12px", fontSize: 11,
            color: col.text, cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          }}>취소</button>
          <button onClick={() => onSave(title, body, colorIdx)} style={{
            background: col.line, border: "none",
            borderRadius: 6, padding: "4px 12px", fontSize: 11,
            color: col.text, fontWeight: "bold", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
          }}>저장</button>
        </div>
      </div>
    </div>
  );
}

export default function Memo() {
  const { memos, addMemo, updateMemo, deleteMemo, todos } = useStore();
  const [selected, setSelected] = useState(null); // { type: "memo"|"todo", id }
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [showModal, setShowModal] = useState(false);

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
  const handleNew = () => setShowModal(true);

  const handleModalSave = (t, b, colorIdx) => {
    addMemo(t || "제목 없음", b, colorIdx);
    setShowModal(false);
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
    <>
    {showModal && <PostitModal onClose={() => setShowModal(false)} onSave={handleModalSave} />}
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 0, overflowY: "auto" }}>
      {/* 독립 메모 섹션 */}
      <div style={{ padding: "12px 14px 6px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)",
            textTransform: "uppercase", letterSpacing: "0.06em" }}>메모</span>
          <button onClick={handleNew} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--sub)", fontSize: 18, lineHeight: 1, padding: "0 4px",
          }}>+</button>
        </div>

        {memos.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
            justifyContent: "center", gap: 10, padding: "32px 0 20px" }}>
            <span style={{ fontSize: 28 }}>📝</span>
            <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>아직 메모가 없어요</p>
            <p style={{ fontSize: 10, color: "var(--border)", margin: 0 }}>+ 버튼을 눌러 첫 메모를 추가해보세요</p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 4 }}>
            {[...memos].reverse().map(m => {
              const col = PASTEL_COLORS[m.colorIdx ?? 0];
              return (
                <div key={m.id} onClick={() => openMemo(m)} style={{
                  borderRadius: 4, padding: 12, cursor: "pointer", minHeight: 80,
                  display: "flex", flexDirection: "column", gap: 4, transition: "opacity 0.15s",
                  background: col.bg, boxShadow: "2px 3px 10px rgba(0,0,0,0.25)",
                  transform: `rotate(${(m.id % 3 - 1) * 0.8}deg)`,
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = "0.85"}
                onMouseLeave={e => e.currentTarget.style.opacity = "1"}
                >
                  <p style={{ fontSize: 11, fontWeight: "bold", color: col.text, margin: 0,
                    overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    borderBottom: `1px solid ${col.line}`, paddingBottom: 4 }}>
                    {m.title || "제목 없음"}
                  </p>
                  <p style={{ fontSize: 10, color: col.text, opacity: 0.75, margin: 0, flex: 1,
                    display: "-webkit-box", WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                    {m.body || "내용 없음"}
                  </p>
                  <p style={{ fontSize: 9, color: col.text, opacity: 0.5, margin: 0 }}>
                    {format(new Date(m.createdAt), "MM.dd")}
                  </p>
                </div>
              );
            })}
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
    </>
  );
}
