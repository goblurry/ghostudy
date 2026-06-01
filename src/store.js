import { create } from "zustand";

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const useStore = create((set, get) => ({
  // ── Todos ──────────────────────────────────────────────
  todos: load("todos", []),
  sections: load("sections", ["기본"]),
  addTodo: (text, date, section = "기본", color) => {
    const COLORS = ["#F5C4B3","#FAC775","#9FE1CB","#B8D4F5","#F4C0D1"];
    const c = color || COLORS[get().todos.length % COLORS.length];
    const todos = [...get().todos, { id: Date.now(), text, date, done: false, section, color: c, note: "" }];
    save("todos", todos);
    set({ todos });
  },
  toggleTodo: (id) => {
    const todos = get().todos.map(t => t.id === id ? { ...t, done: !t.done } : t);
    save("todos", todos);
    set({ todos });
  },
  deleteTodo: (id) => {
    const todos = get().todos.filter(t => t.id !== id);
    save("todos", todos);
    set({ todos });
  },
  updateTodoNote: (id, note) => {
    const todos = get().todos.map(t => t.id === id ? { ...t, note } : t);
    save("todos", todos);
    set({ todos });
  },
  addSection: (name) => {
    if (!name.trim() || get().sections.includes(name.trim())) return;
    const sections = [...get().sections, name.trim()];
    save("sections", sections);
    set({ sections });
  },
  deleteSection: (name) => {
    const sections = get().sections.filter(s => s !== name);
    const todos = get().todos.map(t => t.section === name ? { ...t, section: "기본" } : t);
    save("sections", sections); save("todos", todos);
    set({ sections, todos });
  },

  // ── Memos ──────────────────────────────────────────────
  memos: load("memos", []),
  addMemo: (title, body, colorIdx = 0) => {
    const memos = [...get().memos, { id: Date.now(), title, body, colorIdx, createdAt: new Date().toISOString() }];
    save("memos", memos);
    set({ memos });
  },
  updateMemo: (id, title, body) => {
    const memos = get().memos.map(m => m.id === id ? { ...m, title, body } : m);
    save("memos", memos);
    set({ memos });
  },
  deleteMemo: (id) => {
    const memos = get().memos.filter(m => m.id !== id);
    save("memos", memos);
    set({ memos });
  },

  // ── D-Days ─────────────────────────────────────────────
  ddays: load("ddays", []),
  addDday: (label, date) => {
    const ddays = [...get().ddays, { id: Date.now(), label, date }];
    save("ddays", ddays);
    set({ ddays });
  },
  deleteDday: (id) => {
    const ddays = get().ddays.filter(d => d.id !== id);
    save("ddays", ddays);
    set({ ddays });
  },

  // ── Pomodoro sessions ──────────────────────────────────
  sessions: load("sessions", []),
  addSession: (minutes, date) => {
    const sessions = [...get().sessions, { id: Date.now(), minutes, date }];
    save("sessions", sessions);
    set({ sessions, liveSeconds: 0 }); // 세션 완료 시 liveSeconds 초기화
  },
  // 현재 진행 중인 집중 시간 (초 단위, 저장 안 함)
  liveSeconds: 0,
  setLiveSeconds: (s) => set({ liveSeconds: s }),

  // ── Pomodoro timer state (탭 전환 시 유지) ────────────────
  timerMode: "focus",
  timerSeconds: 25 * 60,
  timerRunning: false,
  timerCycle: 0,
  timerDurations: { focus: 25, short: 5, long: 15 },
  setTimerState: (patch) => set(patch),

  // ── Calendar events ────────────────────────────────────
  events: load("events", []),
  addEvent: (title, date, color) => {
    const events = [...get().events, { id: Date.now(), title, date, color: color || "#f4a67a" }];
    save("events", events);
    set({ events });
  },
  deleteEvent: (id) => {
    const events = get().events.filter(e => e.id !== id);
    save("events", events);
    set({ events });
  },

  // ── Now Playing ─────────────────────────────────────────
  nowPlaying: { title: "", isPlaying: false, source: null },
  setNowPlaying: (info) => set(s => ({ nowPlaying: { ...s.nowPlaying, ...info } })),

  // ── 현재 YouTube 항목 (홈화면 플레이어 공유) ────────────
  ytItem: null,
  setYtItem: (item) => set({ ytItem: item }),

  // ── Diary ──────────────────────────────────────────────
  diary: load("diary", []),
  saveDiary: (date, text, mood) => {
    const existing = get().diary.filter(d => d.date !== date);
    const diary = [...existing, { date, text, mood }];
    save("diary", diary);
    set({ diary });
  },
  getDiary: (date) => get().diary.find(d => d.date === date),
}));
