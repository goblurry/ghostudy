import { create } from "zustand";

const load = (key, def) => {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
};
const save = (key, val) => localStorage.setItem(key, JSON.stringify(val));

export const useStore = create((set, get) => ({
  // ── Todos ──────────────────────────────────────────────
  todos: load("todos", []),
  addTodo: (text, date) => {
    const todos = [...get().todos, { id: Date.now(), text, date, done: false }];
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

  // ── Memos ──────────────────────────────────────────────
  memos: load("memos", []),
  addMemo: (title, body) => {
    const memos = [...get().memos, { id: Date.now(), title, body, createdAt: new Date().toISOString() }];
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
    set({ sessions });
  },

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
