import { useState } from "react";
import { useStore } from "../store";
import { format } from "date-fns";
import { Plus, Trash2, ArrowLeft } from "lucide-react";

export default function Memo() {
  const { memos, addMemo, updateMemo, deleteMemo } = useStore();
  const [selected, setSelected] = useState(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  const openMemo = (m) => {
    setSelected(m.id);
    setTitle(m.title);
    setBody(m.body);
  };

  const handleNew = () => {
    const id = Date.now();
    addMemo("제목 없음", "");
    const newMemo = { id, title: "제목 없음", body: "" };
    setSelected(id);
    setTitle("제목 없음");
    setBody("");
  };

  const handleChange = (newTitle, newBody) => {
    if (newTitle !== undefined) setTitle(newTitle);
    if (newBody !== undefined) setBody(newBody);
    updateMemo(selected, newTitle ?? title, newBody ?? body);
  };

  const handleBack = () => setSelected(null);

  if (selected !== null) {
    return (
      <div className="h-full flex flex-col p-6 gap-3">
        <div className="flex items-center gap-3">
          <button onClick={handleBack} className="text-[#9b8c80] hover:text-[#3d3530]">
            <ArrowLeft size={18} />
          </button>
          <input
            type="text"
            className="flex-1 text-base font-semibold border-none bg-transparent outline-none text-[#3d3530] p-0"
            value={title}
            onChange={e => handleChange(e.target.value, undefined)}
            style={{ border: "none", padding: 0, fontSize: 16, fontWeight: 600 }}
          />
          <button
            onClick={() => { deleteMemo(selected); setSelected(null); }}
            className="text-[#d4c5b5] hover:text-[#e07070]"
          >
            <Trash2 size={16} />
          </button>
        </div>
        <textarea
          className="flex-1 w-full text-sm text-[#3d3530] border border-[#e8ddd4] rounded-xl p-4 outline-none bg-white focus:border-[#f4a67a]"
          placeholder="내용을 입력하세요..."
          value={body}
          onChange={e => handleChange(undefined, e.target.value)}
          style={{ resize: "none" }}
        />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#3d3530]">메모</h2>
        <button className="btn-primary flex items-center gap-1" onClick={handleNew}>
          <Plus size={14} /> 새 메모
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {[...memos].reverse().map(m => (
          <div
            key={m.id}
            onClick={() => openMemo(m)}
            className="card cursor-pointer hover:shadow-md transition-shadow min-h-[100px] flex flex-col gap-2"
          >
            <p className="font-medium text-sm text-[#3d3530] truncate">{m.title || "제목 없음"}</p>
            <p className="text-xs text-[#9b8c80] flex-1 line-clamp-3">{m.body || "내용 없음"}</p>
            <p className="text-xs text-[#c0b0a4]">
              {format(new Date(m.createdAt), "MM.dd")}
            </p>
          </div>
        ))}
      </div>

      {memos.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-[#c0b0a4] text-sm">
          새 메모를 작성해보세요 📝
        </div>
      )}
    </div>
  );
}
