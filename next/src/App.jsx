import { useState, useEffect, useCallback, useRef } from "react";
import { C, getMode } from "./theme.js";
import { K, kvGet, kvSet, saveDay, loadDay, listDayDates } from "./lib/storage.js";
import { autoDailyBackup } from "./lib/backup.js";
import { dateKey, emptyDay, DEFAULT_SETTINGS, nowHM, pickPraise } from "./lib/model.js";
import Home from "./screens/Home.jsx";
import Meals from "./screens/Meals.jsx";
import Training from "./screens/Training.jsx";
import MenuSuggest from "./screens/MenuSuggest.jsx";
import Records from "./screens/Records.jsx";
import Calendar from "./screens/Calendar.jsx";
import MealDetail from "./screens/MealDetail.jsx";
import Settings from "./screens/Settings.jsx";

const TABS = [
  { id: "home", label: "ダッシュ", icon: "📊" },
  { id: "meals", label: "食事", icon: "🍽️" },
  { id: "training", label: "トレ", icon: "💪" },
  { id: "menu", label: "提案", icon: "🔥" },
  { id: "records", label: "記録", icon: "📋" },
  { id: "calendar", label: "カレンダー", icon: "📅" },
  { id: "settings", label: "設定", icon: "⚙️" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [date, setDate] = useState(dateKey());
  const [day, setDay] = useState(() => emptyDay(dateKey()));
  const [profile, setProfileState] = useState({});
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [goal, setGoalState] = useState({});
  const [fatgoal, setFatgoalState] = useState({});
  const [mymeals, setMymealsState] = useState([]);
  const [markedDates, setMarkedDates] = useState(new Set());
  const [detailId, setDetailId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);
  const [praise, setPraise] = useState("");
  const praiseTimer = useRef(null);

  const showSaved = useCallback((ok = true) => {
    setSaveStatus(ok ? "saved" : "error");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus(""), 2000);
  }, []);
  const showPraise = useCallback((type) => {
    setPraise(pickPraise(type));
    clearTimeout(praiseTimer.current);
    praiseTimer.current = setTimeout(() => setPraise(""), 3500);
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, s, g, fg, mm, dates, d] = await Promise.all([
        kvGet(K.profile, {}),
        kvGet(K.settings, DEFAULT_SETTINGS),
        kvGet(K.goal, {}),
        kvGet(K.fatgoal, {}),
        kvGet(K.mymeals, []),
        listDayDates(),
        loadDay(dateKey()),
      ]);
      if (!alive) return;
      setProfileState(p || {});
      setSettingsState({ ...DEFAULT_SETTINGS, ...(s || {}) });
      setGoalState(g || {});
      setFatgoalState(fg || {});
      setMymealsState(mm || []);
      setMarkedDates(new Set(dates));
      setDay(d || emptyDay(dateKey()));
      setReady(true);
      autoDailyBackup();
    })().catch(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  const switchDate = useCallback(async (k) => {
    setDate(k);
    const d = await loadDay(k);
    setDay(d || emptyDay(k));
  }, []);

  const updateDay = useCallback((patch) => {
    setDay(prev => {
      const next = { ...prev, ...patch };
      saveDay(next).then(ok => {
        showSaved(ok);
        if (ok) setMarkedDates(md => md.has(next.date) ? md : new Set([...md, next.date]));
      });
      return next;
    });
  }, [showSaved]);

  // 他画面（記録・カレンダー）が同じ日を直接保存した場合の同期
  const onExternalSaved = useCallback((ok, k) => {
    showSaved(ok);
    if (ok && k) {
      setMarkedDates(md => md.has(k) ? md : new Set([...md, k]));
      if (k === date) loadDay(k).then(d => d && setDay(d));
    }
  }, [showSaved, date]);

  const mkSetter = (key, setState) => (v) => { setState(v); kvSet(key, v).then(showSaved); };
  const setProfile = useCallback(mkSetter(K.profile, setProfileState), [showSaved]);
  const setSettings = useCallback(mkSetter(K.settings, setSettingsState), [showSaved]);
  const setGoal = useCallback(mkSetter(K.goal, setGoalState), [showSaved]);
  const setFatgoal = useCallback(mkSetter(K.fatgoal, setFatgoalState), [showSaved]);
  const setMymeals = useCallback(mkSetter(K.mymeals, setMymealsState), [showSaved]);

  const addMeal = useCallback((meal) => {
    updateDay({ meals: [...(day?.meals || []), meal] });
    showPraise("meal");
  }, [day, updateDay, showPraise]);

  const updateMeal = useCallback((meal) => {
    updateDay({ meals: (day?.meals || []).map(m => m.id === meal.id ? meal : m) });
    setDetailId(null);
  }, [day, updateDay]);

  const deleteMeal = useCallback((id) => {
    updateDay({ meals: (day?.meals || []).filter(m => m.id !== id) });
    setDetailId(null);
  }, [day, updateDay]);

  const saveMyMeal = useCallback((meal) => {
    const t = { id: "my_" + Date.now().toString(36), name: meal.name || "マイミール", totals: { ...meal.totals }, items: (meal.items || []).map(i => ({ ...i })) };
    setMymeals([...(mymeals || []), t]);
    alert("マイミールに登録しました ⭐");
  }, [mymeals, setMymeals]);

  const addMyMealToToday = useCallback((t) => {
    const meal = { id: "m_" + Date.now().toString(36), time: nowHM(), name: t.name, totals: { ...t.totals }, items: (t.items || []).map(i => ({ ...i })), photo: null, photoId: null, source: "mymeal", estimated: false, userNote: "" };
    updateDay({ meals: [...(day?.meals || []), meal] });
    showPraise("meal");
  }, [day, updateDay, showPraise]);

  // メニュー提案 → 今日のトレーニング記録へ
  const addMenuToTraining = useCallback((exs, partLabel) => {
    const tr = day?.training || { done: false, parts: [], cardio: 0, cardioKcal: 0, exercises: [] };
    const newExs = exs.map(e => ({ name: e.name, sets: [{ weight: "", reps: "" }] }));
    updateDay({ training: { ...tr, done: true, exercises: [...(tr.exercises || []), ...newExs] } });
    setTab("training");
    showPraise("meal");
  }, [day, updateDay, showPraise]);

  if (!ready) {
    return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif" }}>読み込み中…</div>;
  }

  const detailMeal = detailId ? (day?.meals || []).find(m => m.id === detailId) : null;
  const mode = getMode(settings.mode);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif", maxWidth: 560, margin: "0 auto", position: "relative" }}>
      {saveStatus && (
        <div style={{ position: "fixed", top: 10, left: "50%", transform: "translateX(-50%)", zIndex: 90, background: saveStatus === "saved" ? C.green : C.red, color: "#fff", fontSize: 12, fontWeight: 700, borderRadius: 20, padding: "6px 14px" }}>
          {saveStatus === "saved" ? "✓ 保存しました" : "⚠ 保存に失敗しました"}
        </div>
      )}
      {praise && (
        <div style={{ position: "fixed", top: 44, left: "50%", transform: "translateX(-50%)", zIndex: 90, background: "#fff", color: C.text, fontSize: 13, fontWeight: 700, borderRadius: 14, padding: "10px 16px", border: `1px solid ${C.border}`, boxShadow: "0 4px 14px rgba(74,70,63,0.15)", maxWidth: "88%", textAlign: "center" }}>
          {praise}
        </div>
      )}

      {tab === "home" && (
        <Home date={date} setDate={switchDate} day={day} settings={settings} profile={profile} fatgoal={fatgoal}
          mode={mode} markedDates={markedDates} updateDay={updateDay} onGoCalendar={() => setTab("calendar")} />
      )}
      {tab === "meals" && (
        <Meals date={date} setDate={switchDate} day={day} mode={mode} markedDates={markedDates}
          mymeals={mymeals} updateDay={updateDay} onOpenMeal={setDetailId} onAddMeal={addMeal}
          onAddMyMealToToday={addMyMealToToday}
          onRemoveMyMeal={id => setMymeals(mymeals.filter(t => t.id !== id))} />
      )}
      {tab === "training" && (
        <Training date={date} setDate={switchDate} day={day} mode={mode} markedDates={markedDates}
          updateDay={updateDay} onPraise={showPraise} />
      )}
      {tab === "menu" && (
        <MenuSuggest mode={mode} onAddToTraining={addMenuToTraining} />
      )}
      {tab === "records" && (
        <Records mode={mode} settings={settings} markedDates={markedDates} onSaved={onExternalSaved} />
      )}
      {tab === "calendar" && (
        <Calendar mode={mode} markedDates={markedDates} onSaved={onExternalSaved}
          onJump={k => { switchDate(k); setTab("home"); }} />
      )}
      {tab === "settings" && (
        <Settings profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings}
          goal={goal} setGoal={setGoal} fatgoal={fatgoal} setFatgoal={setFatgoal} mode={mode} />
      )}

      {/* タブバー（7項目・360px対応） */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 560, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 45, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, minWidth: 0, border: "none", background: "none", cursor: "pointer", padding: "8px 0 10px", color: tab === t.id ? mode.accent : C.muted }}>
            <div style={{ fontSize: 17 }}>{t.icon}</div>
            <div style={{ fontSize: 8.5, fontWeight: tab === t.id ? 800 : 500, letterSpacing: "-0.03em", whiteSpace: "nowrap" }}>{t.label}</div>
          </button>
        ))}
      </div>

      {detailMeal && (
        <MealDetail meal={detailMeal} onClose={() => setDetailId(null)}
          onUpdate={updateMeal} onDelete={deleteMeal} onSaveMyMeal={saveMyMeal} />
      )}
    </div>
  );
}
