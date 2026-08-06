---
name: japanese-writing
description: 日本語の文章を、意味を変えずに明確で読みやすく編集するスキル。You MUST invoke this skill BEFORE writing or editing any Japanese text longer than 3 sentences that will be shared with humans — Linear の Issue 起票 / コメント / follow-up、GitHub の PR タイトル / description / レビュー返信、docs/ 配下の Markdown、ADR、README、仕様書、報告書、リリースノート、業務メール、Slack への長文、解説記事、SNS 文の作成・推敲・校正・リライトを含む。他者の原稿を直す依頼（「推敲して」「校正して」「てにをはを直して」「読みやすくして」「この文章どう？」「日本語で書いて」proofread / rewrite in Japanese）でも、スキル名が明示されなくても必ず参照する。Claude 自身が日本語の長文を出力する前にも参照し、翻訳調・冗長な定型表現・過剰な列挙・空の前置き・言い換えだけのまとめ・二項対立の定型・偽の行為者・平坦な密度といった生成 AI 特有の癖を避ける。長文では結論位置・既知から新情報・チャンク化など認知しやすい順序も整える。構造、論理、係り受け、用語、表記を改善し、確定的な指摘と文脈依存の助言を分ける。短い返答・単文の確認質問・コード / コマンド出力・体言止めの原始人モード応答には不要。
---

# 日本語文章作成（プラグイン入口）

規則の正本はリポジトリルートの [`SKILL.md`](../../SKILL.md) である。このファイルは Claude Code プラグインが `skills/` 配下を読むための入口にすぎない。規則本文をここへ複製しない。

直ちにルートの `SKILL.md` を開き、その手順に従う。必要に応じて同階層の `references/` も読む。

- [`SKILL.md`](../../SKILL.md)
- [`references/document-structure.md`](../../references/document-structure.md)
- [`references/claude-tics.md`](../../references/claude-tics.md)
- [`references/communication-clarity.md`](../../references/communication-clarity.md)
- [`references/genre-guidance.md`](../../references/genre-guidance.md)

ドリフト防止用の短い要約は [`rules/japanese-writing-anchor.md`](../../rules/japanese-writing-anchor.md)。フックが注入するのはアンカー側だけで、正本の代替ではない。
