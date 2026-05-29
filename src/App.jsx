import { useState } from "react";
import "./index.css";
import Todo from "./components/Todo";
import Memo from "./components/Memo";
import Pomodoro from "./components/Pomodoro";
import Dday from "./components/Dday";
import CalendarView from "./components/CalendarView";
import Spotify from "./components/Spotify";
import FocusReport from "./components/FocusReport";
import Diary from "./components/Diary";

const TABS = [
  { id: "todo",    icon: "✅", label: "할 일" },
  { id: "memo",    icon: "📝", label: "메모" },
  { id: "timer",   icon: "🍅", label: "뽀모도로" },
  { id: "dday",    icon: "📆", label: "D-Day" },
  { id: "cal",     icon: "🗓", label: "캘린더" },
  { id: "music",   icon: "🎵", label: "음악" },
  { id: "report",  icon: "📊", label: "리포트" },
  { id: "diary",   icon: "🌸", label: "일기" },
];

const VIEWS = {
  todo:   <Todo />,
  memo:   <Memo />,
  timer:  <Pomodoro />,
  dday:   <Dday />,
  cal:    <CalendarView />,
  music:  <Spotify />,
  report: <FocusReport />,
  diary:  <Diary />,
};

export default function App() {
  const [tab, setTab] = useState("todo");

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#faf8f5]">
      <nav className="w-[72px] flex flex-col items-center py-4 gap-1 bg-white border-r border-[#f0e8e0] flex-shrink-0">
        <div className="w-9 h-9 rounded-xl bg-[#f4a67a] flex items-center justify-center text-white text-sm font-bold mb-3">
          S
        </div>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`sidebar-item w-full ${tab === t.id ? "active" : ""}`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>

      <main className="flex-1 overflow-hidden">
        {VIEWS[tab]}
      </main>
    </div>
  );
}
