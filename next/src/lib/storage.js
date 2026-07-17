// ══════════════════════════════════════════════════
//  ストレージ層（IndexedDB）
//  - 記録は日単位レコードで分割保存（1件破損しても他は無事）
//  - 写真は photos ストアに分離
//  - 設定等の軽量データは localStorage にもミラー（二重化）
// ══════════════════════════════════════════════════

const DB_NAME = "shibolog_next_v1";
const DB_VERSION = 1;
const KV = "kv";
const PHOTOS = "photos";

export const K = {
  meta:     "slnx_meta",
  profile:  "slnx_profile",
  settings: "slnx_settings",
  mymeals:  "slnx_mymeals",
  goal:     "slnx_goal",
  fatgoal:  "slnx_fatgoal",
  safetyBackup: "slnx_safety_backup",
  day: (date) => `slnx_day:${date}`,   // date = "YYYY-MM-DD"
};
export const DAY_PREFIX = "slnx_day:";

const MIRROR = new Set([K.meta, K.profile, K.settings, K.mymeals, K.fatgoal]);

let dbPromise = null;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(KV)) db.createObjectStore(KV);
      if (!db.objectStoreNames.contains(PHOTOS)) db.createObjectStore(PHOTOS);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}
function tx(store, mode, fn) {
  return openDb().then(db => new Promise((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    const r = fn(s);
    t.oncomplete = () => resolve(r && r.__isReq ? r.req.result : r);
    t.onerror = () => reject(t.error);
    t.onabort = () => reject(t.error);
  }));
}
const reqVal = (s, m, ...a) => ({ __isReq: true, req: s[m](...a) });

export async function kvGet(key, fallback = null) {
  try {
    const v = await tx(KV, "readonly", s => reqVal(s, "get", key));
    if (v !== undefined && v !== null) return v;
  } catch { /* fall through */ }
  try {
    const raw = localStorage.getItem(key);
    if (raw != null) return JSON.parse(raw);
  } catch { /* noop */ }
  return fallback;
}
export async function kvSet(key, value) {
  let ok = false;
  try { await tx(KV, "readwrite", s => { s.put(value, key); }); ok = true; } catch { ok = false; }
  if (MIRROR.has(key)) {
    try { localStorage.setItem(key, JSON.stringify(value)); ok = true; } catch { /* noop */ }
  }
  return ok;
}
export async function kvDel(key) {
  try { await tx(KV, "readwrite", s => { s.delete(key); }); } catch { /* noop */ }
  try { localStorage.removeItem(key); } catch { /* noop */ }
}
export async function kvKeys() {
  try { return await tx(KV, "readonly", s => reqVal(s, "getAllKeys")); } catch { return []; }
}

// ── 写真ストア（dataURL）──────────────────────────
export const makePhotoId = () =>
  "p_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
export async function photoPut(id, dataUrl) {
  try { await tx(PHOTOS, "readwrite", s => { s.put(dataUrl, id); }); return true; } catch { return false; }
}
export async function photoGet(id) {
  if (!id) return null;
  try { const v = await tx(PHOTOS, "readonly", s => reqVal(s, "get", id)); return v ?? null; } catch { return null; }
}
export async function photoDel(id) {
  if (!id) return;
  try { await tx(PHOTOS, "readwrite", s => { s.delete(id); }); } catch { /* noop */ }
}

// ── 日別レコード ──────────────────────────────────
const isDataUrl = v => typeof v === "string" && v.startsWith("data:");

// 保存: meals[].photo(dataURL) → photos ストアへ退避し photoId 参照に
export async function saveDay(day) {
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
  return kvSet(K.day(day.date), { ...day, meals });
}

// 読込: photoId → dataURL を復元
export async function loadDay(date) {
  const day = await kvGet(K.day(date), null);
  if (!day) return null;
  if (Array.isArray(day.meals) && day.meals.some(m => m.photoId)) {
    const meals = [];
    for (const m of day.meals) {
      if (m.photoId) {
        const p = await photoGet(m.photoId);
        meals.push(p ? { ...m, photo: p } : m);
      } else meals.push(m);
    }
    return { ...day, meals };
  }
  return day;
}

export async function listDayDates() {
  const keys = await kvKeys();
  return keys.filter(k => typeof k === "string" && k.startsWith(DAY_PREFIX))
             .map(k => k.slice(DAY_PREFIX.length)).sort();
}

// 軽量読込（写真復元なし・グラフ/バックアップ用）
export async function loadDayLean(date) {
  return kvGet(K.day(date), null);
}
