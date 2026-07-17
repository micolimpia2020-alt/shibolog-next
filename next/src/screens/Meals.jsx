import { useState, useRef } from "react";
import { C, card, inp, btn, btnGhost } from "../theme.js";
import { EstBadge, Field } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { parseKey, dateKey, dayTotals, mealTotals, emptyMeal, pfcBalance, nowHM } from "../lib/model.js";
import { Sheet } from "../components/ui.jsx";
import { searchRecipes, sortByFit } from "../lib/recipes.js";
import { getDailyTargets } from "../lib/model.js";

const MACROS = [
  { key: "kcal", label: "カロリー (kcal)", color: C.accent },
  { key: "protein", label: "P タンパク質 (g)", color: C.p },
  { key: "fat", label: "F 脂質 (g)", color: C.f },
  { key: "carb", label: "C 炭水化物 (g)", color: C.c },
];

export default function Meals({ date, setDate, day, mode, markedDates, mymeals, profile, settings, updateDay, onOpenMeal, onAddMeal, onAddMyMealToToday, onRemoveMyMeal }) {
  const [form, setForm] = useState(emptyMeal);
  const [showMy, setShowMy] = useState(false);
  const [showRec, setShowRec] = useState(false);
  const [recQuery, setRecQuery] = useState("");
  const [recTag, setRecTag] = useState("");
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
              {(() => { const b = pfcBalance(t); return b ? (
                <div style={{ fontSize: 11, fontWeight: 700, marginTop: 2 }}>
                  <span style={{ color: C.p }}>P{b.pPct}%</span>
                  <span style={{ color: C.f }}> F{b.fPct}%</span>
                  <span style={{ color: C.c }}> C{b.cPct}%</span>
                </div>
              ) : null; })()}
            </div>
            <div style={{ color: C.muted }}>›</div>
          </button>
        );
      })}

      {/* 食事終了 */}
      {meals.length > 0 && (
        <button onClick={() => updateDay({ mealsDone: !day?.mealsDone })}
          style={btn(day?.mealsDone ? C.muted : mode.accent, { width: "100%", marginBottom: 10 })}>
          {day?.mealsDone ? "🔓 食事記録を再開する" : "🍽️ 食事終了（今日のまとめを見る）"}
        </button>
      )}
      {day?.mealsDone && (() => {
        const b = pfcBalance(totals);
        return (
          <div style={card({ marginBottom: 12, border: `1.5px solid ${mode.accent}66` })}>
            <div style={{ fontSize: 14, fontWeight: 800, color: mode.accent, marginBottom: 8 }}>📊 今日の食事まとめ</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: C.text, marginBottom: 8 }}>
              合計 {Math.round(totals.kcal)} <span style={{ fontSize: 13 }}>kcal</span>
            </div>
            {b && (<>
              <div style={{ display: "flex", textAlign: "center", marginBottom: 8 }}>
                {[["P タンパク質", b.pKcal, b.pPct, C.p], ["F 脂質", b.fKcal, b.fPct, C.f], ["C 炭水化物", b.cKcal, b.cPct, C.c]].map(([l, k, pct, col]) => (
                  <div key={l} style={{ flex: 1 }}>
                    <div style={{ fontSize: 11, color: col, fontWeight: 700 }}>{l}</div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: C.text }}>{k}<span style={{ fontSize: 10 }}>kcal</span></div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: col }}>{pct}%</div>
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", height: 10, borderRadius: 5, overflow: "hidden" }}>
                <div style={{ width: `${b.pPct}%`, background: C.p }} />
                <div style={{ width: `${b.fPct}%`, background: C.f }} />
                <div style={{ width: `${b.cPct}%`, background: C.c }} />
              </div>
            </>)}
          </div>
        );
      })()}

      {/* メニュー提案 */}
      <button onClick={() => setShowRec(true)}
        style={{ ...card({ width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 12, background: mode.soft, border: `1.5px solid ${mode.accent}66` }) }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: mode.accent }}>🍳 食事メニュー提案</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>残りカロリーに合うヘルシーメニューを食材から探せます →</div>
      </button>

      {showRec && (() => {
        const tg = getDailyTargets(profile, settings);
        const remain = Math.round(tg.kcal - totals.kcal);
        const list = sortByFit(searchRecipes(recQuery, recTag), remain);
        return (
          <Sheet onClose={() => setShowRec(false)} title="🍳 食事メニュー提案">
            <div style={{ background: mode.soft, borderRadius: 12, padding: "10px 14px", marginBottom: 10, fontSize: 13, fontWeight: 700, color: C.text }}>
              今日の残り: <b style={{ color: mode.accent }}>{remain}</b> kcal
            </div>
            <input type="text" placeholder="食材で検索（例: 鶏むね、卵、オートミール）" value={recQuery}
              onChange={e => setRecQuery(e.target.value)} style={inp({ marginBottom: 8 })} />
            <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
              {[["", "すべて"], ["home", "🏠 おうちごはん"], ["trainee", "💪 トレーニー"]].map(([k, l]) => (
                <button key={k} onClick={() => setRecTag(k)}
                  style={{ flex: 1, padding: "8px 4px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", border: `1.5px solid ${recTag === k ? mode.accent : C.border}`, background: recTag === k ? mode.soft : "#fff", color: recTag === k ? mode.accent : C.muted }}>{l}</button>
              ))}
            </div>
            {list.length === 0 && <div style={{ fontSize: 13, color: C.muted, textAlign: "center", padding: 16 }}>該当するメニューがありません</div>}
            {list.map(r => {
              const over = r.kcal > remain;
              return (
                <div key={r.id} style={card({ marginBottom: 10, padding: 14, opacity: over ? 0.75 : 1 })}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{r.name}</div>
                  <div style={{ fontSize: 12, color: mode.accent, fontWeight: 700, margin: "2px 0 4px" }}>💡 {r.point}</div>
                  <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>
                    <b style={{ color: over ? C.red : C.text }}>{r.kcal}kcal</b>
                    <span style={{ color: C.p }}> P{r.p}</span>
                    <span style={{ color: C.f }}> F{r.f}</span>
                    <span style={{ color: C.c }}> C{r.c}</span>
                    {over && <span style={{ color: C.red, fontWeight: 700 }}>（残りオーバー）</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.text, marginBottom: 4 }}>{r.ingredients.join("・")}</div>
                  {r.steps.map((s, i) => <div key={i} style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>{i + 1}. {s}</div>)}
                  <button onClick={() => {
                    onAddMeal({ ...emptyMeal(), id: "m_" + Date.now().toString(36), time: nowHM(), name: r.name,
                      totals: { kcal: String(r.kcal), protein: String(r.p), fat: String(r.f), carb: String(r.c), fiber: "", salt: "" } });
                    setShowRec(false);
                  }} style={btn(mode.accent, { width: "100%", marginTop: 8, padding: "10px" })}>＋ この食事を記録する</button>
                </div>
              );
            })}
          </Sheet>
        );
      })()}

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
