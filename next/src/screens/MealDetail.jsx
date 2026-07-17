import { useState } from "react";
import { C, card, inp, btn, btnGhost } from "../theme.js";
import { Sheet, Field, EstBadge } from "../components/ui.jsx";
import { mealTotals, scaleItem } from "../lib/model.js";

export default function MealDetail({ meal, onClose, onUpdate, onDelete, onSaveMyMeal }) {
  const [m, setM] = useState(meal);
  const t = mealTotals(m);
  const hasItems = (m.items || []).length > 0;

  const patch = p => setM(prev => ({ ...prev, ...p }));
  const setTotal = (k, v) => patch({ totals: { ...m.totals, [k]: v } });

  function changeGrams(idx, grams) {
    const items = m.items.map((it, i) => (i === idx ? scaleItem(it, grams) : it));
    patch({ items });
  }
  function removeItem(idx) {
    patch({ items: m.items.filter((_, i) => i !== idx) });
  }
  function addItem() {
    patch({ items: [...(m.items || []), { name: "", grams: 100, kcal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, salt: 0, estimated: false }] });
  }
  function setItem(idx, k, v) {
    patch({ items: m.items.map((it, i) => (i === idx ? { ...it, [k]: v } : it)) });
  }

  return (
    <Sheet onClose={onClose} title="食事の詳細">
      {m.photo && <img src={m.photo} alt="" style={{ width: "100%", borderRadius: 16, maxHeight: 240, objectFit: "cover", marginBottom: 12 }} />}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
        <Field label="時間"><input type="time" value={m.time} style={inp()} onChange={e => patch({ time: e.target.value })} /></Field>
        <Field label="食事名"><input type="text" value={m.name} style={inp()} onChange={e => patch({ name: e.target.value })} /></Field>
      </div>

      {/* 合計 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 26, fontWeight: 800, color: C.text, marginBottom: 8 }}>
          🔥 {Math.round(t.kcal)} <span style={{ fontSize: 14 }}>kcal</span>
          {m.estimated && <EstBadge />}
        </div>
        <div style={{ display: "flex", gap: 8, fontSize: 13, fontWeight: 700 }}>
          <span style={{ color: C.p }}>P {t.protein.toFixed(1)}g</span>
          <span style={{ color: C.c }}>C {t.carb.toFixed(1)}g</span>
          <span style={{ color: C.f }}>F {t.fat.toFixed(1)}g</span>
          <span style={{ color: C.fiber }}>繊維 {t.fiber.toFixed(1)}g</span>
          <span style={{ color: C.salt }}>塩 {t.salt.toFixed(1)}g</span>
        </div>
        {hasItems && <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>合計は食材詳細から自動計算されます</div>}
      </div>

      {/* 食材詳細 */}
      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, margin: "4px 0 8px" }}>食材詳細</div>
      {(m.items || []).map((it, i) => (
        <div key={i} style={card({ marginBottom: 8, padding: 12 })}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input type="text" placeholder="食材名" value={it.name} style={inp({ flex: 1 })} onChange={e => setItem(i, "name", e.target.value)} />
            <input type="number" inputMode="decimal" value={it.grams} style={inp({ width: 76 })} onChange={e => changeGrams(i, e.target.value)} />
            <span style={{ fontSize: 13, color: C.muted }}>g</span>
            <button onClick={() => removeItem(i)} style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>🗑️</button>
          </div>
          <div style={{ display: "flex", gap: 6, fontSize: 12, color: C.muted, flexWrap: "wrap" }}>
            <b style={{ color: C.text }}>{Math.round(it.kcal)}kcal</b>
            <span style={{ color: C.p }}>P{(+it.protein || 0).toFixed(1)}</span>
            <span style={{ color: C.c }}>C{(+it.carb || 0).toFixed(1)}</span>
            <span style={{ color: C.f }}>F{(+it.fat || 0).toFixed(1)}</span>
            {it.estimated && <EstBadge />}
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>量(g)を変えると栄養素も自動で再計算されます</div>
        </div>
      ))}
      <button onClick={addItem} style={btnGhost(C.accent, { width: "100%", marginBottom: 12 })}>＋ 食材を追加</button>

      {/* 合計を直接編集（食材なしのとき） */}
      {!hasItems && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          {[["kcal", "カロリー", C.accent], ["protein", "P (g)", C.p], ["carb", "C (g)", C.c], ["fat", "F (g)", C.f], ["fiber", "繊維 (g)", C.fiber], ["salt", "塩 (g)", C.salt]].map(([k, l, col]) => (
            <Field key={k} label={l} color={col}>
              <input type="number" inputMode="decimal" value={m.totals[k]} style={inp()} onChange={e => setTotal(k, e.target.value)} />
            </Field>
          ))}
        </div>
      )}

      <button onClick={() => onUpdate(m)} style={btn(C.accent, { width: "100%", marginBottom: 8 })}>保存する</button>
      <button onClick={() => onSaveMyMeal(m)} style={btnGhost(C.accent, { width: "100%", marginBottom: 8 })}>⭐ マイミールに登録</button>
      <button onClick={() => { if (window.confirm("この食事を削除しますか？")) onDelete(m.id); }} style={btnGhost(C.red, { width: "100%" })}>🗑️ この食事を削除</button>
    </Sheet>
  );
}
