import { useState, useEffect, useCallback } from "react";
import { C, card, inp } from "../theme.js";
import { Field } from "../components/ui.jsx";
import { WD, dateKey, parseKey, addDays, emptyDay, CONDITION_ITEMS } from "../lib/model.js";
import { loadDay, saveDay, kvGet, kvSet } from "../lib/storage.js";

const EMOJIS = ["😊", "😆", "😍", "😭", "😡", "🤤", "🌙", "🌈"];
const LEVELS = [1, 2, 3, 4, 5];

// 月曜キー取得
function mondayOf(key) {
  const d = parseKey(key);
  const wd = d.getDay();
  return addDays(key, wd === 0 ? -6 : 1 - wd);
}
const weekLabel = mon => {
  const a = parseKey(mon), b = parseKey(addDays(mon, 6));
  return `${a.getMonth() + 1}/${a.getDate()}〜${b.getMonth() + 1}/${b.getDate()}`;
};

export default function Records({ mode, settings, markedDates, onSaved }) {
  const [monday, setMonday] = useState(() => mondayOf(dateKey()));
  const [days, setDays] = useState({});
  const [reflection, setReflection] = useState("");

  // 週の7日分を読込（新しい順表示）
  const load = useCallback(async (mon) => {
    const out = {};
    for (let i = 0; i < 7; i++) {
      const k = addDays(mon, i);
      out[k] = (await loadDay(k)) || emptyDay(k);
    }
    setDays(out);
    setReflection((await kvGet(`slnx_week:${mon}`, null))?.reflection || "");
  }, []);
  useEffect(() => { load(monday); }, [monday, load]);

  const patchDay = (k, patch) => {
    setDays(prev => {
      const next = { ...prev[k], ...patch };
      saveDay(next).then(ok => onSaved && onSaved(ok, k));
      return { ...prev, [k]: next };
    });
  };
  const setBody = (k, p) => patchDay(k, { body: { ...days[k].body, ...p } });
  const setCond = (k, p) => patchDay(k, { condition: { ...days[k].condition, ...p } });

  const keys = Array.from({ length: 7 }, (_, i) => addDays(monday, i)).reverse(); // 新しい日付から
  const today = dateKey();
  const enabled = CONDITION_ITEMS.filter(it => settings?.conditionItems?.[it.key]);

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>記録</div>

      {/* 週選択 */}
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 14 }}>
        <button onClick={() => setMonday(addDays(monday, -7))} style={{ border: "none", background: C.dim, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 800, color: C.text }}>‹</button>
        <div style={{ flex: 1, textAlign: "center", fontSize: 15, fontWeight: 800, color: C.text }}>{weekLabel(monday)}</div>
        <button onClick={() => setMonday(addDays(monday, 7))} style={{ border: "none", background: C.dim, borderRadius: 10, padding: "8px 14px", cursor: "pointer", fontWeight: 800, color: C.text }}>›</button>
      </div>

      {/* 今週の振り返り */}
      <div style={card({ marginBottom: 12 })}>
        <Field label="🪞 今週の振り返り">
          <textarea rows={2} value={reflection} style={inp({ resize: "vertical", fontFamily: "inherit" })}
            placeholder="今週どうだった？"
            onChange={e => {
              setReflection(e.target.value);
              kvSet(`slnx_week:${monday}`, { reflection: e.target.value }).then(ok => onSaved && onSaved(ok));
            }} />
        </Field>
      </div>

      {/* 日別（新しい順） */}
      {keys.map(k => {
        const day = days[k];
        if (!day) return null;
        const d = parseKey(k);
        const isToday = k === today;
        return (
          <div key={k} style={card({ marginBottom: 10, border: isToday ? `1.5px solid ${mode.accent}66` : `1px solid ${C.border}` })}>
            <div style={{ fontSize: 13, fontWeight: 800, color: isToday ? mode.accent : C.text, marginBottom: 8 }}>
              {d.getMonth() + 1}/{d.getDate()}（{WD[d.getDay()]}）{isToday && " 今日"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
              <Field label="🌅 朝体重 (kg)"><input type="number" step="0.1" inputMode="decimal" value={day.body?.morning ?? ""} style={inp({ padding: "9px 10px" })}
                onChange={e => setBody(k, { morning: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
              <Field label="🌙 夜体重 (kg)"><input type="number" step="0.1" inputMode="decimal" value={day.body?.night ?? ""} style={inp({ padding: "9px 10px" })}
                onChange={e => setBody(k, { night: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
              {EMOJIS.map(em => (
                <button key={em} onClick={() => setCond(k, { mood: day.condition?.mood === em ? "" : em })}
                  style={{ flex: 1, fontSize: 17, padding: "6px 0", borderRadius: 10, cursor: "pointer", border: `1.5px solid ${day.condition?.mood === em ? mode.accent : C.border}`, background: day.condition?.mood === em ? mode.soft : "#fff" }}>
                  {em}
                </button>
              ))}
            </div>
            {isToday && enabled.map(({ key: ck, label }) => (
              <div key={ck} style={{ marginBottom: 8 }}>
                <div style={{ fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>{label}</div>
                <div style={{ display: "flex", gap: 6 }}>
                  {LEVELS.map(v => (
                    <button key={v} onClick={() => setCond(k, { [ck]: day.condition?.[ck] === v ? null : v })}
                      style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "6px 0", borderRadius: 10, cursor: "pointer", color: day.condition?.[ck] === v ? "#fff" : C.muted, border: `1px solid ${C.border}`, background: day.condition?.[ck] === v ? mode.accent : "#fff" }}>{v}</button>
                  ))}
                </div>
              </div>
            ))}
            <input type="text" placeholder="備考（メモ）" value={day.note || ""} style={inp({ padding: "9px 10px", fontSize: 13 })}
              onChange={e => patchDay(k, { note: e.target.value })} />
          </div>
        );
      })}
    </div>
  );
}
