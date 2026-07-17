import { useState, useRef } from "react";
import { C, card, inp, btn, btnGhost } from "../theme.js";
import { EstBadge, Field } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { parseKey, dateKey, dayTotals, mealTotals, emptyMeal } from "../lib/model.js";

const MACROS = [
  { key: "kcal", label: "カロリー (kcal)", color: C.accent },
  { key: "protein", label: "P タンパク質 (g)", color: C.p },
  { key: "fat", label: "F 脂質 (g)", color: C.f },
  { key: "carb", label: "C 炭水化物 (g)", color: C.c },
];

export default function Meals({ date, setDate, day, mode, markedDates, mymeals, updateDay, onOpenMeal, onAddMyMealToToday, onRemoveMyMeal, onAddMeal }) {
  const [form, setForm] = useState(emptyMeal);
  const [showMy, setShowMy] = useState(false);
  const photoRef = useRef();
  const d = parseKey(date);
  const totals = dayTotals(day);
  const meals = [...(day?.meals || [])].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  const setTotal = (k, v) => setForm(m => ({ ...m, totals: { ...m.totals, [k]: v } }));
  function pickPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader();
    r.onload = ev => setForm(m => ({ ...m, photo: ev.target.result }));
    r.readAsDataURL(f);
    e.target.value = "";
  }
  function save() {
    if (!form.name && !form.totals.kcal) return;
    onAddMeal({ ...form, id: "m_" + Date.now().toString(36) });
    setForm(emptyMeal());
  }

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>
        食事{date === dateKey() ? "（今日）" : `（${d.getMonth() + 1}月${d.getDate()}日）`}
      </div>
      <WeekStrip date={date} setDate={setDate} mode={mode} markedDates={markedDates} />

      {/* マイミール */}
      <button onClick={() => setShowMy(s => !s)} style={btnGhost(mode.accent, { width: "100%", marginBottom: 10 })}>
        ⭐ マイミール（{(mymeals || []).length}件）{showMy ? "▲ 閉じる" : "▼ 開く"}
      </button>
      {showMy && (
        <div style={{ marginBottom: 12 }}>
          {(mymeals || []).length === 0 && (
            <div style={card({ color: C.muted, fontSize: 12, padding: 12, marginBottom: 8 })}>
              食事の詳細画面から「⭐ マイミールに登録」すると、いつもの食事を1タップで記録できます。
            </div>
          )}
          {(mymeals || []).map(t => {
            const tt = mealTotals(t);
            return (
              <div key={t.id} style={card({ marginBottom: 8, padding: 12, display: "flex", alignItems: "center", gap: 10 })}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{t.name || "（名称なし）"}</div>
                  <div style={{ fontSize: 11, color: C.muted }}>{Math.round(tt.kcal)}kcal / P{Math.round(tt.protein)} F{Math.round(tt.fat)} C{Math.round(tt.carb)}</div>
                </div>
                <button onClick={() => onAddMyMealToToday(t)} style={btnGhost(mode.accent, { padding: "8px 10px", fontSize: 12 })}>＋ 追加</button>
                <button onClick={() => { if (window.confirm("削除しますか？")) onRemoveMyMeal(t.id); }}
                  style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 15 }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 食事を追加（インライン入力） */}
      <div style={card({ marginBottom: 14 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: mode.accent, marginBottom: 10 }}>➕ 食事を追加</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="時間"><input type="time" value={form.time} style={inp()} onChange={e => setForm(m => ({ ...m, time: e.target.value }))} /></Field>
          <Field label="食事名"><input type="text" placeholder="例: 鶏むね定食" value={form.name} style={inp()} onChange={e => setForm(m => ({ ...m, name: e.target.value }))} /></Field>
          {MACROS.map(({ key, label, color }) => (
            <Field key={key} label={label} color={color}>
              <input type="number" inputMode="decimal" placeholder="0" value={form.totals[key]} style={inp()} onChange={e => setTotal(key, e.target.value)} />
            </Field>
          ))}
        </div>
        <input type="file" accept="image/*" ref={photoRef} style={{ display: "none" }} onChange={pickPhoto} />
        {form.photo
          ? <div style={{ marginBottom: 8 }}><img src={form.photo} alt="" style={{ width: "100%", borderRadius: 12, maxHeight: 180, objectFit: "cover" }} />
              <button onClick={() => setForm(m => ({ ...m, photo: null }))} style={btnGhost(C.red, { marginTop: 6 })}>写真を削除</button></div>
          : <button onClick={() => photoRef.current.click()} style={btnGhost(C.muted, { width: "100%", marginBottom: 8 })}>📷 写真を追加（端末保存のみ）</button>}
        <button onClick={save} style={btn(mode.accent, { width: "100%" })}>＋ この食事を記録する</button>
      </div>

      {/* 当日合計 */}
      {meals.length > 0 && (
        <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.text }}>
          <span>合計 <b>{Math.round(totals.kcal)}</b> kcal</span>
          <span><span style={{ color: C.p }}>P{Math.round(totals.protein)}</span> <span style={{ color: C.f }}>F{Math.round(totals.fat)}</span> <span style={{ color: C.c }}>C{Math.round(totals.carb)}</span></span>
        </div>
      )}

      {/* 食事一覧 */}
      {meals.map(m => {
        const t = mealTotals(m);
        return (
          <button key={m.id} onClick={() => onOpenMeal(m.id)}
            style={{ ...card({ width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 10, display: "flex", gap: 12, alignItems: "center" }) }}>
            {m.photo
              ? <img src={m.photo} alt="" style={{ width: 56, height: 56, borderRadius: 12, objectFit: "cover", flexShrink: 0 }} />
              : <div style={{ width: 56, height: 56, borderRadius: 12, background: mode.soft, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>🍽️</div>}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: C.muted }}>{m.time}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {m.name || "（名称なし）"}{m.estimated && <EstBadge />}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
                <b style={{ color: C.text }}>{Math.round(t.kcal)}kcal</b>
                <span style={{ color: C.p }}> P{Math.round(t.protein)}</span>
                <span style={{ color: C.f }}> F{Math.round(t.fat)}</span>
                <span style={{ color: C.c }}> C{Math.round(t.carb)}</span>
              </div>
            </div>
            <div style={{ color: C.muted }}>›</div>
          </button>
        );
      })}

      {/* 本日のメモ */}
      <div style={card({ marginTop: 4 })}>
        <Field label="📝 本日のメモ">
          <textarea rows={2} value={day?.note || ""} style={inp({ resize: "vertical", fontFamily: "inherit" })}
            onChange={e => updateDay({ note: e.target.value })} placeholder="食事の気づきなど" />
        </Field>
      </div>
    </div>
  );
}
