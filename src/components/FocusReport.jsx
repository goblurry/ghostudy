import { useStore } from "../store";
import { format, subDays, parseISO } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function FocusReport() {
  const { sessions } = useStore();

  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const mins = sessions.filter(s => s.date === d).reduce((a, s) => a + s.minutes, 0);
    return { date: format(subDays(new Date(), 6 - i), "M/d"), mins };
  });

  const today = format(new Date(), "yyyy-MM-dd");
  const todayMins = sessions.filter(s => s.date === today).reduce((a, s) => a + s.minutes, 0);
  const totalSessions = sessions.filter(s => s.date === today).length;
  const totalMins = sessions.reduce((a, s) => a + s.minutes, 0);
  const maxDay = [...last7].sort((a, b) => b.mins - a.mins)[0];

  const fmt = (m) => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

  return (
    <div className="h-full flex flex-col gap-4 p-6 overflow-y-auto">
      <h2 className="text-lg font-semibold text-[#3d3530]">집중 리포트</h2>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "오늘 집중", value: fmt(todayMins), sub: `${totalSessions}세션` },
          { label: "주간 최고", value: maxDay?.mins > 0 ? fmt(maxDay.mins) : "-", sub: maxDay?.date },
          { label: "누적 집중", value: fmt(totalMins), sub: `총 ${sessions.length}세션` },
        ].map(s => (
          <div key={s.label} className="card text-center">
            <p className="text-xs text-[#9b8c80] mb-1">{s.label}</p>
            <p className="text-xl font-bold text-[#f4a67a]">{s.value}</p>
            <p className="text-xs text-[#c0b0a4] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="card flex flex-col gap-3">
        <p className="text-sm font-medium text-[#3d3530]">최근 7일 집중 시간</p>
        {sessions.length === 0 ? (
          <div className="h-[160px] flex items-center justify-center text-[#c0b0a4] text-sm">
            뽀모도로 세션을 완료하면 기록이 쌓여요 🍅
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={last7} barSize={24}>
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "#9b8c80" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v) => [`${v}분`, "집중"]}
                contentStyle={{ border: "1px solid #e8ddd4", borderRadius: 8, fontSize: 12 }}
              />
              <Bar dataKey="mins" radius={[6, 6, 0, 0]}>
                {last7.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.date === format(new Date(), "M/d") ? "#f4a67a" : "#f0e8e0"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="card flex flex-col gap-2">
        <p className="text-sm font-medium text-[#3d3530] mb-1">오늘 세션 기록</p>
        {sessions.filter(s => s.date === today).length === 0 ? (
          <p className="text-xs text-[#c0b0a4]">아직 오늘 세션이 없어요</p>
        ) : (
          sessions
            .filter(s => s.date === today)
            .map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="w-5 h-5 rounded-full bg-[#ffe4d6] text-[#f4a67a] text-xs flex items-center justify-center font-bold">
                  {i + 1}
                </span>
                <span className="text-sm text-[#3d3530]">{s.minutes}분 집중 완료</span>
                <span className="text-xs text-[#c0b0a4] ml-auto">🍅</span>
              </div>
            ))
        )}
      </div>
    </div>
  );
}
