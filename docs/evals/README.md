# evals

スキル変更の効果を、植え込みシグナルと保護対象で測る。

## ディレクトリ

```text
evals/
├── README.md
├── YYYY-MM-DD-<topic>.md          # 評価レポート（採点結果）
└── fixtures/
    └── <suite>/
        ├── input.md               # 原文（癖・保護対象を植え込み）
        └── revised.md             # 適用結果（参考。正とは限らない）
```

短文ケースのように本文が短いものは、レポート内に原文を直書きしてよい。長文は `fixtures/<suite>/` に分ける。

## ファイル名

`YYYY-MM-DD-<topic>.md` とする。同一日に短文と長文があるときは topic で区別する（例: `stop-slop` / `stop-slop-longform`）。

## 採点

| 判定 | 意味 |
|---|---|
| HIT | 期待した癖を検出し、意味を保ったまま直した／〔指摘〕にした |
| PARTIAL | 検出したが直し方が弱い、または〔助言〕止まりで修正文に残った |
| MISS | 期待した癖を見逃した |
| FP | 直すべきでない箇所を直した |
| OK | ネガティブケース・保護対象を正しく温存した |

手順の目安:

1. 別エージェントに `SKILL.md` と必要な `references/` を読ませる
2. `review` で推敲させる（評価者が書いた期待結果は見せない）
3. 植え込みシグナルと保護対象で採点する
4. PARTIAL / MISS はルール文言の改善候補として `design/rationale.md` または `CLAUDE.md` に残す

## 一覧

| レポート | 内容 |
|---|---|
| [2026-08-06-stop-slop.md](2026-08-06-stop-slop.md) | stop-slop 取り込み後の短文 12 ケース |
| [2026-08-06-stop-slop-longform.md](2026-08-06-stop-slop-longform.md) | 同、長文パイロット報告（約 1,200 字） |
