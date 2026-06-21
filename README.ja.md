# Inbound Stay Ops Kit

[English](README.md) | [한국어](README.ko.md) | [日本語](README.ja.md) | [简体中文](README.zh-CN.md)

外国人ゲストを多く受け入れる宿泊ホスト向けの、オープンソース多言語ゲスト案内キットです。

ホストが承認した宿泊情報やハウスルールをもとに、ゲストの言語で表示されるモバイル案内ページを作れます。追加の質問は、安全なエージェントフローまたはTelegramでのホスト確認に回せます。

## これは何か

```text
ホスト承認済みの宿泊情報
-> 翻訳済みの滞在ガイド
-> モバイル向けゲストページ
-> 任意のTelegramホスト確認
```

## これは何ではないか

- Airbnbスクレイパーではありません
- Airbnb inboxボットではありません
- 予約、決済、返金、レビューの自動化ツールではありません
- Airbnbゲストをプラットフォーム外へ誘導するためのツールではありません
- Kakao / LINE / WhatsApp自動化スターターではありません

## 無料オープンソース範囲

- 静的なゲスト案内ページ
- ホスト承認済みのAirbnbまたは予約プラットフォーム文面から作る翻訳済み滞在ガイド
- エージェントとTelegram bot用の内部FAQ / 回答バンク
- Airbnbまたは他の予約プラットフォームリンク用のホスト承認ソースワークフロー
- ブロック質問とホスト確認質問のための安全ルール
- Telegram Bot adapter
- Telegramによるホスト確認チケット
- 任意のHermes Agent連携ガイド
- CodexまたはClaudeを使う非開発者向けワークブックとプロンプト

## 有料 / カスタム範囲

- Kakao自動連携
- LINE自動連携
- WhatsApp自動連携
- 物件ごとの個別実装
- 価格診断レポート

公式リスティングへの手動リンクは無料キットの範囲です。Telegram以外のメッセンジャー自動連携は含まれません。

## クイックリンク

- 韓国語 quickstart: `docs/quickstart-ko.md`
- 英語 quickstart: `docs/quickstart-en.md`
- 日本語 quickstart: `docs/quickstart-ja.md`
- Airbnbポリシー境界: `docs/airbnb-policy-boundary.md`
- ホストコンテンツワークフロー: `docs/host-content-workflow.md`
- 言語ルーティング: `docs/language-routing.md`
- Telegram dry-run: `docs/telegram-dry-run-rehearsal.md`
- サンプル: `samples/`

## 安全モデル

このキットはAirbnbや予約プラットフォームをスクレイピングしません。

プラットフォームリンクはソース参照としてのみ保存されます。ボットは、ホストが貼り付け、確認し、`config.json`で承認したテキストだけを使用します。

Airbnb滞在の場合、Airbnbがその状況で明示的に許可していない限り、この外部ガイドリンクをAirbnbのリスティング説明やAirbnbメッセージスレッドに入れないでください。このキットは、Airbnbに貼り戻せる翻訳済み案内文を作る、または施設内QRコードなど任意の滞在中リソースとして提供する用途に向いています。

詳しくは `docs/airbnb-policy-boundary.md` を確認してください。

このキットは以下を行いません。

- Airbnbパスワードの要求
- 予約プラットフォームへのログイン
- 非公開ゲストメッセージのスクレイピング
- 予約、返金、キャンセル、決済、法務、安全判断の自動送信
- 予約/決済/返金フローを予約プラットフォーム外へ移動
- 滞在利用のためにゲストへAirbnb外への移動、Telegramインストール、別アカウント作成を強制

## クイックスタート

このフォルダでローカル静的サーバーを起動し、次を開きます。

```text
host-setup.html
```

1. ローカルWebサーバーから `host-setup.html` を開きます。
2. ホスト承認済みのリスティング文面と滞在ルールを貼り付けます。
3. 生成されたCodex / Hermesプロンプトをコピーします。
4. CodexまたはHermesに、確認用の `config.json` を作成してもらいます。
5. 公開前に `approvedStayGuide` を確認します。この内容がゲストの言語で表示されます。
6. `npm test` を実行します。
7. ローカルWebサーバーから `index.html` を開くか、静的サイトとしてデプロイします。
8. Telegramを使う場合は `docs/telegram-host-handoff.md` に従います。

ドキュメントベースの流れも使えます。

1. `config.example.json` を `config.json` にコピーします。
2. `host-workbook/host-info-form.md` を記入します。
3. 公開リスティング文面を `host-workbook/platform-source-form.md` に貼り付けます。
4. CodexまたはClaudeに `ai-prompts/01-build-config-from-host-workbook.md` を実行してもらいます。

ホストコンテンツ全体の流れは `docs/host-content-workflow.md` を確認してください。

ゲスト言語の自動選択は `docs/language-routing.md` を確認してください。

## サンプルを試す

```bash
cp samples/seoul-guesthouse.config.json config.json
```

次を開きます。

```text
index.html?lang=en
index.html?lang=ja
index.html?lang=ko
```

## フォルダ構成

```text
config.example.json              ホスト承認済み物件設定と翻訳ガイドのサンプル
index.html                       ゲスト案内ページ
host-setup.html                  ホスト向けブラウザ設定ウィザード
assets/                          ブラウザUI
lib/                             共通guest-opsロジック
tests/                           安全性と言語ルーティングのテスト
adapters/telegram/               無料Telegram Bot adapter
host-workbook/                   ホスト入力フォーム
ai-prompts/                      CodexまたはClaude用プロンプト
docs/                            設定と境界の文書
templates/                       再利用可能なポリシーとHermesプロンプト
```

## コマンド

```bash
npm test
node --check assets/app.js
node --check assets/host-setup.js
node --check lib/guest-ops.js
node --check lib/language.js
node --check lib/setup-builder.js
```

Telegram adapter:

```bash
cd adapters/telegram
node dry-run-handoff.mjs
npm start
```

## リリース

公開前に `RELEASE_CHECKLIST.md` を確認してください。

