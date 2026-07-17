import { useState } from "react";
import { C, card, btnGhost } from "../theme.js";
import { EstBadge } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { parseKey, dateKey, dayTotals, mealTotals } from "../lib/model.js";

export default function Meals({ date, setDate, day, mode, markedDates, mymeals, onOpenMeal, onAddMyMealToToday, onRemoveMyMeal }) {
  const [showMy, setShowMy] = useState(false);
  const d = parseKey(date);
  const totals = dayTotals(day);
  const meals = [...(day?.meals || [])].sort((a, b) => (a.time || "").localeCompare(b.time || ""));

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>
        食事{date === dateKey() ? "（今日）" : `（${d.getMonth() + 1}月${d.getDate()}日）`}
      </div>
      <WeekStrip date={date} setDate={setDate} mode={mode} markedDates={markedDates} />

      <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 14, display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 700, color: C.text }}>
        <span>合計 <b>{Math.round(totals.kcal)}</b> kcal</span>
        <span><span style={{ color: C.p }}>🍗{Math.round(totals.protein)}</span> <span style={{ color: C.c }}>🍚{Math.round(totals.carb)}</span> <span style={{ color: C.f }}>🥑{Math.round(totals.fat)}</span></span>
      </div>

      {/* マイミール（集約） */}
      <button onClick={() => setShowMy(s => !s)} style={btnGhost(mode.accent, { width: "100%", marginBottom: 10 })}>
        ⭐ マイミール（{(mymeals || []).length}件）{showMy ? "▲ 閉じる" : "▼ 開く"}
      </button>
      {showMy && (
        <div style={{ marginBottom: 14 }}>
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
                  <div style={{ fontSize: 11, color: C.muted }}>{Math.round(tt.kcal)}kcal / 🍗{Math.round(tt.protein)} 🍚{Math.round(tt.carb)} 🥑{Math.round(tt.fat)}</div>
                </div>
                <button onClick={() => onAddMyMealToToday(t)} style={btnGhost(mode.accent, { padding: "8px 10px", fontSize: 12 })}>＋ 追加</button>
                <button onClick={() => { if (window.confirm("削除しますか？")) onRemoveMyMeal(t.id); }}
                  style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 15 }}>🗑️</button>
              </div>
            );
          })}
        </div>
      )}

      {/* 食事リスト */}
      {meals.length === 0 ? (
        <div style={card({ textAlign: "center", padding: "28px 16px", color: C.muted, fontSize: 14, lineHeight: 1.9 })}>
          ＋ をタップして食事を追加しよう ☕
        </div>
      ) : (
        meals.map(m => {
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
                  <span style={{ color: C.p }}> 🍗{Math.round(t.protein)}</span>
                  <span style={{ color: C.c }}> 🍚{Math.round(t.carb)}</span>
                  <span style={{ color: C.f }}> 🥑{Math.round(t.fat)}</span>
                </div>
              </div>
              <div style={{ color: C.muted }}>›</div>
            </button>
          );
        })
      )}

      {/* ヤセメシ（準備中） */}
      <div style={{ ...card({ marginTop: 14, background: mode.soft, border: `1px dashed ${mode.accent}66` }) }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: mode.accent }}>🥗 ヤセメシ提案 <span style={{ fontSize: 9, background: mode.accent, color: "#fff", borderRadius: 6, padding: "2px 6px", marginLeft: 4 }}>PRO 準備中</span></div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.7 }}>
          残りカロリー・PFCに合う次の一食を、手持ちの食材から提案する機能を準備中です。
        </div>
      </div>
    </div>
  );
}
