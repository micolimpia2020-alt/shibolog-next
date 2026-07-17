# しぼログNEXT（仮称）

AI食事分析 × カロリー・PFC・体調管理のダイエットサポートアプリ。
既存の「しぼログ」とは別プロダクト（既存アプリ・既存ユーザーには影響なし）。

## 構成
- React 18 + Vite / PWA / Capacitor 8（Android土台込み）
- データ保存: IndexedDB（日別レコード分割・写真は専用ストアに分離）
- 軽量データはlocalStorageにもミラー保存（二重化）
- バックアップ: JSONエクスポート / インポート（**旧しぼログv3形式にも対応**）/ 復元・リセット前の安全バックアップ / Android実機では日次自動バックアップ（Documents/shibolog_next_backups、7世代）

## 開発
```
npm install
npm run dev      # 開発サーバー
npm test         # データ層テスト
npm run build    # 本番ビルド
npm run android:sync  # Androidへ同期
```
GitHubへpushすると Actions で debug APK が自動ビルドされます。

## 実装済み（v0.1）
ホーム（残りkcalリング・PFC残量・食物繊維/食塩・週カレンダー・食事リスト）/
食事追加（手動・写真・マイミール）/ 食事詳細（食材別内訳・量g変更で自動再計算）/
体調記録（体重・体脂肪・気分＋設定でON/OFFできる6項目）/ マイミール / 設定（目標自動計算・記録項目・データ管理）

## 今後（仕様書 shibolog_v4_仕様書.md 参照）
P2: 課金基盤(RevenueCat) → P3: AI食事分析(Vercelプロキシ) → P4: ヤセメシ提案 → P5: 筋トレ提案 → P6: ストア販売
