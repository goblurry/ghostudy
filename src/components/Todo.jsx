import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");
const COLORS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];
let colorCursor = 0;

export default function Todo() {
  const { todos, sections, addTodo, toggleTodo, deleteTodo,
          updateTodoNote, addSection, deleteSection } = useStore();

  const [text, setText] = useState("");
  const [activeSection, setActiveSection] = useState(sections[0] || "기본");
  const [expanded, setExpanded] = useState(null); // 상세 펼친 항목 id
  const [collapsed, setCollapsed] = useState({});
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    const color = COLORS[colorCursor % COLORS.length];
    colorCursor++;
    addTodo(text.trim(), today(), activeSection, color);
    setText("");
  };

  const toggleExpand = (id) => setExpanded(e => e === id ? null : id);
  const toggleCollapse = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }));

  const todayStr = today();
  const allToday = todos.filter(t => t.date === todayStr);
  const doneCount = allToday.filter(t => t.done).length;

  // 할일 날짜 업데이트
  const updateDate = (id, date) => {
    const { todos: ts } = useStore.getState();
    const updated = ts.map(t => t.id === id ? { ...t, date } : t);
    localStorage.setItem("todos", JSON.stringify(updated));
    useStore.setState({ todos: updated });
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* 상단 입력 */}
      <div style={{ padding: "14px 14px 12px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        {allToday.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ flex: 1, height: 2, background: "var(--sidebar)", borderRadius: 2 }}>
              <div style={{ width: `${(doneCount / allToday.length) * 100}%`,
                height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s" }} />
            </div>
            <span style={{ fontSize: 9, color: "var(--sub)" }}>{doneCount}/{allToday.length}</span>
          </div>
        )}

        {/* 입력창 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input type="text" placeholder="할 일 추가..."
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, fontSize: 12 }}
          />
          <button onClick={handleAdd} style={{
            background: "none", border: "none", cursor: "pointer",
            color: "var(--sub)", fontSize: 18, lineHeight: 1, padding: "0 4px", flexShrink: 0,
          }}>+</button>
        </div>

        {/* 섹션 탭 */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              padding: "2px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer",
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
                if (e.key === "Enter" && newSectionName.trim()) {
                  addSection(newSectionName.trim());
                  setActiveSection(newSectionName.trim());
                  setNewSectionName(""); setAddingSection(false);
                }
                if (e.key === "Escape") { setAddingSection(false); setNewSectionName(""); }
              }}
              style={{ width: 80, fontSize: 10, padding: "2px 8px" }}
            />
          ) : (
            <button onClick={() => setAddingSection(true)} style={{
              padding: "2px 10px", borderRadius: 20, fontSize: 10,
              border: "1px dashed var(--border)", background: "transparent",
              color: "var(--sub)", cursor: "pointer", fontFamily: "Galmuri, sans-serif",
            }}>+ 섹션</button>
          )}
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
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px 4px", cursor: "pointer" }}
                onClick={() => toggleCollapse(section)}>
                <span style={{ color: "var(--sub)", display: "flex" }}>
                  {isCollapsed ? <ChevronRight size={11}/> : <ChevronDown size={11}/>}
                </span>
                <span style={{ fontSize: 10, color: "var(--sub)", flex: 1 }}>{section}</span>
                <span style={{ fontSize: 9, color: "var(--border)" }}>
                  {sectionTodos.filter(t=>t.done).length}/{sectionTodos.length}
                </span>
              </div>

              {!isCollapsed && sectionTodos.map(t => {
                const color = t.color || COLORS[0];
                const isExp = expanded === t.id;

                return (
                  <div key={t.id} style={{
                    margin: "2px 10px", borderRadius: 10, overflow: "hidden",
                    background: t.done ? "transparent" : color + "22",
                    border: `1px solid ${t.done ? "transparent" : color + "55"}`,
                    transition: "all 0.15s",
                  }}>
                    {/* 메인 행 */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 10px" }}>
                      <button onClick={() => toggleTodo(t.id)} style={{
                        width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                        border: `2px solid ${t.done ? color : "var(--sub)"}`,
                        background: t.done ? color : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 9, color: "var(--bg)", padding: 0,
                      }}>{t.done ? "✓" : ""}</button>

                      <span onClick={() => toggleExpand(t.id)} style={{
                        flex: 1, fontSize: 12, cursor: "pointer",
                        color: t.done ? "var(--sub)" : "var(--text)",
                        textDecoration: t.done ? "line-through" : "none",
                      }}>{t.text}</span>

                      {t.note && <span style={{ fontSize: 9, color: "var(--sub)" }}>📝</span>}

                      {t.date && t.date !== todayStr && (
                        <span style={{ fontSize: 9, color: "var(--sub)", flexShrink: 0 }}>
                          {t.date.slice(5).replace("-","/")}
                        </span>
                      )}

                      <button onClick={() => deleteTodo(t.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "transparent", padding: 2,
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                      onMouseLeave={e => e.currentTarget.style.color = "transparent"}
                      ><Trash2 size={12}/></button>
                    </div>

                    {/* 상세 패널 */}
                    {isExp && (
                      <div style={{ padding: "0 10px 10px",
                        borderTop: `1px solid ${color}44`, display: "flex", flexDirection: "column", gap: 8 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 8 }}>
                          <span style={{ fontSize: 10, color: "var(--sub)", flexShrink: 0 }}>📅 날짜</span>
                          <input type="date" value={t.date || todayStr}
                            onChange={e => updateDate(t.id, e.target.value)}
                            style={{ fontSize: 10, padding: "3px 8px", flex: 1 }}
                          />
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                          <span style={{ fontSize: 10, color: "var(--sub)" }}>📝 메모</span>
                          <textarea value={t.note || ""}
                            onChange={e => updateTodoNote(t.id, e.target.value)}
                            placeholder="메모 추가..."
                            style={{ width: "100%", height: 60, fontSize: 11,
                              background: "var(--sidebar)", border: "1px solid var(--border)",
                              borderRadius: 8, padding: "6px 8px", outline: "none",
                              color: "var(--text)", resize: "none",
                              fontFamily: "Galmuri, sans-serif",
                            }}
                          />
                        </div>
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
