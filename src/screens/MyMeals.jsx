import { C, card, btnGhost } from "../theme.js";
import { mealTotals } from "../lib/model.js";

export default function MyMeals({ mymeals, onAddToToday, onRemove }) {
  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 6 }}>マイミール</div>
      <div style={{ fontSize: 13, color: C.muted, marginBottom: 14, lineHeight: 1.8 }}>
        いつもの食事を登録して、毎日の記録をもっと簡単に 🥗<br />
        （食事の詳細画面から「⭐ マイミールに登録」できます）
      </div>
      {(mymeals || []).length === 0 && (
        <div style={card({ textAlign: "center", color: C.muted, fontSize: 14, padding: "30px 16px" })}>
          まだマイミールがありません
        </div>
      )}
      {(mymeals || []).map(t => {
        const tt = mealTotals(t);
        return (
          <div key={t.id} style={card({ marginBottom: 10, display: "flex", alignItems: "center", gap: 12 })}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t.name || "（名称なし）"}</div>
              <div style={{ fontSize: 12, color: C.muted }}>
                {Math.round(tt.kcal)}kcal / P{Math.round(tt.protein)} C{Math.round(tt.carb)} F{Math.round(tt.fat)}
              </div>
            </div>
            <button onClick={() => onAddToToday(t)} style={btnGhost(C.accent)}>＋ 今日に追加</button>
            <button onClick={() => { if (window.confirm("削除しますか？")) onRemove(t.id); }}
              style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>🗑️</button>
          </div>
        );
      })}
    </div>
  );
}
