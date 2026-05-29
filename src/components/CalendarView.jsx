import { useState } from "react";
import { useStore } from "../store";
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  getDay, isSameDay, parseISO, addMonths, subMonths
} from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";

const COLORS = ["#f4a67a", "#a8d8b0", "#a8c8e8", "#e8a8d0", "#d4c8a0"];

export default function CalendarView() {
  const { events, addEvent, deleteEvent } = useStore();
  const [current, setCurrent] = useState(new Date());
  const [selected, setSelected] = useState(null);
  const [adding, setAdding] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newColor, setNewColor] = useState(COLORS[0]);

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart);

  const dayEvents = (d) => events.filter(e => isSameDay(parseISO(e.date), d));
  const selectedEvents = selected ? dayEvents(selected) : [];

  const handleAddEvent = () => {
    if (!newTitle.trim() || !selected) return;
    addEvent(newTitle.trim(), format(selected, "yyyy-MM-dd"), newColor);
    setNewTitle("");
    setAdding(false);
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3530]">
          {format(current, "yyyy년 M월", { locale: ko })}
        </h2>
        <div className="flex gap-1">
          <button onClick={() => setCurrent(subMonths(current, 1))} className="btn-ghost p-2">
            <ChevronLeft size={14} />
          </button>
          <button onClick={() => setCurrent(new Date())} className="btn-ghost px-3 py-1 text-xs">
            오늘
          </button>
          <button onClick={() => setCurrent(addMonths(current, 1))} className="btn-ghost p-2">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="card">
        <div className="grid grid-cols-7 mb-2">
          {["일", "월", "화", "수", "목", "금", "토"].map(d => (
            <div key={d} className="text-center text-xs font-medium text-[#9b8c80] py-1">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-y-1">
          {Array.from({ length: startPad }).map((_, i) => <div key={`p${i}`} />)}
          {days.map(d => {
            const de = dayEvents(d);
            const isToday = isSameDay(d, new Date());
            const isSel = selected && isSameDay(d, selected);
            return (
              <div
                key={d.toString()}
                onClick={() => setSelected(isSel ? null : d)}
                className="flex flex-col items-center gap-0.5 py-1 rounded-lg cursor-pointer hover:bg-[#f5ede6] transition-colors"
                style={{ background: isSel ? "#ffe4d6" : undefined }}
              >
                <span className={`text-xs w-6 h-6 flex items-center justify-center rounded-full
                  ${isToday ? "bg-[#f4a67a] text-white font-bold" : "text-[#3d3530]"}`}>
                  {format(d, "d")}
                </span>
                <div className="flex gap-0.5 flex-wrap justify-center">
                  {de.slice(0, 3).map(e => (
                    <span key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ background: e.color }} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {selected && (
        <div className="card flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-[#3d3530]">
              {format(selected, "M월 d일 (EEEE)", { locale: ko })}
            </span>
            <button onClick={() => setAdding(a => !a)} className="btn-primary flex items-center gap-1 text-xs py-1 px-3">
              <Plus size={12} /> 일정
            </button>
          </div>

          {adding && (
            <div className="flex gap-2 flex-wrap">
              <input
                type="text"
                className="flex-1 text-sm"
                placeholder="일정 이름"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleAddEvent()}
                autoFocus
              />
              <div className="flex gap-1">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => setNewColor(c)}
                    className="w-5 h-5 rounded-full transition-transform"
                    style={{ background: c, transform: newColor === c ? "scale(1.3)" : undefined }}
                  />
                ))}
              </div>
              <button className="btn-primary text-xs px-3 py-1" onClick={handleAddEvent}>저장</button>
              <button className="btn-ghost text-xs px-3 py-1" onClick={() => setAdding(false)}>취소</button>
            </div>
          )}

          {selectedEvents.length === 0 && !adding && (
            <p className="text-xs text-[#c0b0a4]">일정이 없어요</p>
          )}

          {selectedEvents.map(e => (
            <div key={e.id} className="flex items-center gap-2 group">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: e.color }} />
              <span className="flex-1 text-sm text-[#3d3530]">{e.title}</span>
              <button
                onClick={() => deleteEvent(e.id)}
                className="opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070] transition-opacity"
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
