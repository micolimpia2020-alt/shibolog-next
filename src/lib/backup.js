// バックアップ / 復元 / 旧しぼログ(v3)インポート / 自動バックアップ
import { K, kvGet, kvSet, kvDel, kvKeys, DAY_PREFIX, photoGet, photoPut, makePhotoId, listDayDates, loadDayLean } from "./storage.js";
import { emptyDay } from "./model.js";

const isDataUrl = v => typeof v === "string" && v.startsWith("data:");
export const BACKUP_VERSION = "shibolog_next_v1";

export async function collectBackupData() {
  const data = { __version: BACKUP_VERSION, __exportedAt: new Date().toISOString() };
  data.profile  = await kvGet(K.profile, null);
  data.settings = await kvGet(K.settings, null);
  data.mymeals  = await kvGet(K.mymeals, null);
  data.days = {};
  for (const date of await listDayDates()) {
    const day = await loadDayLean(date);
    if (!day) continue;
    // 写真を埋め込み（1ファイル完結）
    if (Array.isArray(day.meals) && day.meals.some(m => m.photoId)) {
      const meals = [];
      for (const m of day.meals) {
        if (m.photoId) {
          const p = await photoGet(m.photoId);
          meals.push(p ? { ...m, photo: p } : m);
        } else meals.push(m);
      }
      data.days[date] = { ...day, meals };
    } else data.days[date] = day;
  }
  return data;
}

export function downloadBackup(data, suffix = "backup") {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `shibolog_next_${suffix}_${new Date().toLocaleDateString("ja-JP").replace(/\//g, "-")}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function isValidBackup(data) {
  return !!data && (data.__version === BACKUP_VERSION || data.__version === "shibolog_v3");
}

// ── 旧しぼログ(v3) → 新形式変換 ──────────────────
// v3: weeks[].days[] { date:"7/16", fullKey:"2026-7-16", morning, night, cal, meals[], mood, training, note }
function v3FullKeyToDate(fullKey) {
  const [y, m, d] = String(fullKey).split("-").map(Number);
  if (!y || !m || !d) return null;
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}
export function convertV3(data) {
  const out = { __version: BACKUP_VERSION, __convertedFrom: "shibolog_v3", days: {} };
  if (data.profile) {
    out.profile = { height: data.profile.height || "", weight: data.profile.weight || "", age: "", sex: "", activity: "", maintenance: data.profile.maintenance || "" };
  }
  for (const w of data.weeks || []) {
    for (const d of w.days || []) {
      const date = v3FullKeyToDate(d.fullKey);
      if (!date) continue;
      const hasData = d.morning != null || d.night != null || (d.meals || []).length > 0 || d.mood || d.note || d.training?.done;
      if (!hasData) continue;
      const day = emptyDay(date);
      day.body = { morning: d.morning ?? null, night: d.night ?? null, fatPct: null };
      day.condition.mood = d.mood || "";
      day.training = d.training || day.training;
      day.note = d.note || "";
      day.meals = (d.meals || []).map(m => ({
        id: "m_v3_" + (m.id || Math.random().toString(36).slice(2)),
        time: m.time || "", name: m.name || "",
        totals: { kcal: m.kcal || "", protein: m.protein || "", fat: m.fat || "", carb: m.carb || "", fiber: "", salt: "" },
        items: [], photo: m.photo || null, photoId: null,
        source: "manual", estimated: false, userNote: "",
      }));
      out.days[date] = day;
    }
  }
  return out;
}

export async function restoreBackupData(raw) {
  if (!isValidBackup(raw)) throw new Error("このファイルはバックアップファイルではありません。");
  const data = raw.__version === "shibolog_v3" ? convertV3(raw) : raw;

  if (data.profile)  await kvSet(K.profile, data.profile);
  if (data.settings) await kvSet(K.settings, data.settings);
  if (data.mymeals)  await kvSet(K.mymeals, data.mymeals);

  for (const [date, day] of Object.entries(data.days || {})) {
    // 写真を分離して保存
    let meals = day.meals;
    if (Array.isArray(meals) && meals.some(m => isDataUrl(m.photo))) {
      const out = [];
      for (const m of meals) {
        if (isDataUrl(m.photo)) {
          const id = m.photoId || makePhotoId();
          await photoPut(id, m.photo);
          const { photo: _p, ...rest } = m;
          out.push({ ...rest, photoId: id });
        } else out.push(m);
      }
      meals = out;
    }
    await kvSet(K.day(date), { ...day, date, meals });
  }
  const meta = (await kvGet(K.meta, {})) || {};
  await kvSet(K.meta, { ...meta, schemaVersion: 1, restoredAt: new Date().toISOString() });
}

// ── 安全バックアップ ──────────────────────────────
export async function saveSafetyBackup(reason) {
  try {
    const data = await collectBackupData();
    data.__safetyReason = reason;
    await kvSet(K.safetyBackup, data);
    return true;
  } catch { return false; }
}
export const getSafetyBackup = () => kvGet(K.safetyBackup, null);

// ── リセット（安全バックアップは残す）──────────────
export async function resetAll() {
  const keys = await kvKeys();
  for (const k of keys) {
    if (k === K.safetyBackup) continue;
    if (k === K.meta) continue;
    if (typeof k === "string" && (k.startsWith(DAY_PREFIX) || [K.profile, K.settings, K.mymeals].includes(k))) {
      await kvDel(k);
    }
  }
  const meta = (await kvGet(K.meta, {})) || {};
  await kvSet(K.meta, { ...meta, resetAt: new Date().toISOString() });
}

// ── ネイティブ日次自動バックアップ（Webでは何もしない）──
export async function autoDailyBackup() {
  try {
    const { Capacitor } = await import("@capacitor/core");
    if (!Capacitor.isNativePlatform()) return false;
    const { Filesystem, Directory, Encoding } = await import("@capacitor/filesystem");
    const t = new Date();
    const stamp = `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`;
    const dir = "shibolog_next_backups";
    const path = `${dir}/auto_${stamp}.json`;
    try { await Filesystem.stat({ path, directory: Directory.Documents }); return true; } catch { /* 未作成 */ }
    const data = await collectBackupData();
    try { await Filesystem.mkdir({ path: dir, directory: Directory.Documents, recursive: true }); } catch { /* 既存 */ }
    await Filesystem.writeFile({ path, directory: Directory.Documents, data: JSON.stringify(data), encoding: Encoding.UTF8, recursive: true });
    try {
      const list = await Filesystem.readdir({ path: dir, directory: Directory.Documents });
      const autos = (list.files || []).map(f => (typeof f === "string" ? f : f.name))
        .filter(n => n.startsWith("auto_") && n.endsWith(".json")).sort();
      while (autos.length > 7) {
        const oldest = autos.shift();
        await Filesystem.deleteFile({ path: `${dir}/${oldest}`, directory: Directory.Documents });
      }
    } catch { /* noop */ }
    return true;
  } catch { return false; }
}
