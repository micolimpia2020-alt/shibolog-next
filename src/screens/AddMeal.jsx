import { useState, useRef } from "react";
import { C, card, inp, btn, btnGhost } from "../theme.js";
import { Sheet, Field } from "../components/ui.jsx";
import { emptyMeal, mealTotals } from "../lib/model.js";

const MACROS = [
  { key: "kcal", label: "カロリー (kcal)", color: C.accent },
  { key: "protein", label: "タンパク質 (g)", color: C.p },
  { key: "carb", label: "炭水化物 (g)", color: C.c },
  { key: "fat", label: "脂質 (g)", color: C.f },
  { key: "fiber", label: "食物繊維 (g)", color: C.fiber },
  { key: "salt", label: "食塩相当量 (g)", color: C.salt },
];

export default function AddMeal({ onClose, onSave, mymeals }) {
  const [meal, setMeal] = useState(emptyMeal);
  const [showMy, setShowMy] = useState(false);
  const photoRef = useRef();

  const setTotal = (k, v) => setMeal(m => ({ ...m, totals: { ...m.totals, [k]: v } }));

  function pickPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setMeal(m => ({ ...m, photo: ev.target.result }));
    r.readAsDataURL(f);
  }

  function useMyMeal(t) {
    setMeal(m => ({ ...m, name: t.name, totals: { ...t.totals }, items: (t.items || []).map(i => ({ ...i })), source: "mymeal" }));
    setShowMy(false);
  }

  function save() {
    if (!meal.name && !meal.totals.kcal && meal.items.length === 0) return;
    onSave(meal);
  }

  return (
    <Sheet onClose={onClose} title="食事を追加">
      {/* AI 分析（PRO・準備中） */}
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {["📸 写真でAI分析", "✍️ テキストでAI分析"].map(l => (
          <button key={l} disabled
            style={{ ...btnGhost(C.muted, { flex: 1, opacity: 0.55, cursor: "default", position: "relative" }) }}>
            {l}
            <span style={{ position: "absolute", top: -8, right: 8, fontSize: 9, fontWeight: 800, background: C.accent, color: "#fff", borderRadius: 6, padding: "2px 6px" }}>PRO 準備中</span>
          </button>
        ))}
      </div>

      {/* マイミール */}
      {mymeals?.length > 0 && (
        <div style={{ marginBottom: 14 }}>
          <button onClick={() => setShowMy(s => !s)} style={btnGhost(C.accent, { width: "100%" })}>
            ⭐ マイミールから選ぶ（{mymeals.length}件）{showMy ? "▲" : "▼"}
          </button>
          {showMy && mymeals.map(t => (
            <button key={t.id} onClick={() => useMyMeal(t)}
              style={{ ...card({ width: "100%", textAlign: "left", cursor: "pointer", marginTop: 8, padding: 12 }) }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{Math.round(mealTotals(t).kcal)} kcal</div>
            </button>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="時間"><input type="time" value={meal.time} style={inp()} onChange={e => setMeal(m => ({ ...m, time: e.target.value }))} /></Field>
        <Field label="食事名"><input type="text" placeholder="例: 鶏むね定食" value={meal.name} style={inp()} onChange={e => setMeal(m => ({ ...m, name: e.target.value }))} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        {MACROS.map(({ key, label, color }) => (
          <Field key={key} label={label} color={color}>
            <input type="number" inputMode="decimal" placeholder="0" value={meal.totals[key]} style={inp()} onChange={e => setTotal(key, e.target.value)} />
          </Field>
        ))}
      </div>

      <Field label="写真（任意）">
        <input type="file" accept="image/*" ref={photoRef} style={{ display: "none" }} onChange={pickPhoto} />
        {meal.photo
          ? <div><img src={meal.photo} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 180, objectFit: "cover" }} />
              <button onClick={() => setMeal(m => ({ ...m, photo: null }))} style={btnGhost(C.red, { marginTop: 6 })}>写真を削除</button></div>
          : <button onClick={() => photoRef.current.click()} style={btnGhost(C.muted, { width: "100%" })}>📷 写真を追加</button>}
      </Field>

      <button onClick={save} style={btn(C.accent, { width: "100%", marginTop: 8 })}>＋ この食事を記録する</button>
    </Sheet>
  );
}
