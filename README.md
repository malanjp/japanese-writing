# japanese-writing

日本語の文章を、意味を変えずに明確で読みやすく編集する Claude 用スキル。

他者が書いた原稿の推敲・校正と、Claude 自身が日本語の長文を出力する前の自己適用の両方に使う。自己適用では、冗長な定型・空の前置き・過剰な三項列挙に加え、二項対立の定型や偽の行為者といった生成 AI 特有の癖も除く。

## ファイル構成

```text
japanese-writing/
├── SKILL.md                        # 編集ワークフロー、出力モード、安全上の境界
├── README.md                       # このファイル。概要、インストール、使い方、使用例、参考資料
├── CLAUDE.md                       # スキル開発・保守用。設計方針、既知の課題
├── references/
│   ├── document-structure.md       # 文書全体の構成、見出し、段落の設計
│   ├── genre-guidance.md           # 文書種別ごとの編集強度
│   ├── claude-tics.md              # 生成AI特有の癖（stop-slop 由来の構造パターンを含む）
│   └── communication-clarity.md    # 用語導入、翻訳、根拠、作業報告などの伝達の明確さ
└── docs/
    ├── README.md                   # docs の目次
    ├── design/                     # 設計の根拠・参考資料の反映記録
    └── evals/                      # 効果検証レポートとフィクスチャ
```

## インストール

