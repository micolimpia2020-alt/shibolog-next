import { C, card } from "../theme.js";
import { Ring } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { parseKey, dateKey, dayTotals, calcStreak } from "../lib/model.js";

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

export default function Home({ date, setDate, day, settings, mode, markedDates }) {
  const totals = dayTotals(day);
  const remainKcal = Math.round((settings.targetKcal || 0) - totals.kcal);
  const d = parseKey(date);
  const today = dateKey();
  const streak = calcStreak(markedDates);
  const daysToGoal = settings.goalDate
    ? Math.ceil((parseKey(settings.goalDate) - parseKey(today)) / 86400000)
    : null;

  return (
    <div style={{ padding: "16px 16px 120px" }}>
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

      {daysToGoal != null && daysToGoal >= 0 && (
        <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
            {mode.icon} {settings.goalLabel || "目標日"}まで
          </span>
          <span style={{ fontSize: 18, fontWeight: 800, color: mode.accent }}>あと{daysToGoal}日</span>
        </div>
      )}

      <WeekStrip date={date} setDate={setDate} mode={mode} markedDates={markedDates} />

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

      <div style={card({ display: "flex", gap: 8, textAlign: "center", padding: 12 })}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{(day?.meals || []).length}</div>
          <div style={{ fontSize: 11, color: C.muted }}>🍽️ 食事</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{day?.body?.morning != null ? day.body.morning : "—"}</div>
          <div style={{ fontSize: 11, color: C.muted }}>⚖️ 朝体重</div>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: day?.training?.done ? mode.accent : C.muted }}>{day?.training?.done ? "済" : "—"}</div>
          <div style={{ fontSize: 11, color: C.muted }}>💪 トレ</div>
        </div>
      </div>
    </div>
  );
}
