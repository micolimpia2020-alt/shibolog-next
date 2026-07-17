import { C, card } from "../theme.js";
import { Ring, EstBadge } from "../components/ui.jsx";
import { WD, weekOf, parseKey, dateKey, dayTotals, mealTotals, calcStreak } from "../lib/model.js";

function MacroCard({ icon, label, remain, color, soft }) {
  return (
    <div style={{ flex: 1, background: soft, border: `1px solid ${C.border}`, borderRadius: 16, padding: "12px 6px", textAlign: "center" }}>
      <div style={{ fontSize: 18 }}>{icon}</div>
      <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>残り</div>
      <div style={{ fontSize: 21, fontWeight: 800, color: C.text }}>
        {remain}<span style={{ fontSize: 11, fontWeight: 600 }}>g</span>
      </div>
      <div style={{ fontSize: 12, color, fontWeight: 700 }}>{label}</div>
    </div>
  );
}

export default function Home({ date, setDate, day, settings, mode, markedDates, onOpenMeal }) {
  const totals = dayTotals(day);
  const remainKcal = Math.round((settings.targetKcal || 0) - totals.kcal);
  const d = parseKey(date);
  const today = dateKey();
  const week = weekOf(date);
  const meals = [...(day?.meals || [])].sort((a, b) => (a.time || "").localeCompare(b.time || ""));
  const streak = calcStreak(markedDates);
  const daysToGoal = settings.goalDate
    ? Math.ceil((parseKey(settings.goalDate) - parseKey(today)) / 86400000)
    : null;

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      {/* ブランドヘッダー + モードチップ */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <div style={{ fontSize: 20, fontWeight: 800, color: C.text }}>
          {d.getFullYear()}年{d.getMonth() + 1}月
        </div>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          {streak > 0 && (
            <div style={{ fontSize: 12, fontWeight: 800, color: "#c47b4b", background: "#f9efe6", border: `1px solid ${C.border}`, borderRadius: 20, padding: "5px 10px" }}>
              🔥 {streak}日連続
            </div>
          )}
          <div style={{ fontSize: 12, fontWeight: 800, color: mode.accent, background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 20, padding: "5px 10px" }}>
            {mode.icon} {mode.label}
          </div>
        </div>
      </div>

      {/* 目標日カウントダウン */}
      {daysToGoal != null && daysToGoal >= 0 && (
        <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {mode.icon} {settings.goalLabel || "目標日"}まで
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: mode.accent }}>あと{daysToGoal}日</span>
        </div>
      )}

      {/* 週カレンダー */}
      <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
        {week.map((k, i) => {
          const sel = k === date;
          const isToday = k === today;
          return (
            <button key={k} onClick={() => setDate(k)}
              style={{ flex: 1, border: "none", cursor: "pointer", background: sel ? C.card : "transparent", borderRadius: 12, padding: "8px 0", boxShadow: sel ? "0 1px 4px rgba(74,70,63,0.1)" : "none" }}>
              <div style={{ fontSize: 11, color: C.muted }}>{WD[i]}</div>
              <div style={{
                margin: "4px auto 0", width: 32, height: 32, lineHeight: "30px", borderRadius: "50%",
                border: `1.5px solid ${sel ? mode.accent : C.border}`, fontWeight: isToday ? 800 : 600,
                color: C.text, background: markedDates?.has(k) ? `${mode.accent}26` : "transparent", fontSize: 14,
              }}>{parseKey(k).getDate()}</div>
            </button>
          );
        })}
      </div>

      {/* 残りカロリーリング（モード色） */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
        <Ring size={190} stroke={13} ratio={(settings.targetKcal || 1) > 0 ? totals.kcal / settings.targetKcal : 0}
          color={remainKcal >= 0 ? mode.accent : C.red}>
          <div style={{ fontSize: 13, color: C.muted }}>残り</div>
          <div style={{ fontSize: 40, fontWeight: 800, color: remainKcal >= 0 ? C.text : C.red }}>{remainKcal}</div>
          <div style={{ fontSize: 12, color: C.muted }}>kcal</div>
        </Ring>
      </div>
      <div style={{ textAlign: "right", fontSize: 12, color: C.muted, marginBottom: 14 }}>
        <b style={{ color: C.text, fontSize: 14 }}>{Math.round(totals.kcal)}</b>/{settings.targetKcal} 摂取したカロリー
      </div>

      {/* PFC 残量（色分け+アイコン） */}
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <MacroCard icon="🍗" label="タンパク質" color={C.p} soft={C.pSoft} remain={Math.round((settings.targetP || 0) - totals.protein)} />
        <MacroCard icon="🍚" label="炭水化物" color={C.c} soft={C.cSoft} remain={Math.round((settings.targetC || 0) - totals.carb)} />
        <MacroCard icon="🥑" label="脂質" color={C.f} soft={C.fSoft} remain={Math.round((settings.targetF || 0) - totals.fat)} />
      </div>
      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        <div style={{ flex: 1, background: C.fiberSoft, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.fiber, fontWeight: 700 }}>🥬 食物繊維</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{totals.fiber.toFixed(1)} g</span>
        </div>
        <div style={{ flex: 1, background: C.saltSoft, border: `1px solid ${C.border}`, borderRadius: 14, padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 12, color: C.salt, fontWeight: 700 }}>🧂 食塩相当量</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>{totals.salt.toFixed(1)} g</span>
        </div>
      </div>

      {/* 食事リスト */}
      <div style={{ fontSize: 17, fontWeight: 800, color: C.text, marginBottom: 10 }}>
        {date === today ? "今日" : ""}（{d.getMonth() + 1}月{d.getDate()}日）
      </div>

      {meals.length === 0 ? (
        <div style={card({ textAlign: "center", padding: "28px 16px", color: C.muted, fontSize: 14, lineHeight: 1.9 })}>
          ＋ をタップして食事を追加し<br />1日の記録を始めよう ☕<br />
          <span style={{ fontSize: 12 }}>記録するだけで、体は変わり始める。</span>
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
    </div>
  );
}
