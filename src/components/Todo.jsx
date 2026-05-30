import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, Plus, ChevronDown, ChevronRight } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function Todo() {
  const { todos, sections, addTodo, toggleTodo, deleteTodo, addSection, deleteSection } = useStore();
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());
  const [activeSection, setActiveSection] = useState("기본");
  const [collapsed, setCollapsed] = useState({});
  const [newSection, setNewSection] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), date, activeSection);
    setText("");
  };

  const handleAddSection = () => {
    if (!newSection.trim()) return;
    addSection(newSection.trim());
    setActiveSection(newSection.trim());
    setNewSection("");
    setAddingSection(false);
  };

  const toggleCollapse = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }));

  const todayStr = today();
  const allToday = todos.filter(t => t.date === todayStr);
  const totalDone = allToday.filter(t => t.done).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* 상단 진행률 + 입력 */}
      <div style={{ padding: "12px 14px 10px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
        {/* 오늘 진행률 */}
        {allToday.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1, height: 3, background: "var(--sidebar)", borderRadius: 2 }}>
              <div style={{
                width: `${(totalDone / allToday.length) * 100}%`,
                height: "100%", background: "var(--mint)", borderRadius: 2, transition: "width 0.4s",
              }} />
            </div>
            <span style={{ fontSize: 10, color: "var(--sub)", flexShrink: 0 }}>
              {totalDone}/{allToday.length}
            </span>
          </div>
        )}

        {/* 입력창 */}
        <div style={{ display: "flex", gap: 6 }}>
          <input type="text" placeholder="할 일 추가..."
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, fontSize: 12 }}
          />
          <input type="date" value={date} onChange={e => setDate(e.target.value)}
            style={{ width: 126, fontSize: 11 }} />
          <button className="btn-primary" onClick={handleAdd}
            style={{ padding: "6px 10px", fontSize: 11 }}>+ 추가</button>
        </div>

        {/* 섹션 선택 탭 */}
        <div style={{ display: "flex", gap: 4, marginTop: 8, flexWrap: "wrap", alignItems: "center" }}>
          {sections.map(s => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              padding: "3px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer",
              border: "none", fontFamily: "Galmuri, sans-serif",
              background: activeSection === s ? "var(--blue)" : "var(--sidebar)",
              color: activeSection === s ? "var(--bg)" : "var(--sub)",
              fontWeight: activeSection === s ? "bold" : "normal",
            }}>{s}</button>
          ))}
          {addingSection ? (
            <input type="text" autoFocus placeholder="섹션 이름"
              value={newSection} onChange={e => setNewSection(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleAddSection(); if (e.key === "Escape") setAddingSection(false); }}
              onBlur={() => { if (!newSection.trim()) setAddingSection(false); }}
              style={{ width: 80, fontSize: 10, padding: "2px 8px" }}
            />
          ) : (
            <button onClick={() => setAddingSection(true)} style={{
              padding: "3px 8px", borderRadius: 20, fontSize: 10, cursor: "pointer",
              border: "1px dashed var(--border)", background: "transparent", color: "var(--sub)",
              fontFamily: "Galmuri, sans-serif",
            }}>+ 섹션</button>
          )}
        </div>
      </div>

      {/* 섹션별 할일 목록 */}
      <div style={{ flex: 1, overflowY: "auto", padding: "0 14px 14px" }}>
        {sections.map(section => {
          const sectionTodos = todos.filter(t => t.section === section);
          if (sectionTodos.length === 0 && section !== "기본") return null;
          const isCollapsed = collapsed[section];
          const doneCnt = sectionTodos.filter(t => t.done).length;

          return (
            <div key={section} style={{ marginTop: 14 }}>
              {/* 섹션 헤더 */}
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                <button onClick={() => toggleCollapse(section)} style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: "var(--sub)", padding: 0, display: "flex", alignItems: "center",
                }}>
                  {isCollapsed
                    ? <ChevronRight size={13} />
                    : <ChevronDown size={13} />
                  }
                </button>
                <span style={{ fontSize: 11, fontWeight: "bold", color: "var(--sub)", flex: 1 }}>
                  {section}
                </span>
                <span style={{ fontSize: 10, color: "var(--border)" }}>
                  {doneCnt}/{sectionTodos.length}
                </span>
                {section !== "기본" && (
                  <button onClick={() => deleteSection(section)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: "var(--border)", padding: 2, fontSize: 10,
                  }}
                  onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                  onMouseLeave={e => e.currentTarget.style.color = "var(--border)"}
                  ><Trash2 size={11} /></button>
                )}
              </div>

              {/* 할일 아이템 */}
              {!isCollapsed && (
                <div style={{
                  background: "var(--surface)", borderRadius: 10,
                  border: "1px solid var(--border)", overflow: "hidden",
                }}>
                  {sectionTodos.length === 0 ? (
                    <p style={{ fontSize: 11, color: "var(--border)", margin: 0, padding: "10px 14px" }}>
                      할 일이 없어요
                    </p>
                  ) : sectionTodos.map((t, i) => (
                    <div key={t.id} style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "9px 14px",
                      borderBottom: i < sectionTodos.length - 1 ? "1px solid var(--border)" : "none",
                    }}
                    className="todo-item"
                    >
                      {/* 체크 버튼 */}
                      <button onClick={() => toggleTodo(t.id)} style={{
                        width: 16, height: 16, borderRadius: "50%", flexShrink: 0,
                        border: `2px solid ${t.done ? "var(--mint)" : "var(--sub)"}`,
                        background: t.done ? "var(--mint)" : "transparent",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: 9, color: "var(--bg)", padding: 0,
                        transition: "all 0.15s",
                      }}>{t.done ? "✓" : ""}</button>

                      {/* 텍스트 */}
                      <span style={{
                        flex: 1, fontSize: 12,
                        color: t.done ? "var(--sub)" : "var(--text)",
                        textDecoration: t.done ? "line-through" : "none",
                        transition: "all 0.15s",
                      }}>{t.text}</span>

                      {/* 날짜 */}
                      {t.date && t.date !== today() && (
                        <span style={{ fontSize: 9, color: "var(--sub)", flexShrink: 0 }}>
                          {t.date.slice(5).replace("-", "/")}
                        </span>
                      )}

                      {/* 삭제 */}
                      <button onClick={() => deleteTodo(t.id)} style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: "transparent", padding: 2, transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = "#e07070"}
                      onMouseLeave={e => e.currentTarget.style.color = "transparent"}
                      ><Trash2 size={12} /></button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
