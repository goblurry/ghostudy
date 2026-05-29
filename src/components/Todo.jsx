import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";

const today = () => format(new Date(), "yyyy-MM-dd");

export default function Todo() {
  const { todos, addTodo, toggleTodo, deleteTodo } = useStore();
  const [text, setText] = useState("");
  const [date, setDate] = useState(today());

  const handleAdd = () => {
    if (!text.trim()) return;
    addTodo(text.trim(), date);
    setText("");
  };

  const byDate = todos.reduce((acc, t) => {
    (acc[t.date] = acc[t.date] || []).push(t);
    return acc;
  }, {});

  const sortedDates = Object.keys(byDate).sort().reverse();
  const todayTodos = todos.filter(t => t.date === today());
  const doneCount = todayTodos.filter(t => t.done).length;

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3530]">할 일 목록</h2>
        {todayTodos.length > 0 && (
          <span className="text-sm text-[#9b8c80]">
            오늘 {doneCount}/{todayTodos.length} 완료
          </span>
        )}
      </div>

      {todayTodos.length > 0 && (
        <div className="w-full bg-[#f0e8e0] rounded-full h-2">
          <div
            className="bg-[#f4a67a] h-2 rounded-full transition-all duration-500"
            style={{ width: `${todayTodos.length ? (doneCount / todayTodos.length) * 100 : 0}%` }}
          />
        </div>
      )}

      <div className="card flex gap-2">
        <input
          type="text"
          className="flex-1"
          placeholder="할 일을 입력하세요"
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-primary flex items-center gap-1" onClick={handleAdd}>
          <Plus size={14} /> 추가
        </button>
      </div>

      {sortedDates.map(d => (
        <div key={d} className="card flex flex-col gap-2">
          <p className="text-xs font-medium text-[#b09b8a] mb-1">
            {d === today() ? "📅 오늘" : d}
          </p>
          {byDate[d].map(todo => (
            <div key={todo.id} className="flex items-center gap-3 group">
              <button onClick={() => toggleTodo(todo.id)} className="text-[#f4a67a] flex-shrink-0">
                {todo.done ? <CheckCircle2 size={18} /> : <Circle size={18} className="text-[#d4c5b5]" />}
              </button>
              <span className={`flex-1 text-sm ${todo.done ? "line-through text-[#c0b0a4]" : "text-[#3d3530]"}`}>
                {todo.text}
              </span>
              <button
                onClick={() => deleteTodo(todo.id)}
                className="opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070] transition-opacity"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      ))}

      {todos.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#c0b0a4] text-sm">
          할 일을 추가해보세요 ✏️
        </div>
      )}
    </div>
  );
}
