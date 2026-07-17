import { useState, useEffect, useCallback, useRef } from "react";
import { C, getMode } from "./theme.js";
import { K, kvGet, kvSet, saveDay, loadDay, listDayDates } from "./lib/storage.js";
import { autoDailyBackup } from "./lib/backup.js";
import { dateKey, emptyDay, DEFAULT_SETTINGS, nowHM, pickPraise } from "./lib/model.js";
import Home from "./screens/Home.jsx";
import AddMeal from "./screens/AddMeal.jsx";
import MealDetail from "./screens/MealDetail.jsx";
import Condition from "./screens/Condition.jsx";
import MyMeals from "./screens/MyMeals.jsx";
import Settings from "./screens/Settings.jsx";

const TABS = [
  { id: "home", label: "ホーム", icon: "🏠" },
  { id: "condition", label: "体調", icon: "📋" },
  { id: "mymeals", label: "マイミール", icon: "⭐" },
  { id: "settings", label: "設定", icon: "⚙️" },
];

export default function App() {
  const [ready, setReady] = useState(false);
  const [tab, setTab] = useState("home");
  const [date, setDate] = useState(dateKey());
  const [day, setDay] = useState(() => emptyDay(dateKey()));
  const [profile, setProfileState] = useState({});
  const [settings, setSettingsState] = useState(DEFAULT_SETTINGS);
  const [mymeals, setMymealsState] = useState([]);
  const [markedDates, setMarkedDates] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [detailId, setDetailId] = useState(null);
  const [saveStatus, setSaveStatus] = useState("");
  const saveTimer = useRef(null);
  const [praise, setPraise] = useState("");
  const praiseTimer = useRef(null);

  const showPraise = useCallback((type) => {
    setPraise(pickPraise(type));
    clearTimeout(praiseTimer.current);
    praiseTimer.current = setTimeout(() => setPraise(""), 3500);
  }, []);

  const showSaved = useCallback((ok = true) => {
    setSaveStatus(ok ? "saved" : "error");
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveStatus(""), 2000);
  }, []);

  // ── 初期読込 ──
  useEffect(() => {
    let alive = true;
    (async () => {
      const [p, s, mm, dates, d] = await Promise.all([
        kvGet(K.profile, {}),
        kvGet(K.settings, DEFAULT_SETTINGS),
        kvGet(K.mymeals, []),
        listDayDates(),
        loadDay(dateKey()),
      ]);
      if (!alive) return;
      setProfileState(p || {});
      setSettingsState({ ...DEFAULT_SETTINGS, ...(s || {}) });
      setMymealsState(mm || []);
      setMarkedDates(new Set(dates));
      setDay(d || emptyDay(dateKey()));
      setReady(true);
      autoDailyBackup();
    })().catch(() => alive && setReady(true));
    return () => { alive = false; };
  }, []);

  // ── 日付変更で読込 ──
  const switchDate = useCallback(async (k) => {
    setDate(k);
    const d = await loadDay(k);
    setDay(d || emptyDay(k));
  }, []);

  // ── 日レコード更新（即保存）──
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

  const setProfile = useCallback((p) => {
    setProfileState(p);
    kvSet(K.profile, p).then(showSaved);
  }, [showSaved]);
  const setSettings = useCallback((s) => {
    setSettingsState(s);
    kvSet(K.settings, s).then(showSaved);
  }, [showSaved]);
  const setMymeals = useCallback((mm) => {
    setMymealsState(mm);
    kvSet(K.mymeals, mm).then(showSaved);
  }, [showSaved]);

  // ── 食事操作 ──
  const addMeal = useCallback((meal) => {
    updateDay({ meals: [...(day?.meals || []), meal] });
    setShowAdd(false);
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
    const t = {
      id: "my_" + Date.now().toString(36),
      name: meal.name || "マイミール",
      totals: { ...meal.totals },
      items: (meal.items || []).map(i => ({ ...i })),
    };
    setMymeals([...(mymeals || []), t]);
    alert("マイミールに登録しました ⭐");
  }, [mymeals, setMymeals]);

  const addMyMealToToday = useCallback((t) => {
    const meal = {
      id: "m_" + Date.now().toString(36),
      time: nowHM(), name: t.name,
      totals: { ...t.totals }, items: (t.items || []).map(i => ({ ...i })),
      photo: null, photoId: null, source: "mymeal", estimated: false, userNote: "",
    };
    updateDay({ meals: [...(day?.meals || []), meal] });
    setTab("home");
  }, [day, updateDay]);

  if (!ready) {
    return <div style={{ minHeight: "100vh", background: C.bg, display: "flex", alignItems: "center", justifyContent: "center", color: C.muted, fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif" }}>読み込み中…</div>;
  }

  const detailMeal = detailId ? (day?.meals || []).find(m => m.id === detailId) : null;
  const mode = getMode(settings.mode);

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.text, fontFamily: "'Hiragino Sans','Yu Gothic',sans-serif", maxWidth: 560, margin: "0 auto", position: "relative" }}>
      {/* 保存ステータス */}
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
        <Home date={date} setDate={switchDate} day={day} settings={settings} mode={mode}
          markedDates={markedDates} onOpenMeal={setDetailId} />
      )}
      {tab === "condition" && (
        <Condition date={date} day={day} settings={settings} mode={mode} updateDay={updateDay} onPraise={showPraise} />
      )}
      {tab === "mymeals" && (
        <MyMeals mymeals={mymeals} onAddToToday={addMyMealToToday}
          onRemove={id => setMymeals(mymeals.filter(t => t.id !== id))} />
      )}
      {tab === "settings" && (
        <Settings profile={profile} setProfile={setProfile} settings={settings} setSettings={setSettings} mode={mode} />
      )}

      {/* ＋ FAB */}
      {(tab === "home") && (
        <button onClick={() => setShowAdd(true)}
          style={{ position: "fixed", right: 20, bottom: 90, width: 62, height: 62, borderRadius: "50%", border: "none", cursor: "pointer", background: mode.accent, color: "#fff", fontSize: 30, boxShadow: "0 4px 14px rgba(40,35,25,0.3)", zIndex: 40 }}>＋</button>
      )}

      {/* タブバー */}
      <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 560, background: "rgba(255,255,255,0.95)", backdropFilter: "blur(8px)", borderTop: `1px solid ${C.border}`, display: "flex", zIndex: 45, paddingBottom: "env(safe-area-inset-bottom)" }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ flex: 1, border: "none", background: "none", cursor: "pointer", padding: "10px 0 12px", color: tab === t.id ? C.text : C.muted }}>
            <div style={{ fontSize: 20 }}>{t.icon}</div>
            <div style={{ fontSize: 10, fontWeight: tab === t.id ? 800 : 500 }}>{t.label}</div>
          </button>
        ))}
      </div>

      {/* シート */}
      {showAdd && <AddMeal onClose={() => setShowAdd(false)} onSave={addMeal} mymeals={mymeals} />}
      {detailMeal && (
        <MealDetail meal={detailMeal} onClose={() => setDetailId(null)}
          onUpdate={updateMeal} onDelete={deleteMeal} onSaveMyMeal={saveMyMeal} />
      )}
    </div>
  );
}
