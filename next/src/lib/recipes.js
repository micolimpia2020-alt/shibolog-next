// 食事メニュー提案DB
// ここに MICO's Recipe Planner の103品データを差し替え可能（同じ形式で追加するだけ）
// tag: home=おうちごはん / trainee=トレーニー
export const RECIPES = [
  { id: "r1", name: "鶏むねの塩麹焼きプレート", tag: ["trainee"], kcal: 420, p: 42, f: 8, c: 45, ingredients: ["鶏むね肉150g", "塩麹大さじ1", "ごはん120g", "ブロッコリー"], steps: ["鶏むねを塩麹に30分漬ける", "フライパンで両面焼く", "ごはん・茹でブロッコリーと盛る"], point: "高タンパク低脂質の定番" },
  { id: "r2", name: "鶏ハムとアスパラの梅だれ", tag: ["trainee", "home"], kcal: 380, p: 40, f: 6, c: 42, ingredients: ["鶏むね肉150g", "アスパラ4本", "梅干し1個", "ごはん100g"], steps: ["鶏むねを低温調理またはレンジで鶏ハムに", "アスパラを焼く", "叩いた梅をのせる"], point: "さっぱり食べられる減量メシ" },
  { id: "r3", name: "サバ缶と豆腐のレンジ蒸し", tag: ["home"], kcal: 350, p: 30, f: 18, c: 12, ingredients: ["サバ水煮缶1/2", "絹豆腐150g", "ねぎ", "ポン酢"], steps: ["豆腐とサバ缶を耐熱皿に", "レンジ600Wで3分", "ねぎとポン酢をかける"], point: "良質な脂質オメガ3が摂れる" },
  { id: "r4", name: "オートミール鶏がゆ", tag: ["trainee", "home"], kcal: 320, p: 28, f: 5, c: 40, ingredients: ["オートミール40g", "鶏むねひき肉80g", "卵1個", "鶏がらスープ"], steps: ["材料を鍋またはレンジで煮る", "卵でとじる"], point: "食物繊維たっぷりの温メシ" },
  { id: "r5", name: "豚ヒレのしょうが焼き", tag: ["home"], kcal: 400, p: 35, f: 10, c: 40, ingredients: ["豚ヒレ肉130g", "しょうが", "玉ねぎ1/2", "ごはん100g"], steps: ["豚ヒレを薄切りにして焼く", "しょうがだれを絡める"], point: "豚はヒレなら低脂質" },
  { id: "r6", name: "卵とブロッコリーのオムレツ", tag: ["home"], kcal: 280, p: 22, f: 16, c: 8, ingredients: ["卵2個", "ブロッコリー", "チーズ少量"], steps: ["ブロッコリーを茹でる", "卵と混ぜて焼く"], point: "朝食にちょうどいい" },
  { id: "r7", name: "鮭ときのこのホイル焼き", tag: ["home"], kcal: 330, p: 28, f: 12, c: 25, ingredients: ["生鮭1切れ", "しめじ・えのき", "バター5g", "ごはん80g"], steps: ["ホイルに鮭ときのこを包む", "トースターで15分"], point: "洗い物が少ない" },
  { id: "r8", name: "高野豆腐の卵とじ丼", tag: ["home"], kcal: 390, p: 26, f: 10, c: 48, ingredients: ["高野豆腐2枚", "卵1個", "めんつゆ", "ごはん120g"], steps: ["高野豆腐を戻して煮る", "卵でとじて丼に"], point: "植物性タンパクで安い" },
  { id: "r9", name: "ささみとキャベツのレンジ蒸し", tag: ["trainee"], kcal: 250, p: 35, f: 3, c: 15, ingredients: ["ささみ3本", "キャベツ1/4", "ごまだれ"], steps: ["キャベツの上にささみをのせレンジ5分", "ほぐしてたれをかける"], point: "夜遅い日の低カロリーメシ" },
  { id: "r10", name: "炊飯器カレー風チキンライス", tag: ["trainee"], kcal: 520, p: 45, f: 8, c: 68, ingredients: ["鶏むね肉200g", "米100g", "カレー粉", "乾燥わかめ・きのこ"], steps: ["炊飯器に全部入れて炊く", "混ぜて完成"], point: "1食で完結する炊飯器メシ" },
  { id: "r11", name: "ツナと卵のオートミールリゾット", tag: ["trainee", "home"], kcal: 340, p: 30, f: 8, c: 38, ingredients: ["オートミール40g", "ツナ水煮缶", "卵1個", "トマト缶1/2"], steps: ["トマト缶とオートミールを煮る", "ツナと卵を加える"], point: "トマトで満足感アップ" },
  { id: "r12", name: "厚揚げのねぎ味噌焼き", tag: ["home"], kcal: 300, p: 18, f: 20, c: 12, ingredients: ["厚揚げ1枚", "味噌", "ねぎ"], steps: ["厚揚げにねぎ味噌を塗る", "トースターで7分"], point: "小腹満たしにも" },
  { id: "r13", name: "えびとブロッコリーの塩炒め", tag: ["trainee"], kcal: 260, p: 32, f: 6, c: 18, ingredients: ["むきえび150g", "ブロッコリー", "にんにく", "ごま油小さじ1"], steps: ["にんにくを炒め香りを出す", "えびとブロッコリーを炒める"], point: "低脂質高タンパクの王道" },
  { id: "r14", name: "納豆キムチ豆腐丼", tag: ["home"], kcal: 380, p: 24, f: 12, c: 45, ingredients: ["納豆1パック", "キムチ", "絹豆腐100g", "ごはん100g", "卵黄"], steps: ["ごはんに全部のせる"], point: "発酵食品で腸活・調理不要" },
  { id: "r15", name: "鶏むねのタンドリー風", tag: ["trainee"], kcal: 400, p: 44, f: 9, c: 35, ingredients: ["鶏むね肉180g", "ヨーグルト大さじ2", "カレー粉", "ごはん80g"], steps: ["ヨーグルトとカレー粉に漬ける", "フライパンで焼く"], point: "漬けて焼くだけ" },
  { id: "r16", name: "しらたき担々風スープ", tag: ["home"], kcal: 290, p: 22, f: 14, c: 20, ingredients: ["しらたき1袋", "鶏ひき肉80g", "豆乳", "味噌・ラー油少々"], steps: ["ひき肉を炒める", "豆乳と味噌で煮てしらたきを加える"], point: "麺気分でも低糖質" },
  { id: "r17", name: "カッテージチーズのフルーツボウル", tag: ["home", "trainee"], kcal: 220, p: 18, f: 4, c: 30, ingredients: ["カッテージチーズ100g", "冷凍ベリー", "はちみつ小さじ1", "オートミール20g"], steps: ["器に盛るだけ"], point: "甘いもの欲対策に" },
  { id: "r18", name: "牛赤身ステーキ丼", tag: ["trainee"], kcal: 480, p: 40, f: 14, c: 48, ingredients: ["牛もも赤身150g", "ごはん120g", "わさび醤油"], steps: ["赤身を強火で焼く", "スライスして丼に"], point: "鉄分補給・ご褒美メシ" },
];

// 食材名で検索（部分一致）
export function searchRecipes(query, tag) {
  const q = (query || "").trim();
  return RECIPES.filter(r => {
    if (tag && !r.tag.includes(tag)) return false;
    if (!q) return true;
    return r.name.includes(q) || r.ingredients.some(i => i.includes(q));
  });
}

// 残りkcalに収まる順に並べる
export function sortByFit(list, remainingKcal) {
  return [...list].sort((a, b) => {
    const fa = a.kcal <= remainingKcal ? 0 : 1;
    const fb = b.kcal <= remainingKcal ? 0 : 1;
    return fa - fb || Math.abs(remainingKcal - a.kcal) - Math.abs(remainingKcal - b.kcal);
  });
}
