#!/usr/bin/env node
// japanese-writing — Claude Code SessionStart アクティベーションフック
//
// セッション開始毎:
//   1. フラグファイル $CLAUDE_CONFIG_DIR/.japanese-writing-active 書込
//   2. quick|review|strict のときだけ短いアンカーを hidden context に注入
//   3. watch は監視中の一行のみ（フル SKILL は注入しない）
//   4. off は注入なし

const fs = require('fs');
const path = require('path');
const os = require('os');
const {
  getDefaultMode,
  safeWriteFlag,
  readFlag,
  VALID_MODES,
  LOCKED_MODES,
  MODE_TO_LABEL,
} = require('./japanese-writing-config');

const claudeDir = process.env.CLAUDE_CONFIG_DIR || path.join(os.homedir(), '.claude');
const flagPath = path.join(claudeDir, '.japanese-writing-active');

let source = 'startup';
try {
  if (!process.stdin.isTTY) {
    const raw = fs.readFileSync(0, 'utf8');
    if (raw) {
      const data = JSON.parse(raw);
      if (data && typeof data.source === 'string') source = data.source;
    }
  }
} catch (e) {
  // stdin なし / 不正 → startup 扱い
}

let mode = getDefaultMode();
if (source !== 'startup') {
  const existing = readFlag(flagPath);
  if (existing && VALID_MODES.includes(existing)) mode = existing;
}

if (mode === 'off') {
  safeWriteFlag(flagPath, 'off');
  process.stdout.write('OK');
  process.exit(0);
}

safeWriteFlag(flagPath, mode);

const label = MODE_TO_LABEL[mode] || mode;

if (mode === 'watch') {
  process.stdout.write(
    'japanese-writing 監視中 (watch)。' +
    'ゲート一致時のみ短リマインダを注入する。フル SKILL は注入しない。' +
    '切替: /japanese-writing quick|review|strict|watch|off'
  );
  process.exit(0);
}

if (!LOCKED_MODES.has(mode)) {
  process.stdout.write('OK');
  process.exit(0);
}

let anchor = '';
try {
  anchor = fs.readFileSync(
    path.join(__dirname, '..', 'rules', 'japanese-writing-anchor.md'),
    'utf8'
  );
} catch (e) {
  anchor =
    '日本語長文の編集時: 意味・数値・条件・モダリティを保護。' +
    '〔指摘〕と〔助言〕を分離。指摘順は意味・数値 → 構造 → 表記。' +
    '依頼範囲を超えない。詳細は SKILL.md と references/ を読め。';
}

const body = anchor.replace(/^---[\s\S]*?---\s*/, '').trim();
process.stdout.write(
  'japanese-writing 有効 — モード: ' + label + '\n\n' + body
);
