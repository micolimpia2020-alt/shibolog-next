import { useRef } from "react";
import { C, MODES, card, inp, btn, btnGhost } from "../theme.js";
import { Field } from "../components/ui.jsx";
import { CONDITION_ITEMS, suggestTargets } from "../lib/model.js";
import { collectBackupData, downloadBackup, isValidBackup, restoreBackupData, saveSafetyBackup, getSafetyBackup, resetAll } from "../lib/backup.js";

function Toggle({ on, onChange }) {
  return (
    <button onClick={() => onChange(!on)}
      style={{ width: 52, height: 30, borderRadius: 15, border: "none", cursor: "pointer", background: on ? C.green : "#d9d2c6", position: "relative", transition: "background .2s" }}>
      <span style={{ position: "absolute", top: 3, left: on ? 25 : 3, width: 24, height: 24, borderRadius: "50%", background: "#fff", transition: "left .2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
    </button>
  );
}

export default function Settings({ profile, setProfile, settings, setSettings, mode }) {
  const fileRef = useRef();
  const sug = suggestTargets(profile, mode);

  const setP = p => setProfile({ ...profile, ...p });
  const setS = p => setSettings({ ...settings, ...p });

  return (
    <div style={{ padding: "16px 16px 120px" }}>
      <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 14 }}>設定</div>

      {/* モード */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>🎽 モード</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>目的に合わせてアプリの色と目標計算が変わります。</div>
        {Object.values(MODES).map(m => (
          <button key={m.id} onClick={() => setS({ mode: m.id })}
            style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left", cursor: "pointer", marginBottom: 8, padding: "12px 14px", borderRadius: 14, border: `2px solid ${settings.mode === m.id ? m.accent : C.border}`, background: settings.mode === m.id ? m.soft : "#fff" }}>
            <span style={{ fontSize: 20 }}>{m.icon}</span>
            <span style={{ flex: 1 }}>
              <span style={{ display: "block", fontSize: 14, fontWeight: 800, color: settings.mode === m.id ? m.accent : C.text }}>{m.label}</span>
              <span style={{ display: "block", fontSize: 11, color: C.muted }}>{m.desc}</span>
            </span>
            {settings.mode === m.id && <span style={{ color: m.accent, fontWeight: 800 }}>✓</span>}
          </button>
        ))}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 6 }}>
          <Field label="目標日（コンテスト日など・任意）">
            <input type="date" value={settings.goalDate || ""} style={inp()} onChange={e => setS({ goalDate: e.target.value })} />
          </Field>
          <Field label="目標の名前（任意）">
            <input type="text" placeholder="例: 夏までに / 大会名" value={settings.goalLabel || ""} style={inp()} onChange={e => setS({ goalLabel: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* プロフィール */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>👤 プロフィール</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="身長 (cm)"><input type="number" inputMode="decimal" value={profile.height || ""} style={inp()} onChange={e => setP({ height: e.target.value })} /></Field>
          <Field label="体重 (kg)"><input type="number" inputMode="decimal" value={profile.weight || ""} style={inp()} onChange={e => setP({ weight: e.target.value })} /></Field>
          <Field label="年齢"><input type="number" inputMode="numeric" value={profile.age || ""} style={inp()} onChange={e => setP({ age: e.target.value })} /></Field>
          <Field label="性別">
            <select value={profile.sex || ""} style={inp()} onChange={e => setP({ sex: e.target.value })}>
              <option value="">未設定</option><option value="female">女性</option><option value="male">男性</option>
            </select>
          </Field>
        </div>
        <Field label="活動量">
          <select value={profile.activity || ""} style={inp()} onChange={e => setP({ activity: e.target.value })}>
            <option value="">未設定（標準 1.5）</option>
            <option value="1.2">ほぼ運動しない (1.2)</option>
            <option value="1.375">週1-3回の軽い運動 (1.375)</option>
            <option value="1.55">週3-5回の運動 (1.55)</option>
            <option value="1.725">ほぼ毎日ハードに運動 (1.725)</option>
          </select>
        </Field>
      </div>

      {/* 目標 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 10 }}>🎯 目標（1日）</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <Field label="摂取カロリー (kcal)" color={C.accent}><input type="number" inputMode="numeric" value={settings.targetKcal} style={inp()} onChange={e => setS({ targetKcal: +e.target.value || 0 })} /></Field>
          <Field label="タンパク質 (g)" color={C.p}><input type="number" inputMode="numeric" value={settings.targetP} style={inp()} onChange={e => setS({ targetP: +e.target.value || 0 })} /></Field>
          <Field label="炭水化物 (g)" color={C.c}><input type="number" inputMode="numeric" value={settings.targetC} style={inp()} onChange={e => setS({ targetC: +e.target.value || 0 })} /></Field>
          <Field label="脂質 (g)" color={C.f}><input type="number" inputMode="numeric" value={settings.targetF} style={inp()} onChange={e => setS({ targetF: +e.target.value || 0 })} /></Field>
        </div>
        {sug && (
          <button onClick={() => setS({ targetKcal: sug.targetKcal, targetP: sug.targetP, targetF: sug.targetF, targetC: sug.targetC })}
            style={btnGhost(C.accent, { width: "100%", marginTop: 4 })}>
            💡 プロフィールから自動計算する（推定TDEE {sug.tdee}kcal → {mode.label}目標 {sug.targetKcal}kcal）
          </button>
        )}
      </div>

      {/* 記録項目 */}
      <div style={card({ marginBottom: 12 })}>
        <div style={{ fontSize: 14, fontWeight: 800, color: C.text, marginBottom: 4 }}>📋 記録項目（コンディション）</div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 10 }}>体重・体脂肪率と並んで記録する項目を選べます。</div>
        {CONDITION_ITEMS.map(({ key, label }) => (
          <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${C.dim}` }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}を記録</div>
            </div>
            <Toggle on={!!settings.conditionItems?.[key]}
              onChange={v => setS({ conditionItems: { ...settings.conditionItems, [key]: v } })} />
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
        本アプリの栄養値・AI分析結果は推定値です。医学的な診断・治療を目的とするものではありません。単位: kcal
      </div>
    </div>
  );
}
