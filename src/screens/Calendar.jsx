import { useState, useEffect } from "react";
import { C, card } from "../theme.js";
import { WD, dateKey, parseKey, dayTotals } from "../lib/model.js";
import { loadDayLean } from "../lib/storage.js";

export default function Calendar({ mode, markedDates, onJump }) {
  const today = dateKey();
  const [ym, setYm] = useState(today.slice(0, 7));
  const [sel, setSel] = useState(today);
  const [selDay, setSelDay] = useState(null);

  useEffect(() => {
    let alive = true;
    loadDayLean(sel).then(d => alive && setSelDay(d));
    return () => { alive = false; };
  }, [sel]);

  const [y, m] = ym.split("-").map(Number);
  const first = new Date(y, m - 1, 1);
  const firstWd = first.getDay();
  const daysInMonth = new Date(y, m, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstWd; i++) cells.push(null);
  for (let dd = 1; dd <= daysInMonth; dd++) cells.push(`${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(2, "0")}`);

  const move = n => {
    const nd = new Date(y, m - 1 + n, 1);
    setYm(`${nd.getFullYear()}-${String(nd.getMonth() + 1).padStart(2, "0")}`);
  };
  const totals = selDay ? dayTotals(selDay) : null;

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <button onClick={() => move(-1)} style={{ border: "none", background: C.dim, borderRadius: 10, padding: "6px 14px", cursor: "pointer", color: C.text, fontWeight: 800 }}>‹</button>
        <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{y}年{m}月</div>
        <button onClick={() => move(1)} style={{ border: "none", background: C.dim, borderRadius: 10, padding: "6px 14px", cursor: "pointer", color: C.text, fontWeight: 800 }}>›</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 4 }}>
        {WD.map(w => <div key={w} style={{ textAlign: "center", fontSize: 11, color: C.muted, padding: "4px 0" }}>{w}</div>)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 2, marginBottom: 14 }}>
        {cells.map((k, i) => k === null
          ? <div key={"e" + i} />
          : (
            <button key={k} onClick={() => setSel(k)}
              style={{ aspectRatio: "1", border: "none", cursor: "pointer", borderRadius: 10, fontSize: 13, fontWeight: k === today ? 800 : 600, color: C.text, background: k === sel ? mode.soft : "transparent", outline: k === sel ? `2px solid ${mode.accent}` : "none", position: "relative" }}>
              {parseKey(k).getDate()}
              {markedDates?.has(k) && <span style={{ position: "absolute", bottom: 3, left: "50%", transform: "translateX(-50%)", width: 5, height: 5, borderRadius: "50%", background: mode.accent }} />}
            </button>
          ))}
      </div>

      {/* 選択日サマリ */}
      <div style={card()}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          {parseKey(sel).getMonth() + 1}月{parseKey(sel).getDate()}日の記録
        </div>
        {!selDay ? (
          <div style={{ fontSize: 13, color: C.muted }}>この日の記録はまだありません</div>
        ) : (
          <div style={{ fontSize: 13, color: C.text, lineHeight: 2 }}>
            {totals.kcal > 0 && <div>🍽️ 食事 {selDay.meals?.length || 0}件 / <b>{Math.round(totals.kcal)}</b> kcal（🍗{Math.round(totals.protein)} 🍚{Math.round(totals.carb)} 🥑{Math.round(totals.fat)}）</div>}
            {selDay.body?.morning != null && <div>⚖️ 朝 {selDay.body.morning}kg{selDay.body?.night != null ? ` / 夜 ${selDay.body.night}kg` : ""}{selDay.body?.fatPct != null ? ` / 体脂肪 ${selDay.body.fatPct}%` : ""}</div>}
            {selDay.training?.done && <div>💪 トレーニング済み{selDay.training.parts ? `（${selDay.training.parts}）` : ""}</div>}
            {selDay.condition?.mood && <div>気分 {selDay.condition.mood}</div>}
            {selDay.note && <div style={{ color: C.muted }}>📝 {selDay.note}</div>}
          </div>
        )}
        <button onClick={() => onJump(sel)} style={{ marginTop: 10, width: "100%", border: `1px solid ${mode.accent}66`, background: mode.soft, color: mode.accent, borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          この日を開く →
        </button>
      </div>
    </div>
  );
}