[skills CLI](https://github.com/vercel-labs/skills) を使う。`-g` を付けると `~/.claude/skills/` に入り、すべてのプロジェクトで使える。

```bash
npx skills add malanjp/japanese-writing -g -a claude-code
```

特定のリポジトリでだけ使う場合は `-g` を外す。そのリポジトリの `.claude/skills/` に入る。

更新と削除も CLI から行える。

```bash
npx skills update japanese-writing
npx skills remove japanese-writing
```

CLI を使わない場合は、直接配置してもよい。

```bash
git clone git@github.com:malanjp/japanese-writing.git ~/.claude/skills/japanese-writing
```

配置後、Claude Code を再起動すると読み込まれる。

## 使い方

推敲、校正、リライトを依頼すると自動で参照される。スキル名を明示する必要はない。

- 「この文章を推敲して」
- 「てにをはを直して」
- 「読みやすくして」

出力モードは 3 段階ある。指定しなければ `review` になる。

- `quick`: 修正文のみ。必要なら短い注意を一つ添える
- `review`: 修正文、確定的な指摘、任意の助言、意味保持チェック
- `strict`: 原文の不明点、保護対象、変更差分、警告。意味が変わり得る箇所は修正せず確認事項にする

契約文や障害対応手順など安全上の境界に該当する文書と、読み手が内容を根拠に取り消しにくい判断を行う文書は、指定がなくても `strict` になる。数値を引用するだけの技術記事や社内の週報は該当しない。これらの文書で `quick` を指定した場合も、意味に関わる警告は添える。

## 使用例

社内向けの報告文を `review` で推敲した例を示す。

**原文**

> 先日実施いたしましたシステムメンテナンスにつきまして、その結果をご報告させていただきます。今回の対応により、レスポンス速度が大幅に改善され、ユーザー体験の向上、運用コストの削減、および将来的な拡張性の確保が期待されます。なお、一部の機能につきましては、引き続き調査を行っている状況でございます。問題はインフラではない。運用設計だ。そこにこそ改善の本質があります。

**修正文**

> 先日実施したシステムメンテナンスの結果を報告します。今回の対応でレスポンス速度が大幅に改善しました。一部の機能は引き続き調査中です。問題は運用設計である。

**指摘と助言**

```text
〔指摘〕「大幅に」の程度を裏づける計測値が原文にない。改善幅を示すか、示せなければ「改善した」に直す。原文だけでは判断が付かないため修正文では変更していない
〔指摘〕「先日」は読み手によって指す日が変わる。実施日に置き換える。日付が原文にないため補っていない
〔助言〕「ご報告させていただきます」は冗長。「報告します」で足りる
```

同義の三項列挙（ユーザー体験・運用コスト・拡張性）と二項対立の定型（「インフラではない。運用設計だ。本質がある」）は、〔助言〕に残さず修正文から削っている。削ったのは検証できない期待効果と転換演出で、実施済みの対応と現状の報告は残している。

意味・数値に関わる指摘を先頭に置き、表記の指摘を後ろに回す。「大幅に」と「先日」は意味に関わるため、修正せず確認事項として残している。

## 参考資料

各資料をスキルにどう反映したかは [docs/design/rationale.md](docs/design/rationale.md) に記載する。
文書構成の規則の根拠は [docs/design/document-structure-research.md](docs/design/document-structure-research.md) にまとめた。
効果検証は [docs/evals/](docs/evals/) を参照する。

### 日本語の文章規範

- 在留支援のためのやさしい日本語ガイドライン（出入国在留管理庁・文化庁, 2020）
  掲載ページ: https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/92484001.html
  PDF: https://www.bunka.go.jp/seisaku/kokugo_nihongo/kyoiku/pdf/93869301_01.pdf
- 柴崎秀子（2014）「リーダビリティー研究と「やさしい日本語」」日本語教育 158, pp.49-65
  https://doi.org/10.20721/nihongokyoiku.158.0_49
- 村田匡輝, 大野誠寛, 松原茂樹（2010）「日本語テキストにおける読点位置の検出」言語処理学会年次大会発表論文集
  PDF: https://www.anlp.jp/proceedings/annual_meeting/2010/pdf_dir/D3-7.pdf
  リポジトリ: https://nagoya.repo.nii.ac.jp/records/13301
- k16shikano / japanese-tech-writing（Unlicense）
  https://gist.github.com/k16shikano/fd287c3133457c4fd8f5601d34aa817d
- k16shikano / cognitive-rhythm-writing（Unlicense）
  https://gist.github.com/k16shikano/eb2929f13ed19c97188393d297be8432

### ツール

- textlint
  リポジトリ: https://github.com/textlint/textlint
  公式サイト: https://textlint.org/

### 類似スキル

- Forest-Project-Lab / jp-writing-skills（MIT）
  https://github.com/Forest-Project-Lab/jp-writing-skills
- sanoakr / ai-skills（`ja-proofreading`）
  https://github.com/sanoakr/ai-skills
- ultimatile / dotfiles（`.claude/skills/japanese-writing`）
  https://github.com/ultimatile/dotfiles
- mathbullet / skills（`ja-text-communication`）
  https://github.com/mathbullet/skills/blob/main/plugins/ja-text-communication/skills/ja-text-communication/SKILL.md
- hardikpandya / stop-slop（MIT）
  https://github.com/hardikpandya/stop-slop
  AI 定型の除去。日本語で再現する構造パターンを `claude-tics.md` に取り込み済み。副詞全面禁止・採点制・リズム固定は採っていない（[docs/design/rationale.md](docs/design/rationale.md)）

### 言語モデルの音韻能力

- Suvarna, A., Khandelwal, H., & Peng, N. (2024) PhonologyBench: Evaluating Phonological Skills of Large Language Models
  https://arxiv.org/abs/2404.02456

### 採用しなかった資料

- 「テキストの多様性をとらえる分類指標の体系化の試み（2）」言語処理学会年次大会 2012, P2-2
  https://www.anlp.jp/proceedings/annual_meeting/2012/pdf_dir/P2-2.pdf
- 「小説における文体印象解析の試み」言語処理学会年次大会 2008, A2-1
  https://www.anlp.jp/proceedings/annual_meeting/2008/pdf_dir/A2-1.pdf
- 「統計分析からみた水村美苗著『続明暗』の文体模倣」計量国語学 32(1)
  https://www.jstage.jst.go.jp/article/mathling/32/1/32_19/_article/-char/ja/
