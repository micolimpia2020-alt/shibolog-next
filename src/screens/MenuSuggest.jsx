import { useState } from "react";
import { C, card, btn, btnGhost } from "../theme.js";
import {
  GOALS, FOCUS_PARTS, PART_L, REP_LABEL, REP_COLORS,
  buildBase, getPool, mkSplit, pickExtra, getTag,
} from "../lib/trainingMenu.js";

const COUNTS = Array.from({ length: 25 }, (_, i) => i + 4); // 4〜28

function RepBadge({ rep }) {
  const bg = REP_COLORS[rep];
  return (
    <span style={{ fontSize: 10, fontWeight: 700, borderRadius: 6, padding: "2px 7px", border: `1px solid ${bg || C.border}`, background: bg ? bg + "33" : "transparent", color: bg ? "#5a5140" : C.muted }}>
      {REP_LABEL[rep]} rep
    </span>
  );
}

export default function MenuSuggest({ mode, onAddToTraining }) {
  const [scr, setScr] = useState("input"); // input | split | day
  const [count, setCount] = useState(12);
  const [goal, setGoal] = useState(null);
  const [f1, setF1] = useState(null);
  const [f2, setF2] = useState(null);
  const [vari, setVari] = useState("power");
  const [split, setSplit] = useState([]);
  const [selDay, setSelDay] = useState(null);
  const [menu, setMenu] = useState([]);

  const needFocus = goal === "fullbody_focus" || goal === "focus";
  const ok = goal && (!needFocus || f1);
  const weekPace = Math.round(count / 4.3 * 10) / 10;

  function clickPart(k) {
    if (f1 === k) { setF1(null); return; }
    if (f2 === k) { setF2(null); return; }
    if (!f1) { setF1(k); return; }
    if (!f2) setF2(k);
  }
  const gen = () => { setSplit(mkSplit(count, goal, f1, f2)); setScr("split"); };
  const openDay = i => { setSelDay(i); setMenu(buildBase(split[i].part, vari).map(e => ({ ...e, added: false }))); setScr("day"); };
  const reroll = () => setMenu(buildBase(split[selDay].part, vari).map(e => ({ ...e, added: false })));
  const swapOne = i => {
    const part = split[selDay].part;
    const usedIds = new Set(menu.map(e => e.id));
    const cand = getPool(part).filter(e => !usedIds.has(e.id));
    if (!cand.length) return;
    const nx = cand[Math.floor(Math.random() * cand.length)];
    setMenu(prev => prev.map((e, j) => (j === i ? { ...nx, added: e.added } : e)));
  };
  const addEx = () => {
    const usedIds = new Set(menu.map(e => e.id));
    const extra = pickExtra(getPool(split[selDay].part), usedIds, vari);
    if (extra) setMenu(prev => [...prev, { ...extra, added: true }]);
  };
  const canAdd = () => {
    const part = split[selDay]?.part;
    if (!part) return false;
    const usedIds = new Set(menu.map(e => e.id));
    return getPool(part).some(e => !usedIds.has(e.id));
  };

  const chip = (on, ex = {}) => ({ border: `1.5px solid ${on ? mode.accent : C.border}`, background: on ? mode.soft : "#fff", color: on ? mode.accent : C.text, borderRadius: 12, padding: "10px 8px", fontSize: 12, fontWeight: 700, cursor: "pointer", textAlign: "center", ...ex });

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 4 }}>
        {scr === "input" ? "🔥 メニュー提案" : scr === "split" ? "🔥 1ヶ月のスプリット" : "🔥 今日のメニュー"}
      </div>
      <div style={{ fontSize: 11, color: C.muted, marginBottom: 14, letterSpacing: "0.08em" }}>TRAINING MENU GENERATOR</div>

      {scr === "input" && (<>
        <div style={card({ marginBottom: 12 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>1ヶ月のトレーニング回数</div>
          <select value={count} onChange={e => setCount(+e.target.value)}
            style={{ width: "100%", padding: "11px 12px", border: `1px solid ${C.border}`, borderRadius: 10, fontSize: 15, color: C.text, background: "#fff" }}>
            {COUNTS.map(n => <option key={n} value={n}>{n}回（週あたり約{Math.round(n / 4.3 * 10) / 10}回）</option>)}
          </select>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 6 }}>週あたり約 <b style={{ color: mode.accent }}>{weekPace}回</b> のペースです</div>
        </div>

        <div style={card({ marginBottom: 12 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>目的</div>
          {GOALS.map(g => (
            <button key={g.k} onClick={() => { setGoal(g.k); if (g.k === "fullbody") { setF1(null); setF2(null); } }}
              style={{ display: "block", width: "100%", textAlign: "left", marginBottom: 8, padding: "12px 14px", borderRadius: 12, cursor: "pointer", border: `1.5px solid ${goal === g.k ? mode.accent : C.border}`, background: goal === g.k ? mode.soft : "#fff" }}>
              <span style={{ fontSize: 14, fontWeight: 800, color: goal === g.k ? mode.accent : C.text }}>{g.l}</span>
              <span style={{ display: "block", fontSize: 11, color: C.muted }}>{g.d}</span>
            </button>
          ))}
        </div>

        {needFocus && (
          <div style={card({ marginBottom: 12 })}>
            <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4 }}>{goal === "focus" ? "部位を選択（最大2つ）" : "強化部位（最大2つ）"}</div>
            <div style={{ fontSize: 11, color: C.muted, marginBottom: 8 }}>タップした順に ①優先 → ② になります</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
              {FOCUS_PARTS.map(p => {
                const badge = f1 === p.k ? "①" : f2 === p.k ? "②" : "";
                return (
                  <button key={p.k} onClick={() => clickPart(p.k)} style={chip(!!badge)}>
                    {badge && <b style={{ marginRight: 4 }}>{badge}</b>}{p.l}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <div style={card({ marginBottom: 14 })}>
          <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 8 }}>スタイル</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7 }}>
            <button onClick={() => setVari("power")} style={chip(vari === "power")}>パワー系<span style={{ display: "block", fontSize: 10, fontWeight: 400, color: C.muted }}>多関節 → 単関節</span></button>
            <button onClick={() => setVari("pump")} style={chip(vari === "pump")}>パンプ系<span style={{ display: "block", fontSize: 10, fontWeight: 400, color: C.muted }}>単関節 → 多関節</span></button>
          </div>
        </div>

        <button disabled={!ok} onClick={gen} style={btn(mode.accent, { width: "100%", opacity: ok ? 1 : 0.4 })}>
          1ヶ月の分割を生成する
        </button>
      </>)}

      {scr === "split" && (<>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>
          月{count}回 / 週あたり約{weekPace}回 {count <= 10 ? "・脚は統合" : "・脚は①②に分割"}／日をタップで今日のメニュー生成
        </div>
        {split.map((d, i) => (
          <button key={i} onClick={() => openDay(i)}
            style={{ ...card({ width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 6, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }) }}>
            <span style={{ width: 34, height: 34, lineHeight: "32px", textAlign: "center", borderRadius: "50%", border: `1.5px solid ${mode.accent}66`, background: mode.soft, fontSize: 12, fontWeight: 800, color: mode.accent }}>{d.dayNumber}</span>
            <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: C.text }}>{PART_L[d.part]}</span>
            {d.isFocus1 && <span style={{ fontSize: 10, fontWeight: 800, color: mode.accent }}>①強化</span>}
            {d.isFocus2 && <span style={{ fontSize: 10, fontWeight: 800, color: mode.accent }}>②強化</span>}
            <span style={{ color: C.muted }}>›</span>
          </button>
        ))}
        <button onClick={() => setScr("input")} style={btnGhost(C.muted, { width: "100%", marginTop: 8 })}>← 設定に戻る</button>
      </>)}

      {scr === "day" && split[selDay] && (<>
        <div style={{ background: mode.soft, border: `1px solid ${mode.accent}44`, borderRadius: 14, padding: "10px 14px", marginBottom: 12, fontSize: 14, fontWeight: 800, color: mode.accent }}>
          Day {split[selDay].dayNumber}：{PART_L[split[selDay].part]}（{vari === "power" ? "パワー系" : "パンプ系"}）
        </div>
        {menu.filter(Boolean).map((ex, i) => (
          <div key={ex.id + i} style={card({ marginBottom: 8, padding: "12px 14px", borderLeft: ex.added ? `3px solid ${mode.accent}` : undefined })}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{i + 1}. {ex.name}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: C.muted, fontWeight: 700 }}>{getTag(ex)}</span>
                  <RepBadge rep={ex.rep} />
                  <span style={{ fontSize: 10, color: C.muted }}>4〜5セット</span>
                </div>
              </div>
              <button onClick={() => swapOne(i)} title="入れ替え" style={{ border: `1px solid ${C.border}`, background: "#fff", borderRadius: 10, padding: "7px 10px", cursor: "pointer", fontSize: 13 }}>🔄</button>
            </div>
          </div>
        ))}
        <div style={{ fontSize: 12, color: C.muted, textAlign: "center", margin: "6px 0" }}>{menu.length}種目</div>
        <button disabled={!canAdd()} onClick={addEx} style={btnGhost(mode.accent, { width: "100%", marginBottom: 6, opacity: canAdd() ? 1 : 0.4 })}>＋ 種目を追加する</button>
        <button onClick={reroll} style={btnGhost(mode.accent, { width: "100%", marginBottom: 6 })}>🔀 種目をシャッフル</button>
        {onAddToTraining && (
          <button onClick={() => { onAddToTraining(menu.filter(Boolean), PART_L[split[selDay].part]); }}
            style={btn(mode.accent, { width: "100%", marginBottom: 6 })}>💪 今日のトレーニング記録へ追加</button>
        )}
        <button onClick={() => setScr("split")} style={btnGhost(C.muted, { width: "100%" })}>← スプリットに戻る</button>
      </>)}
    </div>
  );
}
