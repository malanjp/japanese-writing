---
description: japanese-writing モード切替（quick/review/strict/watch/off）
argument-hint: "[quick|review|strict|watch|off]"
---

japanese-writing を $ARGUMENTS に切替。指定なしなら review でロック。

- quick / review / strict: 毎ターン短リマインダ。出力モードは引数どおり
- watch: ゲート監視（既定）。日本語長文・推敲依頼時だけリマインダ
- off: 完全停止

規則の正本は SKILL.md。フックは短いアンカーのみ注入する。
