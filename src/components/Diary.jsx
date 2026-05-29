import { useState } from "react";
import { useStore } from "../store";
import { format, subDays } from "date-fns";

const MOODS = [
  { emoji: "😄", label: "최고" },
  { emoji: "🙂", label: "좋음" },
  { emoji: "😐", label: "보통" },
  { emoji: "😕", label: "별로" },
  { emoji: "😢", label: "힘듦" },
];

export default function Diary() {
  const { diary, saveDiary, getDiary } = useStore();
  const today = format(new Date(), "yyyy-MM-dd");
  const existing = getDiary(today);

  const [text, setText] = useState(existing?.text || "");
  const [mood, setMood] = useState(existing?.mood || null);
  const [saved, setSaved] = useState(!!existing);

  const handleSave = () => {
    saveDiary(today, text, mood);
    setSaved(true);
  };

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    return { date: d, entry: diary.find(e => e.date === d) };
  });

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-[#3d3530]">오늘의 일기</h2>

      <div className="card flex flex-col gap-4">
        <p className="text-sm text-[#9b8c80]">{format(new Date(), "yyyy년 M월 d일")}</p>

        <div>
          <p className="text-sm font-medium text-[#3d3530] mb-2">오늘 기분은?</p>
          <div className="flex gap-3">
            {MOODS.map(m => (
              <button
                key={m.emoji}
                onClick={() => { setMood(m.emoji); setSaved(false); }}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  mood === m.emoji ? "bg-[#ffe4d6] scale-110" : "hover:bg-[#f5ede6]"
                }`}
              >
                <span className="text-2xl">{m.emoji}</span>
                <span className="text-xs text-[#9b8c80]">{m.label}</span>
              </button>
            ))}
          </div>
        </div>

        <textarea
          className="w-full h-32 text-sm"
          placeholder="오늘 하루 어땠어요? 짧게 한 줄이라도 써봐요 ✏️"
          value={text}
          onChange={e => { setText(e.target.value); setSaved(false); }}
        />

        <div className="flex items-center gap-3">
          <button className="btn-primary" onClick={handleSave}>저장</button>
          {saved && <span className="text-xs text-[#a8d8b0]">✓ 저장됐어요</span>}
        </div>
      </div>

      <div className="card flex flex-col gap-3">
        <p className="text-sm font-medium text-[#3d3530]">최근 7일</p>
        <div className="flex gap-2 justify-between">
          {last7.map(({ date, entry }) => (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className="text-xl">{entry?.mood || "·"}</span>
              <span className="text-xs text-[#9b8c80]">{format(new Date(date + "T12:00"), "d")}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card flex flex-col gap-3">
        <p className="text-sm font-medium text-[#3d3530]">지난 기록</p>
        {[...diary].reverse().slice(0, 10).map(entry => (
          <div key={entry.date} className="flex gap-3 py-2 border-b border-[#f0e8e0] last:border-0">
            <span className="text-lg flex-shrink-0">{entry.mood || "📝"}</span>
            <div>
              <p className="text-xs text-[#9b8c80]">{entry.date}</p>
              <p className="text-sm text-[#3d3530] mt-0.5">{entry.text || "(내용 없음)"}</p>
            </div>
          </div>
        ))}
        {diary.length === 0 && (
          <p className="text-xs text-[#c0b0a4]">아직 기록이 없어요</p>
        )}
      </div>
    </div>
  );
}
