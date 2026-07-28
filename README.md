# japanese-writing

日本語の文章を、意味を変えずに明確で読みやすく編集する Claude 用スキル。

他者が書いた原稿の推敲・校正と、Claude 自身が日本語の長文を出力する前の自己適用の両方に使う。

## ファイル構成

```
japanese-writing/
├── SKILL.md                        # 編集ワークフロー、出力モード、安全上の境界
├── README.md                       # このファイル。概要、インストール、使用例、参考資料
├── CLAUDE.md                       # スキル開発・保守用。設計方針、既知の課題
├── references/
│   ├── document-structure.md       # 文書全体の構成、見出し、段落の設計
│   ├── genre-guidance.md           # 文書種別ごとの編集強度
│   └── claude-tics.md              # 生成AI特有の日本語の癖と修正例
└── docs/
    ├── design-rationale.md         # 参考資料をどう設計に反映したか
    └── document-structure-research.md  # 文書構成の規則の根拠と出典
```

## インストール

[skills CLI](https://github.com/vercel-labs/skills) を使う。ユーザー全体で使う場合は `-g` を付ける。

```
npx skills add malanjp/japanese-writing -g -a claude-code
```

特定のリポジトリでだけ使う場合は `-g` を外す。`.claude/skills/` 配下に入る。

更新と削除も CLI から行える。

```
npx skills update japanese-writing
npx skills remove japanese-writing
```

CLI を使わない場合は、直接配置してもよい。

```
git clone git@github.com:malanjp/japanese-writing.git ~/.claude/skills/japanese-writing
```

配置後、Claude Code を再起動すると読み込まれる。

## 使い方

推敲、校正、リライトを依頼すると自動で参照される。スキル名を明示する必要はない。

- 「この文章を推敲して」
- 「てにをはを直して」
- 「読みやすくして」

編集強度は文書種別に応じて自動で選ばれる。障害対応手順や契約文など、安全上の境界に該当する文書は `strict` になる。

出力モードは 3 段階ある。指定しなければ `review` になる。

- `quick`: 修正文だけを返す
- `review`: 修正文に加えて、変更点と意味保持チェックを返す
- `strict`: 原文の不明点、保護対象、警告を含める。意味が変わり得る箇所は修正せず確認事項にする

## 使用例

社内向けの報告文を `review` で推敲した場合。

**原文**

> 先日実施いたしましたシステムメンテナンスにつきまして、その結果をご報告させていただきます。今回の対応により、レスポンス速度が大幅に改善され、ユーザー体験の向上、運用コストの削減、および将来的な拡張性の確保が期待されます。なお、一部の機能につきましては、引き続き調査を行っている状況でございます。

**修正文**

> システムメンテナンスの結果を報告します。今回の対応でレスポンス速度が改善しました。一部の機能は引き続き調査中です。

**指摘と助言**

```text
〔指摘〕「大幅に改善」の根拠となる数値がない。計測値があれば示す。なければ「改善した」にとどめる
〔指摘〕「先日」は読み手によって指す日が変わる。実施日を書く
〔助言〕「ユーザー体験の向上、運用コストの削減、拡張性の確保」は検証できない三項列挙。効果を一つに絞るか、根拠を添える
〔助言〕「ご報告させていただきます」は冗長。「報告します」で足りる
```

意味・数値に関わる指摘を先頭に置き、表記の指摘を後ろに回す。実施日と計測値は原文にないため、補わずに確認事項として残している。

## 参考資料

各資料をスキルにどう反映したかは [docs/design-rationale.md](docs/design-rationale.md) に記載する。
文書構成の規則の根拠は [docs/document-structure-research.md](docs/document-structure-research.md) にまとめた。

### 日本語の文章規範

- 在留支援のためのやさしい日本語ガイドライン（出入国在留管理庁・文化庁, 2020）
  https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/92484001.html
  PDF: https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/pdf/93869301_01.pdf
- 柴崎秀子（2014）「リーダビリティー研究と「やさしい日本語」」日本語教育 158, pp.49-65
  https://doi.org/10.20721/nihongokyoiku.158.0_49
- 村田匡輝, 大野誠寛, 松原茂樹（2010）「日本語テキストにおける読点位置の検出」言語処理学会年次大会発表論文集
  https://www.anlp.jp/proceedings/annual_meeting/2010/pdf_dir/D3-7.pdf
  https://nagoya.repo.nii.ac.jp/records/13301
- k16shikano / japanese-tech-writing（Unlicense）
  https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d
- k16shikano / cognitive-rhythm-writing（Unlicense）
  https://gist.github.com/k16shikano/eb2929f13ed19c97188393d297be8432

### ツール

- textlint
  https://github.com/textlint/textlint
  https://textlint.org/

### 類似スキル

- Forest-Project-Lab / jp-writing-skills（MIT）
  https://github.com/Forest-Project-Lab/jp-writing-skills
- sanoakr / ai-skills（`ja-proofreading`）
  https://github.com/sanoakr/ai-skills
- ultimatile / dotfiles（`.claude/skills/japanese-writing`）
  https://github.com/ultimatile/dotfiles

### その他

- Suvarna, A., Khandelwal, H., & Peng, N. (2024) PhonologyBench: Evaluating Phonological Skills of Large Language Models
  https://arxiv.org/abs/2404.02456

### 採用しなかった資料

- 「テキストの多様性をとらえる分類指標の体系化の試み（2）」言語処理学会年次大会 2012, P2-2
  https://www.anlp.jp/proceedings/annual_meeting/2012/pdf_dir/P2-2.pdf
- 「小説における文体印象解析の試み」言語処理学会年次大会 2008, A2-1
  https://www.anlp.jp/proceedings/annual_meeting/2008/pdf_dir/A2-1.pdf
- 「統計分析からみた水村美苗著『続明暗』の文体模倣」計量国語学 32(1)
  https://www.jstage.jst.go.jp/article/mathling/32/1/32_19/_article/-char/ja/
