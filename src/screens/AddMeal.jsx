import { useState, useRef } from "react";
import { C, card, inp, btn, btnGhost } from "../theme.js";
import { Sheet, Field } from "../components/ui.jsx";
import { emptyMeal, mealTotals } from "../lib/model.js";
import { analyzeMeal, resizeImage } from "../lib/ai.js";

const MACROS = [
  { key: "kcal", label: "カロリー (kcal)", color: C.accent },
  { key: "protein", label: "タンパク質 (g)", color: C.p },
  { key: "carb", label: "炭水化物 (g)", color: C.c },
  { key: "fat", label: "脂質 (g)", color: C.f },
  { key: "fiber", label: "食物繊維 (g)", color: C.fiber },
  { key: "salt", label: "食塩相当量 (g)", color: C.salt },
];

export default function AddMeal({ onClose, onSave, mymeals, mode }) {
  const [meal, setMeal] = useState(emptyMeal);
  const [showMy, setShowMy] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiText, setAiText] = useState("");
  const [showAiText, setShowAiText] = useState(false);
  const photoRef = useRef();
  const aiPhotoRef = useRef();

  function applyAiResult(r, extra = {}) {
    setMeal(m => ({
      ...m,
      name: r.name || m.name,
      items: (r.items || []).map(i => ({ ...i, estimated: true })),
      estimated: true,
      ...extra,
    }));
  }

  async function aiPhoto(e) {
    const f = e.target.files?.[0]; if (!f) return;
    e.target.value = "";
    try {
      setAiBusy(true);
      const dataUrl = await new Promise((ok, ng) => {
        const r = new FileReader(); r.onload = ev => ok(ev.target.result); r.onerror = ng; r.readAsDataURL(f);
      });
      const small = await resizeImage(dataUrl, 1024);
      const result = await analyzeMeal({ image: small, note: meal.userNote });
      applyAiResult(result, { photo: small, source: "ai_photo" });
    } catch (err) {
      alert(err.message + "\n手動入力で記録できます。");
    } finally { setAiBusy(false); }
  }

  async function aiFromText() {
    if (!aiText.trim()) return;
    try {
      setAiBusy(true);
      const result = await analyzeMeal({ text: aiText });
      applyAiResult(result, { source: "ai_text" });
      setShowAiText(false);
    } catch (err) {
      alert(err.message + "\n手動入力で記録できます。");
    } finally { setAiBusy(false); }
  }

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
    if (!meal.name && !meal.totals.kcal && (meal.items || []).length === 0) return;
    onSave(meal);
  }

  return (
    <Sheet onClose={onClose} title="食事を追加">
      {/* AI 分析（PRO・準備中） */}
      <input type="file" accept="image/*" capture="environment" ref={aiPhotoRef} style={{ display: "none" }} onChange={aiPhoto} />
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button onClick={() => aiPhotoRef.current.click()} disabled={aiBusy}
          style={{ ...btnGhost(mode?.accent || C.accent, { flex: 1, borderColor: `${mode?.accent || C.accent}66`, opacity: aiBusy ? 0.5 : 1 }) }}>
          📸 写真でAI分析
        </button>
        <button onClick={() => setShowAiText(s => !s)} disabled={aiBusy}
          style={{ ...btnGhost(mode?.accent || C.accent, { flex: 1, borderColor: `${mode?.accent || C.accent}66`, opacity: aiBusy ? 0.5 : 1 }) }}>
          ✍️ テキストでAI分析
        </button>
      </div>
      {showAiText && (
        <div style={{ marginBottom: 10 }}>
          <textarea rows={2} placeholder="例: コンビニのサラダチキンとおにぎり1個、みそ汁"
            value={aiText} onChange={e => setAiText(e.target.value)} style={inp({ resize: "vertical", fontFamily: "inherit" })} />
          <button onClick={aiFromText} disabled={aiBusy} style={btn(mode?.accent || C.accent, { width: "100%", marginTop: 6, opacity: aiBusy ? 0.5 : 1 })}>
            {aiBusy ? "分析中…" : "この内容でAI分析する"}
          </button>
        </div>
      )}
      {aiBusy && (
        <div style={{ textAlign: "center", fontSize: 13, color: C.muted, marginBottom: 10 }}>
          🤖 AIが食事を分析しています…（数秒かかります）
        </div>
      )}
      {meal.estimated && (meal.items || []).length > 0 && (
        <div style={{ background: "#fff", border: `1px solid ${mode?.accent || C.accent}44`, borderRadius: 12, padding: 12, marginBottom: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: mode?.accent || C.accent, marginBottom: 6 }}>AI推定結果（保存後に詳細画面で修正できます）</div>
          {(meal.items || []).map((it, i) => (
            <div key={i} style={{ fontSize: 12, color: C.text, display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
              <span>{it.name} {it.grams}g</span><span style={{ color: C.muted }}>{Math.round(it.kcal)}kcal</span>
            </div>
          ))}
          <div style={{ fontSize: 12, fontWeight: 800, color: C.text, marginTop: 4, textAlign: "right" }}>
            合計 {Math.round(mealTotals(meal).kcal)} kcal
          </div>
        </div>
      )}

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

      <button onClick={save} style={btn(mode?.accent || C.accent, { width: "100%", marginTop: 8 })}>＋ この食事を記録する</button>
    </Sheet>
  );
}
