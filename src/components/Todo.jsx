import { useState, useRef } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Trash2, ChevronDown, ChevronRight } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");
const COLORS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];
let colorCursor = 0;

// ── 할일 아이템 ────────────────────────────────────────────
function TodoItem({ t, expanded, toggleExpand, toggleTodo, deleteTodo, updateTodoNote, updateDate, todayStr }) {
  const color = t.color || COLORS[0];
  const isExp = expanded === t.id;

  return (
    <div style={{
      margin: "2px 10px", borderRadius: 10, overflow: "hidden",
      background: t.done ? "transparent" : color + "22",
      border: `1px solid ${t.done ? "transparent" : color + "55"}`,
      transition: "all 0.15s",
    }}>
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
}

// ── 섹션 그룹 헤더 ─────────────────────────────────────────
function SectionHeader({ label, items, isCollapsed, onToggle }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6,
      padding: "8px 14px 4px", cursor: "pointer" }}
      onClick={onToggle}>
      <span style={{ color: "var(--sub)", display: "flex" }}>
        {isCollapsed ? <ChevronRight size={11}/> : <ChevronDown size={11}/>}
      </span>
      <span style={{ fontSize: 10, color: "var(--sub)", flex: 1 }}>{label}</span>
      <span style={{ fontSize: 9, color: "var(--border)" }}>
        {items.filter(t => t.done).length}/{items.length}
      </span>
    </div>
  );
}

// ── 메인 ──────────────────────────────────────────────────
export default function Todo() {
  const { todos, sections, addTodo, toggleTodo, deleteTodo,
          updateTodoNote, addSection, deleteSection } = useStore();

  const [text, setText] = useState("");
  const [activeSection, setActiveSection] = useState("전체");
  const [expanded, setExpanded] = useState(null);
  const [collapsed, setCollapsed] = useState({});
  const [newSectionName, setNewSectionName] = useState("");
  const [addingSection, setAddingSection] = useState(false);
  const [sortByDate, setSortByDate] = useState(false);
  const [ctxMenu, setCtxMenu] = useState(null); // { section, x, y }

  const handleAdd = () => {
    if (!text.trim()) return;
    const color = COLORS[colorCursor % COLORS.length];
    colorCursor++;
    const sec = activeSection === "전체" ? (sections[0] || "기본") : activeSection;
    addTodo(text.trim(), today(), sec, color);
    setText("");
  };

  const toggleExpand = (id) => setExpanded(e => e === id ? null : id);
  const toggleCollapse = (s) => setCollapsed(c => ({ ...c, [s]: !c[s] }));

  const todayStr = today();
  const allToday = todos.filter(t => t.date === todayStr);
  const doneCount = allToday.filter(t => t.done).length;

  const updateDate = (id, date) => {
    const { todos: ts } = useStore.getState();
    const updated = ts.map(t => t.id === id ? { ...t, date } : t);
    localStorage.setItem("todos", JSON.stringify(updated));
    useStore.setState({ todos: updated });
  };

  const itemProps = { expanded, toggleExpand, toggleTodo, deleteTodo, updateTodoNote, updateDate, todayStr };

  // 현재 뷰에 표시할 todos
  const viewTodos = activeSection === "전체"
    ? todos
    : todos.filter(t => t.section === activeSection);

  const sorted = sortByDate
    ? [...viewTodos].sort((a, b) => (a.date || "9999").localeCompare(b.date || "9999"))
    : viewTodos;

  // 날짜순일 때 날짜별 그룹
  const dateGroups = (() => {
    const groups = {};
    sorted.forEach(t => {
      const key = t.date || "날짜 없음";
      if (!groups[key]) groups[key] = [];
      groups[key].push(t);
    });
    return Object.entries(groups);
  })();

  // 섹션별 그룹 (날짜순 아닐 때)
  const sectionList = activeSection === "전체" ? sections : [activeSection];

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

        {/* 섹션 탭 + 날짜순 버튼 */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center", paddingTop: 3 }}>
          {["전체", ...sections].map(s => (
            <button key={s}
              onClick={() => setActiveSection(s)}
              onContextMenu={e => {
                if (s === "전체") return;
                e.preventDefault();
                setCtxMenu({ section: s, x: e.clientX, y: e.clientY });
              }}
              style={{
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

          {/* 날짜순 토글 */}
          <button onClick={() => setSortByDate(s => !s)} style={{
            marginLeft: "auto", padding: "2px 10px", borderRadius: 20, fontSize: 10, cursor: "pointer",
            border: `1px solid ${sortByDate ? "var(--blue)" : "var(--border)"}`,
            background: sortByDate ? "rgba(184,212,245,0.12)" : "transparent",
            color: sortByDate ? "var(--blue)" : "var(--sub)",
            fontFamily: "Galmuri, sans-serif", flexShrink: 0,
          }}>날짜순</button>
        </div>
      </div>

      {/* 우클릭 컨텍스트 메뉴 */}
      {ctxMenu && (
        <>
          {/* 배경 클릭 시 닫기 */}
          <div style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setCtxMenu(null)} />
          <div style={{
            position: "fixed", zIndex: 100,
            left: ctxMenu.x, top: ctxMenu.y,
            background: "var(--surface)", border: "1px solid var(--border)",
            borderRadius: 8, padding: "4px",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
            minWidth: 120,
          }}>
            <div style={{ padding: "4px 6px 4px", fontSize: 10, color: "var(--sub)", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
              {ctxMenu.section}
            </div>
            <button onClick={() => {
              deleteSection(ctxMenu.section);
              if (activeSection === ctxMenu.section) setActiveSection("전체");
              setCtxMenu(null);
            }} style={{
              width: "100%", textAlign: "left", padding: "5px 10px",
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "#e07070", borderRadius: 6,
              fontFamily: "Galmuri, sans-serif",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(224,112,112,0.1)"}
            onMouseLeave={e => e.currentTarget.style.background = "none"}
            >삭제</button>
          </div>
        </>
      )}

      {/* 목록 */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {sortByDate ? (
          // ── 날짜별 그룹 ──
          dateGroups.map(([date, items]) => (
            <div key={date}>
              <div style={{ display: "flex", alignItems: "center", gap: 6,
                padding: "8px 14px 4px" }}>
                <span style={{ fontSize: 10, color: "var(--sub)", flex: 1 }}>
                  {date === todayStr ? "📅 오늘" : date === "날짜 없음" ? "— 날짜 없음" : `📅 ${date.slice(5).replace("-", "/")}`}
                </span>
                <span style={{ fontSize: 9, color: "var(--border)" }}>
                  {items.filter(t => t.done).length}/{items.length}
                </span>
              </div>
              {items.map(t => <TodoItem key={t.id} t={t} {...itemProps} />)}
            </div>
          ))
        ) : (
          // ── 섹션별 그룹 ──
          sectionList.map(section => {
            const items = sorted.filter(t => t.section === section);
            if (items.length === 0) return null;
            const isCollapsed = collapsed[section];
            return (
              <div key={section}>
                <SectionHeader
                  label={section} items={items}
                  isCollapsed={isCollapsed}
                  onToggle={() => toggleCollapse(section)}
                />
                {!isCollapsed && items.map(t => <TodoItem key={t.id} t={t} {...itemProps} />)}
              </div>
            );
          })
        )}

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
