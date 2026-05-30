import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ChevronDown, ChevronRight, StickyNote } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");
const COLORS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];

export default function Todo() {
  const { todos, sections, addTodo, toggleTodo, deleteTodo,
          updateTodoNote, addSection, deleteSection } = useStore();

  const [text, setText] = useState("");
  const [date, setDate] = useState(today());
  const [activeSection, setActiveSection] = useState(sections[0] || "기본");
  const [expanded, setExpanded] = useState({}); // 노트 펼치기
  const [collapsed, setCollapsed] = useState({});
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [colorIdx, setColorIdx] = useState(0);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), date, activeSection, COLORS[colorIdx % COLORS.length]);
    setText("");
    setColorIdx(i => i + 1);
  };

  const toggleExpand = (id) => setExpanded(e => ({ ...e, [id]: !e[id] }));
  const toggleCollapse = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }));

  const todayStr = today();
  const allToday = todos.filter(t => t.date === todayStr);
  const doneCount = allToday.filter(t => t.done).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* 상단 */}
      <div style={{ padding: "12px 14px 8px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        {/* 진행률 */}
        {allToday.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 3, background: "var(--sidebar)", borderRadius: 2 }}>
              <div style={{
                width: `${(doneCount / allToday.length) * 100}%`,
                height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s",
              }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--sub)" }}>{doneCount}/{allToday.length}</span>
          </div>
        )}

        {/* 입력 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
          {/* 다음 색상 미리보기 */}
          <div style={{
            width: 32, height: 32, borderRadius: 8, flexShrink: 0,
            background: COLORS[colorIdx % COLORS.length] + "55",
            border: `2px solid ${COLORS[colorIdx % COLORS.length]}`,
            cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 9, color: "var(--sub)",
          }} onClick={() => setColorIdx(i => i + 1)} title="색상 변경">
            ●
          </div>
          <input type="text" placeholder="할 일 추가..."
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, fontSize: 12 }}
          />
          <button className="btn-primary" onClick={handleAdd}
            style={{ padding: "6px 12px", fontSize: 11 }}>추가</button>
        </div>

        {/* 날짜 + 섹션 */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ fontSize: 10, padding: "3px 8px" }} />
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
            {sections.map((s, i) => (
              <button key={s} onClick={() => setActiveSection(s)} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer",
                border: "none", fontFamily: "Galmuri, sans-serif",
                background: activeSection === s ? "var(--blue)" : "var(--sidebar)",
                color: activeSection === s ? "var(--bg)" : "var(--sub)",
                fontWeight: activeSection === s ? "bold" : "normal",
              }}>{s}</button>
            ))}
            {addingSection ? (
              <input autoFocus placeholder="섹션 이름" value={newSectionName}
                onChange={e => setNewSectionName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === "Enter") {
                    if (!newSectionName.trim()) return;
                    addSection(newSectionName.trim());
                    setActiveSection(newSectionName.trim());
                    setNewSectionName(""); setAddingSection(false);
                  }
                  if (e.key === "Escape") { setAddingSection(false); setNewSectionName(""); }
                }}
                style={{ width: 80, fontSize: 10, padding: "3px 8px" }}
              />
            ) : (
              <button onClick={() => setAddingSection(true)} style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 10,
                border: "1px dashed var(--border)", background: "transparent",
                color: "var(--sub)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
              }}>+ 섹션</button>
            )}
          </div>
        </div>
      </div>

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sections.map(section => {
          const sectionTodos = todos.filter(t => t.section === section);
          if (sectionTodos.length === 0) return null;
          const isCollapsed = collapsed[section];

          return (
            <div key={section}>
              {/* 섹션 헤더 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px 4px", cursor: "pointer",
              }} onClick={() => toggleCollapse(section)}>
                <span style={{ color: "var(--sub)", display: "flex" }}>
                  {isCollapsed ? <ChevronRight size={12}/> : <ChevronDown size={12}/>}
                </span>
                <span style={{ fontSize: 10, fontWeight: "bold", color: "var(--sub)", flex: 1 }}>
                  {section}
                </span>
                <span style={{ fontSize: 9, color: "var(--border)" }}>
                  {sectionTodos.filter(t=>t.done).length}/{sectionTodos.length}
                </span>
                {section !== "기본" && sectionTodos.length === 0 && (
                  <button onClick={e => { e.stopPropagation(); deleteSection(section); }}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"var(--border)", padding:0 }}>
                    <Trash2 size={11}/>
                  </button>
                )}
              </div>

              {/* 아이템 */}
              {!isCollapsed && sectionTodos.map(t => {
                const color = t.color || COLORS[0];
                const bgAlpha = color + "33"; // 20% opacity
                const isExp = expanded[t.id];

                return (
                  <div key={t.id} style={{ margin: "2px 10px", borderRadius: 10, overflow: "hidden",
                    background: t.done ? "transparent" : bgAlpha,
                    border: `1px solid ${t.done ? "var(--border)" : color + "66"}`,
                    transition: "all 0.2s",
                  }}>
                    {/* 메인 행 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                      {/* 체크박스 */}
                      <button onClick={() => toggleTodo(t.id)} style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${t.done ? color : "var(--sub)"}`,
                        background: t.done ? color : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 9, color: "var(--bg)", padding: 0,
                      }}>{t.done ? "✓" : ""}</button>

                      {/* 텍스트 */}
                      <span style={{ flex: 1, fontSize: 12,
                        color: t.done ? "var(--sub)" : "var(--text)",
                        textDecoration: t.done ? "line-through" : "none",
                      }}>{t.text}</span>

                      {/* 날짜 */}
                      {t.date && t.date !== todayStr && (
                        <span style={{ fontSize: 9, color: "var(--sub)", flexShrink: 0 }}>
                          {t.date.slice(5).replace("-","/")}
                        </span>
                      )}

                      {/* 노트 토글 */}
                      <button onClick={() => toggleExpand(t.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: t.note ? color : "var(--border)", padding: 2, flexShrink: 0,
                        fontSize: 11,
                      }}>
                        <StickyNote size={12}/>
                      </button>

                      {/* 삭제 */}
                      <button onClick={() => deleteTodo(t.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "transparent", padding: 2, transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                      onMouseLeave={e => e.currentTarget.style.color = "transparent"}
                      ><Trash2 size={12}/></button>
                    </div>

                    {/* 노트 영역 */}
                    {isExp && (
                      <div style={{ padding: "0 10px 8px", borderTop: `1px solid ${color}33` }}>
                        <textarea
                          value={t.note || ""}
                          onChange={e => updateTodoNote(t.id, e.target.value)}
                          placeholder="메모 추가..."
                          style={{ width: "100%", height: 60, fontSize: 11,
                            background: "transparent", border: "none", outline: "none",
                            color: "var(--text)", resize: "none", marginTop: 6,
                            fontFamily: "Galmuri, sans-serif",
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {todos.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: "50%", color: "var(--sub)", fontSize: 12 }}>
            할 일을 추가해보세요 ✏️
          </div>
        )}
      </div>
    </div>
  );
}
