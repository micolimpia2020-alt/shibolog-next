import { useState, useEffect, useMemo } from "react";
import { C, card, inp } from "../theme.js";
import { Field } from "../components/ui.jsx";
import LineChart from "../components/LineChart.jsx";
import { WD, dateKey, parseKey, addDays, dayTotals, calcProfile, calcFatGoal, fmt1 } from "../lib/model.js";
import { listDayDates, loadDayLean } from "../lib/storage.js";

function mondayOf(key) {
  const d = parseKey(key);
  const wd = d.getDay();
  return addDays(key, wd === 0 ? -6 : 1 - wd);
}
const weekLabel = mon => {
  const a = parseKey(mon), b = parseKey(addDays(mon, 6));
  return `${a.getMonth() + 1}/${a.getDate()}〜${b.getMonth() + 1}/${b.getDate()}`;
};
const avg = xs => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);

export default function Home({ date, setDate, day, settings, profile, fatgoal, mode, markedDates, updateDay, onGoCalendar }) {
  const today = dateKey();
  // ダッシュボードは常に今日を基準にする
  useEffect(() => { if (date !== today) setDate(today); }, []); // eslint-disable-line

  // 全記録の軽量読込（チャート・週統計用）
  const [all, setAll] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const dates = await listDayDates();
      const out = {};
      for (const k of dates) { const d = await loadDayLean(k); if (d) out[k] = d; }
      if (alive) setAll(out);
    })();
    return () => { alive = false; };
  }, []);
  // 現在編集中の日を反映
  const allMerged = useMemo(() => (day ? { ...all, [day.date]: day } : all), [all, day]);

  // 週リスト（最初の記録週〜今週、欠けなく連続）
  const weeks = useMemo(() => {
    const ks = Object.keys(allMerged).sort();
    const first = ks.length ? mondayOf(ks[0]) : mondayOf(today);
    const last = mondayOf(today);
    const out = [];
    let cur = first;
    while (cur <= last) { out.push(cur); cur = addDays(cur, 7); }
    return out;
  }, [allMerged, today]);
  const [selWeek, setSelWeek] = useState(() => mondayOf(today));
  useEffect(() => { if (!weeks.includes(selWeek)) setSelWeek(mondayOf(today)); }, [weeks]); // eslint-disable-line

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(selWeek, i));
  const calOf = k => { const d = allMerged[k]; if (!d) return null; const t = dayTotals(d); return t.kcal > 0 ? Math.round(t.kcal) : null; };
  const weekStat = mon => {
    const ks = Array.from({ length: 7 }, (_, i) => addDays(mon, i));
    return {
      m: avg(ks.map(k => allMerged[k]?.body?.morning).filter(v => v != null)),
      n: avg(ks.map(k => allMerged[k]?.body?.night).filter(v => v != null)),
      c: avg(ks.map(calOf).filter(v => v != null)),
    };
  };
  const cur = weekStat(selWeek);

  // 計算（旧しぼログ式）
  const calc = useMemo(() => calcProfile(profile || {}), [profile]);
  const fatCalc = useMemo(() => calcFatGoal({
    weight: profile?.weight, fatPct: profile?.fatPct,
    targetFatPct: fatgoal?.targetFatPct, dailyDeficit: fatgoal?.dailyDeficit,
  }), [profile, fatgoal]);
  const goalWeight = fatCalc?.goalWeight ?? calc?.goalWeight ?? null;

  // チャートデータ（記録のある日・直近30日分）
  const chartKeys = useMemo(() => Object.keys(allMerged).sort().slice(-30), [allMerged]);
  const wSeries = [
    { label: "朝", color: mode.accent, data: chartKeys.map((k, i) => ({ x: i, y: allMerged[k]?.body?.morning ?? null })) },
    { label: "夜", color: C.f, data: chartKeys.map((k, i) => ({ x: i, y: allMerged[k]?.body?.night ?? null })) },
  ];
  const cSeries = [{ label: "kcal", color: C.salt, data: chartKeys.map((k, i) => ({ x: i, y: calOf(k) })) }];
  const chartLabels = chartKeys.map(k => { const d = parseKey(k); return `${d.getMonth() + 1}/${d.getDate()}`; });

  const latestMorning = useMemo(() => {
    const ks = Object.keys(allMerged).sort();
    for (let i = ks.length - 1; i >= 0; i--) {
      const v = allMerged[ks[i]]?.body?.morning;
      if (v != null) return v;
    }
    return null;
  }, [allMerged]);
  const diffKg = latestMorning != null && goalWeight != null ? Math.max(0, latestMorning - goalWeight) : null;
  const todayBody = (date === today ? day?.body : allMerged[today]?.body) || {};

  const setTodayBody = p => updateDay({ body: { ...(day?.body || {}), ...p } });

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>ダッシュボード</div>
      </div>

      {/* 今日の体重入力 */}
      <div style={card({ marginBottom: 12, border: `1.5px solid ${mode.accent}44` })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: mode.accent, marginBottom: 8 }}>⚖️ 今日の体重</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="🌅 朝 (kg)"><input type="number" step="0.1" inputMode="decimal" value={todayBody.morning ?? ""} style={inp()}
            onChange={e => setTodayBody({ morning: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
          <Field label="🌙 夜 (kg)"><input type="number" step="0.1" inputMode="decimal" value={todayBody.night ?? ""} style={inp()}
            onChange={e => setTodayBody({ night: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
        </div>
        {diffKg != null && (
          <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginTop: 4 }}>
            🎯 目標体重 {fmt1(goalWeight)}kg まで <b style={{ color: mode.accent, fontSize: 16 }}>−{fmt1(diffKg)}kg</b>
          </div>
        )}
      </div>

      {/* 週選択 */}
      <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4, marginBottom: 10 }}>
        {weeks.map(m => (
          <button key={m} onClick={() => setSelWeek(m)}
            style={{ flexShrink: 0, border: `1.5px solid ${selWeek === m ? mode.accent : C.border}`, background: selWeek === m ? mode.soft : "#fff", color: selWeek === m ? mode.accent : C.muted, borderRadius: 18, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
            {weekLabel(m)}
          </button>
        ))}
      </div>

      {/* 今週の平均 */}
      <div style={card({ display: "flex", textAlign: "center", padding: 12, marginBottom: 12 })}>
        {[["🌅 朝平均", cur.m != null ? fmt1(cur.m) + "kg" : "—"], ["🌙 夜平均", cur.n != null ? fmt1(cur.n) + "kg" : "—"], ["🔥 カロリー平均", cur.c != null ? Math.round(cur.c) + "kcal" : "—"]].map(([l, v]) => (
          <div key={l} style={{ flex: 1 }}>
            <div style={{ fontSize: 11, color: C.muted }}>{l}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>{v}</div>
          </div>
        ))}
      </div>

      {/* 週間カレンダー */}
      <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
        {weekDays.map((k, i) => {
          const d = allMerged[k];
          return (
            <button key={k} onClick={onGoCalendar}
              style={{ flex: 1, border: `1px solid ${k === today ? mode.accent : C.border}`, background: "#fff", borderRadius: 12, padding: "6px 0", cursor: "pointer", textAlign: "center" }}>
              <div style={{ fontSize: 9, color: C.muted }}>{WD[(i + 1) % 7]}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{parseKey(k).getDate()}</div>
              <div style={{ fontSize: 12, minHeight: 16 }}>{d?.condition?.mood || ""}</div>
              <div style={{ fontSize: 10, color: d?.training?.done ? mode.accent : C.muted, fontWeight: 700 }}>{d?.training?.done ? "💪" : "休"}</div>
            </button>
          );
        })}
      </div>

      {/* 体重推移 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>
          📉 体重推移
          <span style={{ marginLeft: 8, fontSize: 11, fontWeight: 600 }}>
            <span style={{ color: mode.accent }}>● 朝</span> <span style={{ color: C.f }}>● 夜</span>
          </span>
        </div>
        <LineChart series={wSeries} labels={chartLabels}
          refLine={goalWeight != null ? { value: goalWeight, label: `目標${fmt1(goalWeight)}`, color: C.green } : null} />
      </div>

      {/* カロリー推移 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>🔥 カロリー推移</div>
        <LineChart series={cSeries} labels={chartLabels}
          refLine={calc?.cut ? { value: calc.cut, label: `目標${calc.cut}`, color: mode.accent } : null} />
      </div>

      {/* 週ごとの平均 */}
      <div style={card()}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>📋 週ごとの平均</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 4, fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
          <span>週</span><span>🌅朝</span><span>🌙夜</span><span>🔥kcal</span>
        </div>
        {[...weeks].reverse().map(m => {
          const s = weekStat(m);
          if (s.m == null && s.n == null && s.c == null) return null;
          return (
            <div key={m} style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr 1fr", gap: 4, fontSize: 12, color: C.text, padding: "5px 0", borderBottom: `1px solid ${C.dim}` }}>
              <span style={{ fontWeight: 700 }}>{weekLabel(m)}</span>
              <span>{s.m != null ? fmt1(s.m) : "—"}</span>
              <span>{s.n != null ? fmt1(s.n) : "—"}</span>
              <span>{s.c != null ? Math.round(s.c) : "—"}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
