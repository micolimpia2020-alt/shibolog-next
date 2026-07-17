import { useRef } from "react";
import { C, MODES, card, inp, btn, btnGhost } from "../theme.js";
import { Field } from "../components/ui.jsx";
import { CONDITION_ITEMS, GOAL_TYPES, calcProfile, calcFatGoal, fmt1, fmt0 } from "../lib/model.js";
import { collectBackupData, downloadBackup, isValidBackup, restoreBackupData, saveSafetyBackup, getSafetyBackup, resetAll } from "../lib/backup.js";

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 52, height: 30, borderRadius: 15, border: "none", cursor: "pointer", background: on ? C.green : "#d9d2c6", position: "relative", transition: "background .2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}
const Stat = ({ l, v, u, color = C.text }) => (
  <div style={{ flex: 1, minWidth: 90, textAlign: "center", padding: "6px 0" }}>
    <div style={{ fontSize: 10, color: C.muted }}>{l}</div>
    <div style={{ fontSize: 16, fontWeight: 800, color }}>{v}<span style={{ fontSize: 10, fontWeight: 600 }}>{u}</span></div>
  </div>
);

export default function Settings({ profile, setProfile, settings, setSettings, goal, setGoal, fatgoal, setFatgoal, mode }) {
  const fileRef = useRef();
  const goalPhotoRef = useRef();
  const calc = calcProfile(profile || {});
  const fat = calcFatGoal({ weight: profile?.weight, fatPct: profile?.fatPct, targetFatPct: fatgoal?.targetFatPct, dailyDeficit: fatgoal?.dailyDeficit });

  const setP = p => setProfile({ ...profile, ...p });
  const setS = p => setSettings({ ...settings, ...p });
  const setG = p => setGoal({ ...goal, ...p });
  const setF = p => setFatgoal({ ...fatgoal, ...p });

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 14 }}>設定</div>

      {/* 目標設定 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.pink, marginBottom: 10 }}>🎯 目標設定</div>
        <Field label="目標のタイプ">
          <select value={goal?.type || ""} style={inp()} onChange={e => setG({ type: e.target.value })}>
            <option value="">選択してください</option>
            {GOAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="数値の目標"><input type="text" placeholder="例: 52kg / 体脂肪20%" value={goal?.targetNum || ""} style={inp()} onChange={e => setG({ targetNum: e.target.value })} /></Field>
          <Field label="いつまでに"><input type="date" value={goal?.targetDate || ""} style={inp()} onChange={e => setG({ targetDate: e.target.value })} /></Field>
        </div>
        <Field label="見た目の目標"><input type="text" placeholder="例: くびれを作る" value={goal?.targetLook || ""} style={inp()} onChange={e => setG({ targetLook: e.target.value })} /></Field>
        <Field label="参考画像（任意）">
          <input type="file" accept="image/*" ref={goalPhotoRef} style={{ display: "none" }}
            onChange={e => { const f = e.target.files?.[0]; if (!f) return; const r = new FileReader(); r.onload = ev => setG({ refPhoto: ev.target.result }); r.readAsDataURL(f); e.target.value = ""; }} />
          {goal?.refPhoto
            ? <div><img src={goal.refPhoto} alt="goal" style={{ width: "100%", borderRadius: 12, maxHeight: 180, objectFit: "cover", marginBottom: 6 }} />
                <button onClick={() => setG({ refPhoto: null })} style={btnGhost(C.red)}>🗑️ 削除</button></div>
            : <button onClick={() => goalPhotoRef.current.click()} style={btnGhost(C.muted, { width: "100%" })}>📷 画像を追加する</button>}
        </Field>
      </div>

      {/* 基本情報 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>👤 基本情報</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="身長 (cm)"><input type="number" inputMode="decimal" value={profile?.height || ""} style={inp()} onChange={e => setP({ height: e.target.value })} /></Field>
          <Field label="現在の体重 (kg)"><input type="number" inputMode="decimal" value={profile?.weight || ""} style={inp()} onChange={e => setP({ weight: e.target.value })} /></Field>
          <Field label="体脂肪率 (%)"><input type="number" inputMode="decimal" value={profile?.fatPct || ""} style={inp()} onChange={e => setP({ fatPct: e.target.value })} /></Field>
          <Field label="メンテナンスカロリー">
            <input type="number" inputMode="numeric" placeholder="空欄で自動計算" value={profile?.maintenance || ""} style={inp()} onChange={e => setP({ maintenance: e.target.value })} />
          </Field>
        </div>
        <div style={{ fontSize: 11, color: C.muted }}>メンテナンスカロリーを入力するとその値を最優先します。</div>
      </div>

      {/* 基本計算（旧しぼログ式） */}
      {calc.tdee != null && (
        <div style={card({ marginBottom: 12 })}>
          <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>🧮 あなたの数値</div>
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <Stat l="BMI" v={fmt1(calc.bmi)} u="" />
            <Stat l="除脂肪体重" v={fmt1(calc.lbm)} u="kg" />
            <Stat l="体脂肪量" v={fmt1(calc.fatKg)} u="kg" />
            <Stat l="メンテナンス" v={fmt0(calc.tdee)} u="kcal" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${C.dim}` }}>
            <Stat l="減量" v={calc.cut} u="kcal" color={mode.accent} />
            <Stat l="維持" v={calc.maintain} u="kcal" />
            <Stat l="増量" v={calc.bulk} u="kcal" />
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", borderTop: `1px solid ${C.dim}` }}>
            <Stat l="タンパク質" v={calc.protein} u="g" color={C.p} />
            <Stat l="脂質" v={calc.fat} u="g" color={C.f} />
            <Stat l="炭水化物" v={calc.carb} u="g" color={C.c} />
            {calc.goalWeight != null && <Stat l="目標体重(15%)" v={fmt1(calc.goalWeight)} u="kg" color={C.green} />}
          </div>
          <button onClick={() => setS({ targetKcal: calc.cut, targetP: calc.protein, targetF: calc.fat, targetC: calc.carb })}
            style={btnGhost(mode.accent, { width: "100%", marginTop: 8 })}>
            💡 この計算結果を1日の目標に反映する
          </button>
        </div>
      )}

      {/* 目標体脂肪率 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>🔥 目標体脂肪率の計算</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="目標体脂肪率 (%)"><input type="number" inputMode="decimal" value={fatgoal?.targetFatPct || ""} style={inp()} onChange={e => setF({ targetFatPct: e.target.value })} /></Field>
          <Field label="1日の不足カロリー"><input type="number" inputMode="numeric" placeholder="例: 500" value={fatgoal?.dailyDeficit || ""} style={inp()} onChange={e => setF({ dailyDeficit: e.target.value })} /></Field>
        </div>
        {fat.errors?.length > 0 && <div style={{ fontSize: 11, color: C.red }}>{fat.errors.join(" / ")}</div>}
        {fat.errors?.length === 0 && !fat.partial && (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            <Stat l="落とす脂肪" v={fmt1(fat.needFatLoss)} u="kg" color={C.red} />
            <Stat l="必要赤字" v={fmt0(fat.totalDeficit)} u="kcal" />
            <Stat l="達成まで" v={fat.days != null ? Math.ceil(fat.days) : "—"} u="日" />
            <Stat l="目標体重" v={fmt1(fat.goalWeight)} u="kg" color={C.green} />
            <Stat l="あと" v={"−" + fmt1(fat.diffKg)} u="kg" color={mode.accent} />
          </div>
        )}
      </div>

      {/* 1日の目標 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>🍽️ 1日の目標（ホームのリング）</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="摂取カロリー (kcal)" color={C.accent}><input type="number" inputMode="numeric" value={settings.targetKcal} style={inp()} onChange={e => setS({ targetKcal: +e.target.value || 0 })} /></Field>
          <Field label="タンパク質 (g)" color={C.p}><input type="number" inputMode="numeric" value={settings.targetP} style={inp()} onChange={e => setS({ targetP: +e.target.value || 0 })} /></Field>
          <Field label="脂質 (g)" color={C.f}><input type="number" inputMode="numeric" value={settings.targetF} style={inp()} onChange={e => setS({ targetF: +e.target.value || 0 })} /></Field>
          <Field label="炭水化物 (g)" color={C.c}><input type="number" inputMode="numeric" value={settings.targetC} style={inp()} onChange={e => setS({ targetC: +e.target.value || 0 })} /></Field>
        </div>
      </div>

      {/* モード（テーマカラー） */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>🎽 モード（テーマ）</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>アプリの色が変わります。</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 7 }}>
          {Object.values(MODES).map(m => (
            <button key={m.id} onClick={() => setS({ mode: m.id })}
              style={{ padding: "10px 4px", borderRadius: 12, cursor: "pointer", textAlign: "center", border: `2px solid ${settings.mode === m.id ? m.accent : C.border}`, background: settings.mode === m.id ? m.soft : "#fff" }}>
              <div style={{ fontSize: 18 }}>{m.icon}</div>
              <div style={{ fontSize: 11, fontWeight: 800, color: settings.mode === m.id ? m.accent : C.text }}>{m.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* 記録項目 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>📋 記録項目（コンディション）</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>記録ページで体重と並んで記録する項目を選べます。</div>
        {CONDITION_ITEMS.map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.dim}` }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}を記録</div>
            <Toggle on={!!settings.conditionItems?.[key]} onChange={v => setS({ conditionItems: { ...settings.conditionItems, [key]: v } })} />
          </div>
        ))}
      </div>

      {/* データ管理 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 6 }}>💾 データ管理</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.8 }}>
          記録はこの端末に自動保存されます。端末変更・アプリ削除に備えて定期的にバックアップしてください。
          復元やリセットの直前には端末内に安全バックアップを自動保存します。
        </div>
        <button onClick={async () => {
          try { downloadBackup(await collectBackupData()); } catch (e) { alert("エクスポートに失敗しました: " + e.message); }
        }} style={btn(C.accent, { width: "100%", marginBottom: 8 })}>📤 データをバックアップ保存</button>
        <button onClick={() => fileRef.current.click()} style={btnGhost(C.f, { width: "100%", marginBottom: 8 })}>
          📥 データをインポート（旧しぼログのバックアップにも対応）
        </button>
        <input type="file" accept=".json" ref={fileRef} style={{ display: "none" }} onChange={e => {
          const file = e.target.files[0]; if (!file) return;
          const reader = new FileReader();
          reader.onload = ev => {
            try {
              const data = JSON.parse(ev.target.result);
              if (!isValidBackup(data)) { alert("このファイルはバックアップファイルではありません。"); return; }
              const label = data.__version === "shibolog_v3" ? "旧しぼログのデータ" : "バックアップ";
              if (!window.confirm(`${label}を取り込みます。現在のデータは安全バックアップとして端末内に残します。よろしいですか？`)) return;
              (async () => {
                await saveSafetyBackup("before_import");
                await restoreBackupData(data);
                alert("インポートが完了しました。再読み込みします。");
                window.location.reload();
              })().catch(err => alert(err.message || "復元に失敗しました。"));
            } catch (err) { alert(err.message || "ファイルの読み込みに失敗しました。"); }
          };
          reader.readAsText(file);
          e.target.value = "";
        }} />
        <button onClick={async () => {
          try {
            const b = await getSafetyBackup();
            if (!b) { alert("直前バックアップはまだありません。"); return; }
            if (!window.confirm("直前バックアップから復元します。よろしいですか？")) return;
            await saveSafetyBackup("before_restore_safety_backup");
            await restoreBackupData(b);
            alert("復元しました。再読み込みします。");
            window.location.reload();
          } catch (e) { alert("復元に失敗しました: " + (e.message || e)); }
        }} style={btnGhost(C.green, { width: "100%", marginBottom: 8 })}>🛟 直前バックアップから復元</button>
        <button onClick={async () => {
          if (!window.confirm("全ての記録をリセットします。先に安全バックアップを端末内に残します。続けますか？")) return;
          const typed = window.prompt("誤操作防止のため「リセット」と入力してください。");
          if (typed !== "リセット") return;
          await saveSafetyBackup("before_reset");
          await resetAll();
          alert("リセットしました。直前バックアップから復元できます。");
          window.location.reload();
        }} style={btnGhost(C.muted, { width: "100%" })}>🗑️ データをリセットする</button>
      </div>

      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.8, padding: "0 4px" }}>
        本アプリの数値は推定値です。医学的な診断・治療を目的とするものではありません。単位: kcal
      </div>
    </div>
  );
}
