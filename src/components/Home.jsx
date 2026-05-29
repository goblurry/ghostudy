import { useStore } from "../store";
import { format, differenceInDays, parseISO } from "date-fns";
import { ko } from "date-fns/locale";

const WEEKDAY_GREET = ["일요일이에요 ☀️", "월요일이에요 💪", "화요일이에요 ✨", "수요일이에요 🌿", "목요일이에요 🎯", "금요일이에요 🎉", "토요일이에요 🌸"];

export default function Home() {
  const { todos, toggleTodo, ddays } = useStore();
  const now = new Date();
  const today = format(now, "yyyy-MM-dd");
  const todayTodos = todos.filter(t => t.date === today);
  const doneCount = todayTodos.filter(t => t.done).length;

  const upcomingDdays = [...ddays]
    .map(d => ({ ...d, diff: differenceInDays(parseISO(d.date), now) }))
    .filter(d => d.diff >= 0)
    .sort((a, b) => a.diff - b.diff)
    .slice(0, 3);

  return (
    <div className="h-full flex flex-col gap-3 p-4 overflow-y-auto">

      {/* 날짜 */}
      <div className="card bg-gradient-to-br from-[#fff8f4] to-[#ffeedd] border border-[#fdd9c0]">
        <p className="text-xs text-[#c0a090] font-medium mb-0.5">{format(now, "yyyy년 M월", { locale: ko })}</p>
        <p className="text-3xl font-bold text-[#3d3530] leading-none">{format(now, "d일")}</p>
        <p className="text-sm text-[#9b8c80] mt-0.5">{WEEKDAY_GREET[now.getDay()]}</p>
      </div>

      {/* 오늘 할 일 */}
      <div className="card flex flex-col gap-2">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs font-semibold text-[#9b8c80] uppercase tracking-wide">오늘 할 일</p>
          <span className="text-xs text-[#c0b0a4]">{doneCount}/{todayTodos.length}</span>
        </div>

        {todayTodos.length > 0 && (
          <div className="w-full bg-[#f0e8e0] rounded-full h-1.5 mb-1">
            <div
              className="bg-[#f4a67a] h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${todayTodos.length ? (doneCount / todayTodos.length) * 100 : 0}%` }}
            />
          </div>
        )}

        {todayTodos.length === 0 ? (
          <p className="text-xs text-[#c0b0a4] py-1">오늘 할 일이 없어요 ✨</p>
        ) : (
          todayTodos.map(t => (
            <button
              key={t.id}
              onClick={() => toggleTodo(t.id)}
              className="flex items-center gap-2.5 text-left group w-full"
            >
              <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${t.done ? "bg-[#f4a67a] border-[#f4a67a]" : "border-[#d4c5b5] group-hover:border-[#f4a67a]"}`}>
                {t.done && <span className="text-white text-[8px] font-bold">✓</span>}
              </span>
              <span className={`text-sm ${t.done ? "line-through text-[#c0b0a4]" : "text-[#3d3530]"}`}>
                {t.text}
              </span>
            </button>
          ))
        )}
      </div>

      {/* D-Day */}
      {upcomingDdays.length > 0 && (
        <div className="card flex flex-col gap-2">
          <p className="text-xs font-semibold text-[#9b8c80] uppercase tracking-wide mb-1">D-Day</p>
          {upcomingDdays.map(d => (
            <div key={d.id} className="flex items-center justify-between">
              <span className="text-sm text-[#3d3530]">{d.label}</span>
              <span className={`text-sm font-bold tabular-nums ${d.diff === 0 ? "text-[#e07070]" : "text-[#f4a67a]"}`}>
                {d.diff === 0 ? "D-Day" : `D-${d.diff}`}
              </span>
            </div>
          ))}
        </div>
      )}

    </div>
  );
}
