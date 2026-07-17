import { C, card, inp } from "../theme.js";
import { Field } from "../components/ui.jsx";
import { CONDITION_ITEMS, parseKey } from "../lib/model.js";

const MOODS = ["😄", "🙂", "😐", "😞", "😫"];
const LEVELS = [1, 2, 3, 4, 5];

export default function Condition({ date, day, settings, mode, updateDay, onPraise }) {
  const d = parseKey(date);
  const body = day?.body || {};
  const cond = day?.condition || {};
  const setBody = p => {
    const k = Object.keys(p)[0];
    const wasEmpty = body[k] == null || body[k] === "";
    updateDay({ body: { ...body, ...p } });
    if (wasEmpty && p[k] != null && p[k] !== "") onPraise && onPraise("body");
  };
  const setCond = p => updateDay({ condition: { ...cond, ...p } });
  const enabled = CONDITION_ITEMS.filter(it => settings.conditionItems?.[it.key]);

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 14 }}>
        体調記録（{d.getMonth() + 1}月{d.getDate()}日）
      </div>

      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>⚖️ 体重・体脂肪</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="朝体重 (kg)"><input type="number" inputMode="decimal" value={body.morning ?? ""} style={inp()} onChange={e => setBody({ morning: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
          <Field label="夜体重 (kg)"><input type="number" inputMode="decimal" value={body.night ?? ""} style={inp()} onChange={e => setBody({ night: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
          <Field label="体脂肪率 (%)"><input type="number" inputMode="decimal" value={body.fatPct ?? ""} style={inp()} onChange={e => setBody({ fatPct: e.target.value === "" ? null : parseFloat(e.target.value) })} /></Field>
        </div>
      </div>

      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>🙂 今日の気分</div>
        <div style={{ display: "flex", gap: 8 }}>
          {MOODS.map(e => (
            <button key={e} onClick={() => setCond({ mood: cond.mood === e ? "" : e })}
              style={{ flex: 1, fontSize: 24, padding: "8px 0", borderRadius: 12, cursor: "pointer", border: `2px solid ${cond.mood === e ? mode.accent : C.border}`, background: cond.mood === e ? mode.soft : "#fff" }}>
              {e}
            </button>
          ))}
        </div>
      </div>

      {enabled.map(({ key, label }) => (
        <div key={key} style={card({ marginBottom: 12 })}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>{label}</div>
          <div style={{ display: "flex", gap: 8 }}>
            {LEVELS.map(v => (
              <button key={v} onClick={() => setCond({ [key]: cond[key] === v ? null : v })}
                style={{ flex: 1, fontSize: 15, fontWeight: 700, padding: "8px 0", borderRadius: 12, cursor: "pointer", color: cond[key] === v ? "#fff" : C.muted, border: `1px solid ${C.border}`, background: cond[key] === v ? mode.accent : "#fff" }}>
                {v}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: C.muted, marginTop: 4 }}>
            <span>低い / 悪い</span><span>高い / 良い</span>
          </div>
        </div>
      ))}
      {enabled.length === 0 && (
        <div style={card({ color: C.muted, fontSize: 13, lineHeight: 1.8 })}>
          設定 → 記録項目 で「食欲」「睡眠の質」「お通じ」などの記録項目を追加できます。
        </div>
      )}

      <div style={card({ marginTop: 0 })}>
        <Field label="メモ">
          <textarea rows={3} value={day?.note || ""} style={inp({ resize: "vertical", fontFamily: "inherit" })} onChange={e => updateDay({ note: e.target.value })} placeholder="今日の気づきなど" />
        </Field>
      </div>
    </div>
  );
}
