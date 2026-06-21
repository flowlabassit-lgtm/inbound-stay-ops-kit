# クイックスタート

Inbound Stay Ops Kit は、外国人ゲストを受け入れる宿泊ホスト向けの多言語ゲスト案内キットです。

## 最初に確認してください

Airbnb の宿泊施設では、Airbnb が明示的に許可している場合を除き、外部ガイドリンクを Airbnb のリスティング説明や Airbnb メッセージに入れないでください。このキットは、翻訳済みの案内文を作成して Airbnb 内に貼り戻す、または宿泊施設内の任意の QR/案内資料として使う想定です。

## 5分の流れ

1. ローカルサーバーで `host-setup.html` を開きます。
2. 宿泊施設名、エリア、対応言語を入力します。
3. Airbnb または予約プラットフォームの説明文をホスト自身が貼り付けます。
4. 生成された Codex / Hermes 用プロンプトをコピーします。
5. Codex または Hermes に `config.json` の作成を依頼します。
6. `approvedStayGuide` をホストが確認します。
7. `index.html?lang=ko`, `index.html?lang=en`, `index.html?lang=ja` を確認します。

## コマンド

```bash
npm test
```

Telegram dry-run:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
```

## サンプル

```bash
cp samples/osaka-family-stay.config.json config.json
```

## 有料 / カスタム範囲

Kakao、LINE、WhatsApp の自動連携、宿泊施設ごとの実装代行、価格診断レポートは無料オープンソース範囲に含まれません。

