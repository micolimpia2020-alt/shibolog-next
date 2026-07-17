// AI食事分析エンドポイント（写真 or テキスト）
// 必要な環境変数: ANTHROPIC_API_KEY（Vercelのプロジェクト設定で追加）
// 任意: APP_SECRET を設定すると x-app-key ヘッダー一致を要求（簡易保護）

const SYSTEM = `あなたは日本の管理栄養士アシスタントです。食事の写真またはテキスト説明から、食材ごとの栄養素を推定します。
必ず次のJSONだけを出力してください（説明文・コードフェンス禁止）:
{"name":"料理名(日本語・簡潔)","items":[{"name":"食材名","grams":数値,"kcal":数値,"protein":数値,"fat":数値,"carb":数値,"fiber":数値,"salt":数値}],"confidence":0から1}
ルール: 量(g)は見た目から現実的に推定。saltは食塩相当量(g)。日本の一般的な食品成分値を使う。不確かでも最善の推定を出す。品数は最大8個。`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return res.status(503).json({ error: "AIが未設定です（Vercelの環境変数 ANTHROPIC_API_KEY を設定してください）" });

  if (process.env.APP_SECRET && req.headers["x-app-key"] !== process.env.APP_SECRET) {
    return res.status(401).json({ error: "認証エラー" });
  }

  const { image, text, note } = req.body || {};
  if (!image && !text) return res.status(400).json({ error: "image または text が必要です" });

  const content = [];
  if (image) {
    const m = /^data:(image\/\w+);base64,(.+)$/.exec(image);
    if (!m) return res.status(400).json({ error: "画像形式が不正です" });
    content.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
  }
  const instruction = [
    image ? "この食事写真を分析してください。" : "",
    text ? `食事の内容: ${String(text).slice(0, 1000)}` : "",
    note ? `補足メモ: ${String(note).slice(0, 500)}` : "",
  ].filter(Boolean).join("\n");
  content.push({ type: "text", text: instruction });

  try {
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: process.env.AI_MODEL || "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        system: SYSTEM,
        messages: [{ role: "user", content }],
      }),
    });
    if (!r.ok) {
      const err = await r.text();
      console.error("anthropic error", r.status, err.slice(0, 300));
      return res.status(502).json({ error: "AI分析に失敗しました。少し待って再試行してください。" });
    }
    const data = await r.json();
    const raw = (data.content || []).map(c => c.text || "").join("");
    const jsonStr = raw.replace(/^```json?\s*/i, "").replace(/```\s*$/, "").trim();
    const start = jsonStr.indexOf("{");
    const end = jsonStr.lastIndexOf("}");
    const parsed = JSON.parse(jsonStr.slice(start, end + 1));
    if (!parsed.name || !Array.isArray(parsed.items)) throw new Error("bad shape");
    // 数値化・上限ガード
    parsed.items = parsed.items.slice(0, 10).map(it => ({
      name: String(it.name || "").slice(0, 40),
      grams: +it.grams || 0, kcal: +it.kcal || 0,
      protein: +it.protein || 0, fat: +it.fat || 0, carb: +it.carb || 0,
      fiber: +it.fiber || 0, salt: +it.salt || 0,
      estimated: true,
    }));
    return res.status(200).json(parsed);
  } catch (e) {
    console.error("analyze error", e.message);
    return res.status(500).json({ error: "分析結果の解析に失敗しました。もう一度お試しください。" });
  }
}
