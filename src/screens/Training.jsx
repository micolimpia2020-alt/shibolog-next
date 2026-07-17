import { C, card, inp, btnGhost } from "../theme.js";
import { Field } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { parseKey } from "../lib/model.js";

export default function Training({ date, setDate, day, mode, markedDates, updateDay, onPraise }) {
  const d = parseKey(date);
  const tr = day?.training || { done: false, parts: "", cardio: 0, cardioKcal: 0, exercises: [] };
  const setTr = p => updateDay({ training: { ...tr, ...p } });

  function toggleDone() {
    const done = !tr.done;
    setTr({ done });
    if (done) onPraise && onPraise("meal");
  }
  function addExercise() {
    setTr({ exercises: [...(tr.exercises || []), { name: "", weight: "", reps: "", sets: "" }] });
  }
  function setEx(i, k, v) {
    setTr({ exercises: tr.exercises.map((e, j) => (j === i ? { ...e, [k]: v } : e)) });
  }
  function delEx(i) {
    setTr({ exercises: tr.exercises.filter((_, j) => j !== i) });
  }

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>
        トレーニング（{d.getMonth() + 1}月{d.getDate()}日）
      </div>
      <WeekStrip date={date} setDate={setDate} mode={mode} markedDates={markedDates} />

      <button onClick={toggleDone}
        style={{ width: "100%", padding: "16px", borderRadius: 16, cursor: "pointer", marginBottom: 12, fontSize: 15, fontWeight: 800, border: `2px solid ${tr.done ? mode.accent : C.border}`, background: tr.done ? mode.soft : "#fff", color: tr.done ? mode.accent : C.muted }}>
        {tr.done ? "💪 今日はトレーニングした！" : "今日はトレーニングした？（タップで記録）"}
      </button>

      <div style={card({ marginBottom: 12 })}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          <Field label="部位"><input type="text" placeholder="胸・背中など" value={tr.parts || ""} style={inp()} onChange={e => setTr({ parts: e.target.value })} /></Field>
          <Field label="有酸素 (分)"><input type="number" inputMode="numeric" value={tr.cardio || ""} style={inp()} onChange={e => setTr({ cardio: +e.target.value || 0 })} /></Field>
          <Field label="消費 (kcal)"><input type="number" inputMode="numeric" value={tr.cardioKcal || ""} style={inp()} onChange={e => setTr({ cardioKcal: +e.target.value || 0 })} /></Field>
        </div>
      </div>

      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>種目メモ</div>
      {(tr.exercises || []).map((ex, i) => (
        <div key={i} style={card({ marginBottom: 8, padding: 12 })}>
          <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input type="text" placeholder="種目名" value={ex.name} style={inp({ flex: 2 })} onChange={e => setEx(i, "name", e.target.value)} />
            <input type="text" placeholder="kg" value={ex.weight} style={inp({ width: 56 })} onChange={e => setEx(i, "weight", e.target.value)} />
            <input type="text" placeholder="回" value={ex.reps} style={inp({ width: 48 })} onChange={e => setEx(i, "reps", e.target.value)} />
            <input type="text" placeholder="set" value={ex.sets} style={inp({ width: 48 })} onChange={e => setEx(i, "sets", e.target.value)} />
            <button onClick={() => delEx(i)} style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 15 }}>🗑️</button>
          </div>
        </div>
      ))}
      <button onClick={addExercise} style={btnGhost(mode.accent, { width: "100%", marginBottom: 14 })}>＋ 種目を追加</button>

      <div style={{ ...card({ background: mode.soft, border: `1px dashed ${mode.accent}66` }) }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: mode.accent }}>🏋️ トレーニングメニュー提案 <span style={{ fontSize: 9, background: mode.accent, color: "#fff", borderRadius: 6, padding: "2px 6px", marginLeft: 4 }}>PRO 準備中</span></div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.7 }}>
          記録した部位・頻度から、次のトレーニングメニューを提案する機能を準備中です。
        </div>
      </div>
    </div>
  );
}
