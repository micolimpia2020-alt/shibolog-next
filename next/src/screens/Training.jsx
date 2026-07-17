import { C, card, inp, btnGhost } from "../theme.js";
import { Field } from "../components/ui.jsx";
import WeekStrip from "../components/WeekStrip.jsx";
import { useState, useEffect } from "react";
import { parseKey, TRAINING_PARTS, oneRM, normalizeParts } from "../lib/model.js";
import { listDayDates, loadDayLean } from "../lib/storage.js";

const MAX_SETS = 5;

// 旧形式 {name,weight,reps,sets} → 新形式 {name, sets:[{weight,reps}]}
function normalizeExercise(ex) {
  if (Array.isArray(ex.sets)) return ex;
  const first = (ex.weight || ex.reps) ? [{ weight: ex.weight || "", reps: ex.reps || "" }] : [];
  return { name: ex.name || "", sets: first };
}

export default function Training({ date, setDate, day, mode, markedDates, updateDay, onPraise }) {
  const d = parseKey(date);
  // 過去の種目記録インデックス（前回記録の表示用）
  const [history, setHistory] = useState({});
  useEffect(() => {
    let alive = true;
    (async () => {
      const dates = (await listDayDates()).filter(k => k < date).sort().reverse().slice(0, 90);
      const idx = {};
      for (const k of dates) {
        const dd = await loadDayLean(k);
        for (const ex of dd?.training?.exercises || []) {
          const nm = (ex.name || "").trim();
          if (!nm || idx[nm]) continue;
          const sets = Array.isArray(ex.sets) ? ex.sets : [{ weight: ex.weight, reps: ex.reps }];
          const best = Math.max(...sets.map(s => oneRM(s.weight, s.reps) || 0), 0);
          const top = sets.find(s => (oneRM(s.weight, s.reps) || 0) === best);
          if (best > 0) idx[nm] = { date: k, best, weight: top?.weight, reps: top?.reps };
        }
      }
      if (alive) setHistory(idx);
    })();
    return () => { alive = false; };
  }, [date]);
  const tr = day?.training || { done: false, parts: [], cardio: 0, cardioKcal: 0, exercises: [] };
  const parts = normalizeParts(tr.parts);
  const exercises = (tr.exercises || []).map(normalizeExercise);
  const setTr = p => updateDay({ training: { ...tr, exercises, parts, ...p } });

  function toggleDone() {
    const done = !tr.done;
    setTr({ done });
    if (done) onPraise && onPraise("meal");
  }
  function togglePart(p) {
    setTr({ parts: parts.includes(p) ? parts.filter(x => x !== p) : [...parts, p], done: true });
  }
  function addExercise() {
    setTr({ exercises: [...exercises, { name: "", sets: [{ weight: "", reps: "" }] }] });
  }
  function setExName(i, name) {
    setTr({ exercises: exercises.map((e, j) => (j === i ? { ...e, name } : e)) });
  }
  function setSet(i, si, k, v) {
    setTr({ exercises: exercises.map((e, j) => (j === i ? { ...e, sets: e.sets.map((s, sj) => (sj === si ? { ...s, [k]: v } : s)) } : e)) });
  }
  function addSet(i) {
    setTr({ exercises: exercises.map((e, j) => (j === i && e.sets.length < MAX_SETS ? { ...e, sets: [...e.sets, { weight: "", reps: "" }] } : e)) });
  }
  function delSet(i, si) {
    setTr({ exercises: exercises.map((e, j) => (j === i ? { ...e, sets: e.sets.filter((_, sj) => sj !== si) } : e)) });
  }
  function delExercise(i) {
    setTr({ exercises: exercises.filter((_, j) => j !== i) });
  }

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 12 }}>
        トレーニング（{d.getMonth() + 1}月{d.getDate()}日）
      </div>
      <WeekStrip date={date} setDate={setDate} mode={mode} markedDates={markedDates} />

      <button onClick={toggleDone}
        style={{ width: "100%", padding: "16px", borderRadius: 16, cursor: "pointer", marginBottom: 12, fontSize: 15, fontWeight: 800, border: `2px solid ${tr.done ? mode.accent : C.border}`, background: tr.done ? mode.soft : "#fff", color: tr.done ? mode.accent : C.muted }}>
        {tr.done ? "💪 この日はトレーニングした！" : "この日はトレーニングした？（タップで記録）"}
      </button>

      {/* 部位（複数選択可） */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>部位（複数選択可）</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {TRAINING_PARTS.map(p => {
            const on = parts.includes(p);
            return (
              <button key={p} onClick={() => togglePart(p)}
                style={{ border: `1.5px solid ${on ? mode.accent : C.border}`, background: on ? mode.soft : "#fff", color: on ? mode.accent : C.muted, borderRadius: 20, padding: "7px 12px", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                {p}
              </button>
            );
          })}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 12 }}>
          <Field label="🏃 有酸素 (分)"><input type="number" inputMode="numeric" value={tr.cardio || ""} placeholder="0" style={inp()} onChange={e => setTr({ cardio: +e.target.value || 0 })} /></Field>
          <Field label="🔥 消費 (kcal)"><input type="number" inputMode="numeric" value={tr.cardioKcal || ""} placeholder="0" style={inp()} onChange={e => setTr({ cardioKcal: +e.target.value || 0 })} /></Field>
        </div>
      </div>

      {/* 当日の最高推定1RM */}
      {(() => {
        const best = Math.max(...exercises.flatMap(e => e.sets.map(s => oneRM(s.weight, s.reps) || 0)), 0);
        return best > 0 ? (
          <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 12, fontSize: 13, fontWeight: 700, color: C.text }}>
            🏆 今日の最高推定1RM: <b style={{ color: mode.accent, fontSize: 16 }}>{best}kg</b>
          </div>
        ) : null;
      })()}

      {/* 種目（セット×重量×回数×推定1RM） */}
      <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 8 }}>種目</div>
      {exercises.map((ex, i) => (
        <div key={i} style={card({ marginBottom: 10, padding: 12 })}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
            <input type="text" placeholder="種目名（例: ベンチプレス）" value={ex.name} style={inp({ flex: 1 })} onChange={e => setExName(i, e.target.value)} />
            <button onClick={() => delExercise(i)} style={{ border: "none", background: "none", color: C.red, cursor: "pointer", fontSize: 16 }}>🗑️</button>
          </div>
          {history[(ex.name || "").trim()] && (
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 6, background: C.dim, borderRadius: 8, padding: "5px 10px" }}>
              📅 前回（{history[(ex.name || "").trim()].date.slice(5).replace("-", "/")}）: {history[(ex.name || "").trim()].weight}kg × {history[(ex.name || "").trim()].reps}回 / 推定1RM <b style={{ color: mode.accent }}>{history[(ex.name || "").trim()].best}kg</b>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 64px 24px", gap: 6, alignItems: "center", fontSize: 11, color: C.muted, fontWeight: 700, marginBottom: 4 }}>
            <span>SET</span><span>重量 (kg)</span><span>回数</span><span style={{ textAlign: "center" }}>推定1RM</span><span />
          </div>
          {ex.sets.map((s, si) => {
            const rm = oneRM(s.weight, s.reps);
            return (
              <div key={si} style={{ display: "grid", gridTemplateColumns: "30px 1fr 1fr 64px 24px", gap: 6, alignItems: "center", marginBottom: 6 }}>
                <span style={{ width: 26, height: 26, lineHeight: "24px", textAlign: "center", borderRadius: "50%", border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 700, color: C.muted }}>{si + 1}</span>
                <input type="number" inputMode="decimal" placeholder="kg" value={s.weight} style={inp({ padding: "9px 10px" })} onChange={e => setSet(i, si, "weight", e.target.value)} />
                <input type="number" inputMode="numeric" placeholder="回" value={s.reps} style={inp({ padding: "9px 10px" })} onChange={e => setSet(i, si, "reps", e.target.value)} />
                <span style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: rm ? mode.accent : C.border }}>{rm ?? "—"}</span>
                <button onClick={() => delSet(i, si)} style={{ border: "none", background: "none", color: C.muted, cursor: "pointer", fontSize: 13 }}>✕</button>
              </div>
            );
          })}
          {ex.sets.length < MAX_SETS && (
            <button onClick={() => addSet(i)} style={btnGhost(C.muted, { width: "100%", padding: "8px", fontSize: 12, marginTop: 2 })}>
              ＋ セットを追加（{ex.sets.length}/{MAX_SETS}）
            </button>
          )}
          {(() => {
            const best = Math.max(...ex.sets.map(s => oneRM(s.weight, s.reps) || 0));
            return best > 0 ? <div style={{ fontSize: 11, color: C.muted, textAlign: "right", marginTop: 4 }}>この種目のベスト推定1RM: <b style={{ color: mode.accent }}>{best}kg</b>（O'Conner式）</div> : null;
          })()}
        </div>
      ))}
      <button onClick={addExercise} style={btnGhost(mode.accent, { width: "100%", marginBottom: 14 })}>＋ 種目を追加</button>

      <div style={{ ...card({ background: mode.soft, border: `1px solid ${mode.accent}44` }) }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: mode.accent }}>🔥 メニューに迷ったら</div>
        <div style={{ fontSize: 12, color: C.muted, marginTop: 4, lineHeight: 1.7 }}>
          下の「🔥提案」タブで、1ヶ月の分割と今日のメニューを自動生成できます。生成したメニューはこのページの記録に追加できます。
        </div>
      </div>
    </div>
  );
}
