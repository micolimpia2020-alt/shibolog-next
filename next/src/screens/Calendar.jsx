import { useState, useEffect } from "react";
import { C, card } from "../theme.js";
import { WD, dateKey, parseKey, dayTotals, normalizeParts } from "../lib/model.js";
import { loadDayLean, saveDay } from "../lib/storage.js";
import { inp } from "../theme.js";

export default function Calendar({ mode, markedDates, onJump, onSaved }) {
  const today = dateKey();
  const [ym, setYm] = useState(today.slice(0, 7));
  const [sel, setSel] = useState(today);
  const [selDay, setSelDay] = useState(null);

  useEffect(() => {
    let alive = true;
    loadDayLean(sel).then(d => alive && setSelDay(d));
    return () => { alive = false; };
  }, [sel]);

  // 月の全日データ（セル表示用）
  const [monthDays, setMonthDays] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const [yy, mm] = ym.split("-").map(Number);
      const days = new Date(yy, mm, 0).getDate();
      const out = {};
      for (let i = 1; i <= days; i++) {
        const k = `${yy}-${String(mm).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
        if (markedDates?.has(k)) { const d = await loadDayLean(k); if (d) out[k] = d; }
      }
      if (alive) setMonthDays(out);
    })();
    return () => { alive = false; };
  }, [ym, markedDates, sel, selDay]);

  const patchSel = (p) => {
    setSelDay(prev => {
      const base = prev || { date: sel, body: {}, condition: {}, meals: [], training: { done: false }, note: "" };
      const next = { ...base, ...p, date: sel };
      saveDay(next).then(ok => onSaved && onSaved(ok, sel));
      return next;
    });
  };

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
              style={{ minHeight: 52, border: "none", cursor: "pointer", borderRadius: 10, padding: "2px 0", color: C.text, background: k === sel ? mode.soft : "transparent", outline: k === sel ? `2px solid ${mode.accent}` : "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
              <span style={{ fontSize: 12, fontWeight: k === today ? 800 : 600 }}>{parseKey(k).getDate()}</span>
              <span style={{ fontSize: 8, color: C.muted, lineHeight: 1.1 }}>{monthDays[k]?.body?.morning != null ? `🌅${monthDays[k].body.morning}` : ""}</span>
              <span style={{ fontSize: 9, lineHeight: 1.1 }}>
                {monthDays[k]?.condition?.mood || ""}{monthDays[k]?.training?.done ? "💪" : ""}
              </span>
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
            {selDay.training?.done && (
              <div>💪 トレーニング済み
                {normalizeParts(selDay.training.parts).map(p => (
                  <span key={p} style={{ display: "inline-block", margin: "0 2px", padding: "1px 8px", borderRadius: 10, background: mode.soft, color: mode.accent, fontSize: 11, fontWeight: 700 }}>{p}</span>
                ))}
              </div>
            )}
            {selDay.condition?.mood && <div>気分 {selDay.condition.mood}</div>}
            {selDay.note && <div style={{ color: C.muted }}>📝 {selDay.note}</div>}
            {selDay.schedule && <div style={{ color: C.muted }}>📌 {selDay.schedule}</div>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 10 }}>
          <input type="number" step="0.1" inputMode="decimal" placeholder="🌅 朝体重" value={selDay?.body?.morning ?? ""} style={inp({ padding: "9px 10px", fontSize: 13 })}
            onChange={e => patchSel({ body: { ...(selDay?.body || {}), morning: e.target.value === "" ? null : parseFloat(e.target.value) } })} />
          <input type="number" step="0.1" inputMode="decimal" placeholder="🌙 夜体重" value={selDay?.body?.night ?? ""} style={inp({ padding: "9px 10px", fontSize: 13 })}
            onChange={e => patchSel({ body: { ...(selDay?.body || {}), night: e.target.value === "" ? null : parseFloat(e.target.value) } })} />
        </div>
        <input type="text" placeholder="📝 メモ" value={selDay?.note || ""} style={inp({ padding: "9px 10px", fontSize: 13, marginTop: 8 })}
          onChange={e => patchSel({ note: e.target.value })} />
        <input type="text" placeholder="📌 予定" value={selDay?.schedule || ""} style={inp({ padding: "9px 10px", fontSize: 13, marginTop: 8 })}
          onChange={e => patchSel({ schedule: e.target.value })} />
        <button onClick={() => onJump(sel)} style={{ marginTop: 10, width: "100%", border: `1px solid ${mode.accent}66`, background: mode.soft, color: mode.accent, borderRadius: 12, padding: "10px", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
          この日を開く →
        </button>
      </div>
    </div>
  );
}
