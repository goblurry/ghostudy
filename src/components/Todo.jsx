import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");

// 섹션별 파스텔 색상
const SECTION_COLORS = [
  "rgba(245,196,179,0.18)",  // 피치
  "rgba(250,199,117,0.18)",  // 옐로
  "rgba(159,225,203,0.18)",  // 민트
  "rgba(184,212,245,0.18)",  // 블루
  "rgba(244,192,209,0.18)",  // 핑크
];
const SECTION_ACCENTS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];

export default function Todo() {
  const { todos, sections, addTodo, toggleTodo, deleteTodo, addSection, deleteSection } = useStore();
  const [text, setText] = useState("");
  const [activeSection, setActiveSection] = useState(sections[0] || "기본");
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), today(), activeSection);
    setText("");
  };

  const handleAddSection = () => {
    if (!newSectionName.trim()) return;
    addSection(newSectionName.trim());
    setActiveSection(newSectionName.trim());
    setNewSectionName("");
    setAddingSection(false);
  };

  const todayStr = today();
  const allToday = todos.filter(t => t.date === todayStr);
  const doneCount = allToday.filter(t => t.done).length;

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>

      {/* 상단 입력 영역 */}
      <div style={{ padding: "12px 14px 10px", flexShrink: 0 }}>

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

        {/* 입력창 */}
        <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
          <input type="text" placeholder="할 일 추가..."
            value={text} onChange={e => setText(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            style={{ flex: 1, fontSize: 12 }}
          />
          <button className="btn-primary" onClick={handleAdd}
            style={{ padding: "6px 12px", fontSize: 11 }}>추가</button>
        </div>

        {/* 섹션 탭 */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
          {sections.map((s, i) => (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              padding: "3px 12px", borderRadius: 20, fontSize: 10, cursor: "pointer",
              border: "none", fontFamily: "Galmuri, sans-serif",
              background: activeSection === s ? SECTION_ACCENTS[i % SECTION_ACCENTS.length] : "var(--sidebar)",
              color: activeSection === s ? "var(--bg)" : "var(--sub)",
              fontWeight: activeSection === s ? "bold" : "normal",
              transition: "all 0.15s",
            }}>{s}</button>
          ))}
          {addingSection ? (
            <input autoFocus placeholder="섹션 이름"
              value={newSectionName} onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleAddSection();
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

      {/* 할일 목록 */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sections.map((section, si) => {
          const sectionTodos = todos.filter(t => t.section === section);
          if (sectionTodos.length === 0) return null;

          const accent = SECTION_ACCENTS[si % SECTION_ACCENTS.length];
          const bg = SECTION_COLORS[si % SECTION_COLORS.length];
          const doneCnt = sectionTodos.filter(t => t.done).length;

          return (
            <div key={section} style={{ marginBottom: 2 }}>
              {/* 섹션 라벨 */}
              <div style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "6px 14px 4px",
              }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%",
                  background: accent, flexShrink: 0 }} />
                <span style={{ fontSize: 10, color: "var(--sub)", flex: 1 }}>{section}</span>
                <span style={{ fontSize: 9, color: "var(--border)" }}>{doneCnt}/{sectionTodos.length}</span>
                {section !== "기본" && sectionTodos.length === 0 && (
                  <button onClick={() => deleteSection(section)}
                    style={{ background: "none", border: "none", cursor: "pointer",
                      color: "var(--border)", padding: 0 }}>
                    <Trash2 size={11} />
                  </button>
                )}
              </div>

              {/* 아이템들 */}
              {sectionTodos.map((t) => (
                <div key={t.id} style={{
                  display: "flex", alignItems: "center", gap: 10,
                  padding: "9px 14px",
                  background: t.done ? "transparent" : bg,
                  borderBottom: "1px solid rgba(255,255,255,0.03)",
                  transition: "background 0.2s",
                }}>
                  <button onClick={() => toggleTodo(t.id)} style={{
                    width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                    border: `2px solid ${t.done ? accent : "var(--sub)"}`,
                    background: t.done ? accent : "transparent",
                    cursor: "pointer", display: "flex", alignItems: "center",
                    justifyContent: "center", fontSize: 9, color: "var(--bg)", padding: 0,
                    transition: "all 0.15s",
                  }}>{t.done ? "✓" : ""}</button>

                  <span style={{
                    flex: 1, fontSize: 12,
                    color: t.done ? "var(--sub)" : "var(--text)",
                    textDecoration: t.done ? "line-through" : "none",
                  }}>{t.text}</span>

                  {t.date && t.date !== today() && (
                    <span style={{ fontSize: 9, color: "var(--sub)", flexShrink: 0 }}>
                      {t.date.slice(5).replace("-", "/")}
                    </span>
                  )}

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
          );
        })}

        {todos.length === 0 && (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center",
            height: "60%", color: "var(--sub)", fontSize: 12 }}>
            할 일을 추가해보세요 ✏️
          </div>
        )}
      </div>
    </div>
  );
}
