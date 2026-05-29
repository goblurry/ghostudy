import { useState } from "react";
import { useStore } from "../store";
import { differenceInDays, parseISO, format } from "date-fns";
import { Plus, Trash2, Calendar } from "lucide-react";

export default function Dday() {
  const { ddays, addDday, deleteDday } = useStore();
  const [label, setLabel] = useState("");
  const [date, setDate] = useState("");

  const handleAdd = () => {
    if (!label.trim() || !date) return;
    addDday(label.trim(), date);
    setLabel("");
    setDate("");
  };

  const calc = (dateStr) => {
    const diff = differenceInDays(parseISO(dateStr), new Date());
    if (diff === 0) return { text: "D-Day", color: "#e07070" };
    if (diff > 0) return { text: `D-${diff}`, color: "#f4a67a" };
    return { text: `D+${Math.abs(diff)}`, color: "#a8d8b0" };
  };

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-[#3d3530]">D-Day</h2>

      <div className="card flex gap-2 flex-wrap">
        <input
          type="text"
          className="flex-1 min-w-[120px]"
          placeholder="이름 (예: 기말고사)"
          value={label}
          onChange={e => setLabel(e.target.value)}
          onKeyDown={e => e.key === "Enter" && handleAdd()}
        />
        <input type="date" value={date} onChange={e => setDate(e.target.value)} />
        <button className="btn-primary flex items-center gap-1" onClick={handleAdd}>
          <Plus size={14} /> 추가
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {ddays.map(d => {
          const { text, color } = calc(d.date);
          return (
            <div key={d.id} className="card relative group flex flex-col items-center justify-center gap-2 py-6">
              <button
                onClick={() => deleteDday(d.id)}
                className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 text-[#d4c5b5] hover:text-[#e07070] transition-opacity"
              >
                <Trash2 size={13} />
              </button>
              <span className="text-3xl font-bold" style={{ color }}>{text}</span>
              <span className="text-sm font-medium text-[#3d3530]">{d.label}</span>
              <span className="text-xs text-[#9b8c80] flex items-center gap-1">
                <Calendar size={11} /> {format(parseISO(d.date), "yyyy.MM.dd")}
              </span>
            </div>
          );
        })}
      </div>

      {ddays.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#c0b0a4] text-sm">
          중요한 날을 등록해보세요 📆
        </div>
      )}
    </div>
  );
}
