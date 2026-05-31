import { useStore } from "../store";
import { format, subDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function FocusReport() {
  const { sessions, liveSeconds } = useStore();
  const liveMins = Math.floor(liveSeconds / 60);

  const today = format(new Date(), "yyyy-MM-dd");
  const last7 = Array.from({ length: 7 }).map((_, i) => {
    const d = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
    const mins = sessions.filter(s => s.date === d).reduce((a, s) => a + s.minutes, 0)
      + (i === 6 ? liveMins : 0); // 오늘 진행 중인 시간 포함
    return { date: format(subDays(new Date(), 6 - i), "M/d"), mins, isToday: i === 6 };
  });

  const todayMins = sessions.filter(s => s.date === today).reduce((a, s) => a + s.minutes, 0) + liveMins;
  const totalMins = sessions.reduce((a, s) => a + s.minutes, 0) + liveMins;
  const maxDay = [...last7].sort((a, b) => b.mins - a.mins)[0];
  const fmt = m => m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

  const card = { background: "var(--surface)", borderRadius: 12, padding: 14, border: "1px solid var(--border)" };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: 12, padding: 16, overflowY: "auto" }}>
      {/* 통계 카드 3개 */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        {[
          { label: "오늘 집중", value: fmt(todayMins), sub: `${sessions.filter(s => s.date === today).length}세션` },
          { label: "주간 최고", value: maxDay?.mins > 0 ? fmt(maxDay.mins) : "-", sub: maxDay?.date },
          { label: "누적 집중", value: fmt(totalMins), sub: `총 ${sessions.length}세션` },
        ].map(s => (
          <div key={s.label} style={{ ...card, textAlign: "center" }}>
            <p style={{ fontSize: 9, color: "var(--sub)", margin: "0 0 4px" }}>{s.label}</p>
            <p style={{ fontSize: 16, fontWeight: "bold", color: "var(--peach)", margin: "0 0 2px" }}>{s.value}</p>
            <p style={{ fontSize: 9, color: "var(--sub)", margin: 0 }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* 차트 */}
      <div style={card}>
        <p style={{ fontSize: 10, color: "var(--sub)", margin: "0 0 10px" }}>최근 7일 집중 시간</p>
        {sessions.length === 0 ? (
          <div style={{ height: 120, display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--sub)", fontSize: 11 }}>뽀모도로 세션을 완료하면 기록이 쌓여요 🍅</div>
        ) : (
          <ResponsiveContainer width="100%" height={120}>
            <BarChart data={last7} barSize={20}>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: "var(--sub)" }} axisLine={false} tickLine={false} />
              <YAxis hide />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 11 }}
                labelStyle={{ color: "var(--text)" }}
                formatter={v => [`${v}분`, "집중"]}
              />
              <Bar dataKey="mins" radius={[4, 4, 0, 0]}>
                {last7.map((e, i) => (
                  <Cell key={i} fill={e.isToday ? "var(--peach)" : "var(--sidebar)"} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* 오늘 세션 목록 */}
      <div style={card}>
        <p style={{ fontSize: 10, color: "var(--sub)", margin: "0 0 10px" }}>오늘 세션 기록</p>
        {sessions.filter(s => s.date === today).length === 0
          ? <p style={{ fontSize: 11, color: "var(--sub)", margin: 0 }}>아직 오늘 세션이 없어요</p>
          : sessions.filter(s => s.date === today).map((s, i) => (
            <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
              <span style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--sidebar)",
                color: "var(--peach)", fontSize: 9, display: "flex", alignItems: "center",
                justifyContent: "center", fontWeight: "bold", flexShrink: 0 }}>{i + 1}</span>
              <span style={{ fontSize: 11, color: "var(--text)" }}>{s.minutes}분 집중 완료</span>
              <span style={{ marginLeft: "auto", fontSize: 12 }}>🍅</span>
            </div>
          ))
        }
      </div>
    </div>
  );
}
