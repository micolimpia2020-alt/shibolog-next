// しぼログNEXT テーマ
// ベース: ライトグレー×クリーム / モードでアクセント色が変わる
export const C = {
  bg: "#f7f6f3", card: "#ffffff", border: "#e9e5df",
  text: "#4a463f", muted: "#a5a099", dim: "#efece7",
  pink: "#d493a6", blue: "#8fb4cc", gold: "#c9a84c",
  p: "#d4808f", c: "#c2a35c", f: "#7fa3c4",
  pSoft: "#faeef0", cSoft: "#f7f1e2", fSoft: "#eaf1f6",
  green: "#8fae8d", red: "#c47b7b", fiber: "#8fae8d", salt: "#c99a55",
  fiberSoft: "#edf3ec", saltSoft: "#f8f0e4",
  accent: "#d493a6",
};

// モード: 記録の目的で色と目標計算が変わる（しぼログらしさの核）
export const MODES = {
  diet:    { id: "diet",    label: "ダイエット", icon: "🌸", accent: "#d493a6", soft: "#f9edf1", desc: "ゆるやかに絞る（-500kcal）", deficit: 500 },
  trainee: { id: "trainee", label: "トレーニー", icon: "💪", accent: "#7fa3c4", soft: "#eaf1f6", desc: "筋肉を残して絞る（-300kcal・高タンパク）", deficit: 300 },
  contest: { id: "contest", label: "コンテスト", icon: "👑", accent: "#c9a84c", soft: "#f7f1dd", desc: "大会に向けて仕上げる（-700kcal）", deficit: 700 },
};
export const getMode = id => MODES[id] || MODES.diet;

export const card = (ex = {}) => ({ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, padding: 16, boxShadow: "0 1px 4px rgba(74,70,63,0.05)", ...ex });
export const inp = (ex = {}) => ({ width: "100%", boxSizing: "border-box", padding: "11px 12px", background: "#fff", border: `1px solid ${C.border}`, borderRadius: 10, color: C.text, fontSize: 15, outline: "none", ...ex });
export const btn = (bg = C.accent, ex = {}) => ({ border: "none", borderRadius: 12, cursor: "pointer", fontWeight: 700, color: "#fff", background: bg, padding: "12px 16px", fontSize: 14, ...ex });
export const btnGhost = (color = C.muted, ex = {}) => ({ border: `1px solid ${C.border}`, borderRadius: 12, cursor: "pointer", fontWeight: 600, color, background: "transparent", padding: "10px 14px", fontSize: 13, ...ex });
