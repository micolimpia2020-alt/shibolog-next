// 日付ユーティリティ・レコード生成・栄養計算

export function dateKey(d = new Date()) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, "0"), dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}
export function parseKey(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(key, n) {
  const d = parseKey(key); d.setDate(d.getDate() + n); return dateKey(d);
}
export const WD = ["日", "月", "火", "水", "木", "金", "土"];

// 選択日を含む週（日曜はじまり）の7日分キー
export function weekOf(key) {
  const d = parseKey(key);
  const start = new Date(d); start.setDate(d.getDate() - d.getDay());
  return Array.from({ length: 7 }, (_, i) => { const x = new Date(start); x.setDate(start.getDate() + i); return dateKey(x); });
}

export function nowHM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export const CONDITION_ITEMS = [
  { key: "appetite", label: "食欲" },
  { key: "sleep",    label: "睡眠の質" },
  { key: "bowel",    label: "お通じ" },
  { key: "fatigue",  label: "疲労感" },
  { key: "stress",   label: "ストレス" },
  { key: "edema",    label: "むくみ" },
];

export function emptyDay(date) {
  return {
    date,
    body: { morning: null, night: null, fatPct: null },
    condition: { mood: "", appetite: null, sleep: null, bowel: null, fatigue: null, stress: null, edema: null },
    meals: [],
    training: { done: false, parts: "", cardio: 0, cardioKcal: 0, exercises: [] },
    note: "",
  };
}

export function emptyMeal() {
  return {
    id: "m_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    time: nowHM(), name: "",
    totals: { kcal: "", protein: "", fat: "", carb: "", fiber: "", salt: "" },
    items: [],            // { name, grams, kcal, protein, fat, carb, estimated }
    photo: null, photoId: null,
    source: "manual",     // manual | ai_photo | ai_text | mymeal | copy
    estimated: false,
    userNote: "",
  };
}

const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };

// items があれば items から合計、無ければ totals をそのまま数値化
export function mealTotals(meal) {
  if (Array.isArray(meal.items) && meal.items.length > 0) {
    const s = { kcal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, salt: 0 };
    for (const it of meal.items) {
      s.kcal += num(it.kcal); s.protein += num(it.protein); s.fat += num(it.fat);
      s.carb += num(it.carb); s.fiber += num(it.fiber); s.salt += num(it.salt);
    }
    return s;
  }
  const t = meal.totals || {};
  return { kcal: num(t.kcal), protein: num(t.protein), fat: num(t.fat), carb: num(t.carb), fiber: num(t.fiber), salt: num(t.salt) };
}

export function dayTotals(day) {
  const s = { kcal: 0, protein: 0, fat: 0, carb: 0, fiber: 0, salt: 0 };
  for (const m of day?.meals || []) {
    const t = mealTotals(m);
    for (const k of Object.keys(s)) s[k] += t[k];
  }
  return s;
}

// 量(g)変更: 現在値から線形スケール
export function scaleItem(item, newGrams) {
  const g0 = num(item.grams);
  const g1 = num(newGrams);
  if (g0 <= 0 || g1 < 0) return { ...item, grams: newGrams };
  const r = g1 / g0;
  const rd = v => Math.round(num(v) * r * 10) / 10;
  return { ...item, grams: g1, kcal: Math.round(num(item.kcal) * r), protein: rd(item.protein), fat: rd(item.fat), carb: rd(item.carb), fiber: rd(item.fiber), salt: rd(item.salt) };
}

// 目標の初期提案（Mifflin-St Jeor ベース・減量=-500kcal）
export function suggestTargets(profile, mode) {
  const h = num(profile?.height), w = num(profile?.weight);
  const age = num(profile?.age) || 30;
  if (!h || !w) return null;
  const bmr = profile?.sex === "male" ? 10 * w + 6.25 * h - 5 * age + 5 : 10 * w + 6.25 * h - 5 * age - 161;
  const tdee = Math.round(bmr * (num(profile?.activity) || 1.5));
  const deficit = mode?.deficit ?? 500;
  const kcal = Math.max(1000, tdee - deficit);
  const pFactor = mode?.id === "trainee" ? 2.0 : mode?.id === "contest" ? 2.2 : 1.6;
  const protein = Math.round(w * pFactor);
  const fat = Math.round((kcal * 0.25) / 9);
  const carb = Math.max(0, Math.round((kcal - protein * 4 - fat * 9) / 4));
  return { tdee, targetKcal: kcal, targetP: protein, targetF: fat, targetC: carb };
}

export const DEFAULT_SETTINGS = {
  targetKcal: 1800, targetP: 90, targetF: 50, targetC: 220,
  mode: "diet",
  goalDate: "",
  goalLabel: "",
  conditionItems: { appetite: false, sleep: false, bowel: false, fatigue: false, stress: false, edema: false },
};

// ─── 褒めメッセージ（旧しぼログから継承・習慣化の核）───
export const PRAISE = {
  meal: [
    "🍽️ 食事記録バッチリ！意識して食べることが大事✨",
    "✅ 記録してえらい！食べたものを把握できてるね💪",
    "🌟 今日もちゃんと記録できてる、その積み重ねが結果になる！",
  ],
  body: [
    "🌅 体の記録お疲れ様！その積み重ねが結果につながるよ✨",
    "☀️ 毎日の計測、すごい！継続は力なり💪",
    "⭐ 記録を続けてるあなたは確実に前に進んでる💫",
  ],
  condition: [
    "📋 体調まで記録できてる、すばらしい！",
    "🌿 体の声を聞けてるね。体調と食事はつながってるよ✨",
  ],
};
export const pickPraise = type => {
  const arr = PRAISE[type] || PRAISE.meal;
  return arr[Math.floor(Math.random() * arr.length)];
};

// ─── 連続記録ストリーク（今日または昨日から遡って数える）───
export function calcStreak(markedDates, today = dateKey()) {
  if (!markedDates || markedDates.size === 0) return 0;
  let cur = markedDates.has(today) ? today : addDays(today, -1);
  if (!markedDates.has(cur)) return 0;
  let n = 0;
  while (markedDates.has(cur)) { n += 1; cur = addDays(cur, -1); }
  return n;
}
