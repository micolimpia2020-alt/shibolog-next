import "fake-indexeddb/auto";
import { test } from "node:test";
import assert from "node:assert/strict";

const store = new Map();
globalThis.localStorage = {
  getItem: k => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: k => store.delete(k),
};

const { saveDay, loadDay, loadDayLean, listDayDates, kvGet, K, photoGet } = await import("../src/lib/storage.js");
const { emptyDay, emptyMeal, dayTotals, scaleItem, mealTotals } = await import("../src/lib/model.js");
const { collectBackupData, restoreBackupData, convertV3, isValidBackup, saveSafetyBackup, getSafetyBackup, resetAll } = await import("../src/lib/backup.js");

const PHOTO = "data:image/png;base64,iVBORw0KGgoAAAA=";

test("日レコード: 写真分離保存→復元", async () => {
  const day = emptyDay("2026-07-16");
  const meal = emptyMeal();
  meal.name = "鶏ハムプレート";
  meal.totals = { kcal: "495", protein: "44", fat: "12", carb: "51", fiber: "2.6", salt: "1.5" };
  meal.photo = PHOTO;
  day.meals = [meal];
  day.body.morning = 62.4;
  assert.ok(await saveDay(day));

  // 保存形にはbase64が無い
  const lean = await loadDayLean("2026-07-16");
  assert.equal(lean.meals[0].photo, undefined);
  assert.ok(lean.meals[0].photoId);
  assert.equal(await photoGet(lean.meals[0].photoId), PHOTO);

  // 読込時は復元される
  const loaded = await loadDay("2026-07-16");
  assert.equal(loaded.meals[0].photo, PHOTO);
  assert.equal(loaded.body.morning, 62.4);
  assert.deepEqual(await listDayDates(), ["2026-07-16"]);
});

test("栄養計算: items優先合計と量スケール", () => {
  const meal = emptyMeal();
  meal.items = [
    { name: "タイ米", grams: 150, kcal: 195, protein: 4, fat: 0.5, carb: 42, fiber: 0.6, salt: 0 },
    { name: "鶏ハム", grams: 120, kcal: 248, protein: 38.2, fat: 7.3, carb: 5, fiber: 0, salt: 1.5 },
  ];
  const t = mealTotals(meal);
  assert.equal(Math.round(t.kcal), 443);
  const scaled = scaleItem(meal.items[0], 300); // 150g→300g で2倍
  assert.equal(scaled.kcal, 390);
  assert.equal(scaled.carb, 84);
  const day = { meals: [meal] };
  assert.equal(Math.round(dayTotals(day).protein), 42);
});

test("バックアップ: エクスポート→リセット→復元", async () => {
  const backup = await collectBackupData();
  assert.equal(backup.__version, "shibolog_next_v1");
  assert.equal(backup.days["2026-07-16"].meals[0].photo, PHOTO); // 埋め込み
  await saveSafetyBackup("test");
  await resetAll();
  assert.equal(await loadDayLean("2026-07-16"), null);
  await restoreBackupData(backup);
  const d = await loadDay("2026-07-16");
  assert.equal(d.meals[0].photo, PHOTO);
  assert.ok(await getSafetyBackup());
});

test("旧しぼログ(v3)バックアップの変換インポート", async () => {
  const v3 = {
    __version: "shibolog_v3",
    profile: { height: "160", weight: "62", fatPct: "25", maintenance: "1900" },
    weeks: [{
      weekLabel: "7/13〜7/19", mondayFull: "2026-7-13",
      days: [
        { date: "7/16", fullKey: "2026-7-16", morning: 62.4, night: null, cal: 495, mood: "😊", note: "メモ",
          training: { done: true, parts: "胸" },
          meals: [{ id: 1, time: "12:00", name: "鶏むね定食", kcal: "495", protein: "44", fat: "12", carb: "51", photo: PHOTO }] },
        { date: "7/17", fullKey: "2026-7-17", morning: null, night: null, cal: null, mood: "", note: "", training: { done: false }, meals: [] },
      ],
    }],
  };
  assert.ok(isValidBackup(v3));
  const conv = convertV3(v3);
  assert.ok(conv.days["2026-07-16"]);
  assert.equal(conv.days["2026-07-17"], undefined, "空の日は取り込まない");
  assert.equal(conv.days["2026-07-16"].meals[0].totals.kcal, "495");

  await resetAll();
  await restoreBackupData(v3);
  const d = await loadDay("2026-07-16");
  assert.equal(d.body.morning, 62.4);
  assert.equal(d.condition.mood, "😊");
  assert.equal(d.meals[0].photo, PHOTO);
  assert.equal(d.meals[0].name, "鶏むね定食");
  const p = await kvGet(K.profile);
  assert.equal(p.height, "160");
});
