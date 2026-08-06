#!/usr/bin/env node
// japanese-writing — UserPromptSubmit フック
// モード切替検出 + watch ゲート + 短リマインダ注入

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

function setActiveMode(mode) {
  const stored = mode || 'off';
  return safeWriteFlag(flagPath, stored);
}

function countJapaneseChars(text) {
  const matches = text.match(/[\u3040-\u30ff\u4e00-\u9fff\uff66-\uff9d]/g);
  return matches ? matches.length : 0;
}

function isQuestionLike(prompt) {
  return /(とは|って何|何ですか|何なの|について(?:説明|教えて)|どういう|ですか\s*[？?]?$)/.test(prompt) ||
    /^(?:what|what's|how|why|when|where|who|does|do|did|is|are|can|could|would|should|explain|tell me)\b/i.test(prompt);
}

function isExplicitEditRequest(prompt) {
  return /(推敲|校正|てにをは|読みやすく|リライト|校正して|推敲して)/.test(prompt) ||
    /\b(proofread|rewrite)\b/i.test(prompt);
}

// PR説明・Issue 等。短い依頼でも長さ条件なしで発火する。
function isSharedDocRequest(prompt) {
  if (/gh\s+pr\s+create/i.test(prompt)) return true;
  if (/PRの?(説明|本文|タイトル)/.test(prompt)) return true;
  if (/(プルリクエスト|プルリク)の?(説明|本文|タイトル)?/.test(prompt) &&
      /(作|書|作成|出して|上げて|書いて)/.test(prompt)) return true;
  if (/(PR|プルリク|プルリクエスト)/.test(prompt) &&
      /(作って|作成|書いて|説明|本文|タイトル|出して|上げて|開け)/.test(prompt)) return true;
  if (/\b(create|open|draft|write)\b[\s\S]{0,60}\b(pr|pull request)\b/i.test(prompt)) return true;
  if (/\b(pr|pull request)\b[\s\S]{0,60}\b(create|open|draft|description|body|title|write)\b/i.test(prompt)) return true;
  if (/(Issue|イシュー).{0,12}(起票|を?書|を?作|作成)/.test(prompt)) return true;
  if (/(レビュー返信|follow-?up).{0,12}(書|作|作成|して)/i.test(prompt)) return true;
  return false;
}

function isSelfApplyCandidate(prompt) {
  const ja = countJapaneseChars(prompt);
  const hasJaParagraph = ja >= 40 && /\n/.test(prompt);
  const enoughJa = ja >= 80 || hasJaParagraph;
  if (!enoughJa) return false;

  return /(書いて|まとめ|起票|README|仕様|リリースノート|報告書|記事|ドキュメント)/i.test(prompt) ||
    /(作成|編集|直して|書いてくれ|書いてください)/.test(prompt);
}

function bypassesLengthGate(prompt) {
  return isExplicitEditRequest(prompt) || isSharedDocRequest(prompt);
}

function isExcluded(prompt) {
  const ja = countJapaneseChars(prompt);
  if (ja < 8 && !bypassesLengthGate(prompt)) return true;

  // コードフェンスが大半を占め、日本語依頼が薄い
  const withoutFences = prompt.replace(/```[\s\S]*?```/g, '');
  const jaOutside = countJapaneseChars(withoutFences);
  const fenceLen = prompt.length - withoutFences.length;
  if (fenceLen > prompt.length * 0.7 && jaOutside < 40 && !bypassesLengthGate(prompt)) {
    return true;
  }

  // 英語のみ（ASCII 主体かつ日本語極少）— PR作成など共有文書依頼は例外
  if (ja < 8 && /^[\x00-\x7F\s]+$/.test(prompt) && !bypassesLengthGate(prompt)) {
    return true;
  }

  return false;
}

function gateMatches(prompt) {
  if (isExcluded(prompt)) return false;
  if (bypassesLengthGate(prompt)) return true;
  if (isQuestionLike(prompt)) return false;
  if (isSelfApplyCandidate(prompt)) return true;
  return false;
}

function reminderContext(mode, opts) {
  const label = MODE_TO_LABEL[mode] || mode;
  const selfApply = opts && opts.selfApply;
  const outputMode = LOCKED_MODES.has(mode) ? mode : (selfApply ? 'quick' : 'review');
  let text =
    'japanese-writing 適用 (' + label + ')。' +
    '出力モード目安: ' + outputMode + '。' +
    '意味・数値・条件・モダリティを保護。〔指摘〕と〔助言〕を分離。' +
    '指摘順: 意味・数値 → 構造 → 表記。依頼範囲を超えない。' +
    '自己適用時は診断過程を出さず整えた文だけ。' +
    '詳細は SKILL.md と references/ を読め。' +
    'チャット口調の圧縮は genshijin、共有される日本語本文の編集基準は japanese-writing。';
  if (selfApply) {
    text +=
      ' PR説明・Issue・レビュー返信などの共有本文は自己適用対象。' +
      '診断過程や〔指摘〕列挙は出さず、提出用の本文だけを整える。';
  }
  return text;
}

function emitReminder(mode, opts) {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'UserPromptSubmit',
      additionalContext: reminderContext(mode, opts),
    },
  }));
}

let input = '';
process.stdin.on('data', chunk => { input += chunk; });
process.stdin.on('error', () => process.exit(0));
process.stdin.on('end', () => {
  try {
    const data = JSON.parse(input);
    let prompt = (data.prompt || '').trim();
    let normalized = prompt.toLowerCase().replace(/\s+/g, ' ');

    if (/<scheduled-task\b/.test(normalized)) return;

    let skipNaturalLanguage = false;
    const envelopeName = /<command-name>\s*([^<\s]+)\s*<\/command-name>/.exec(normalized);
    if (envelopeName) {
      if (envelopeName[1].startsWith('/japanese-writing')) {
        const envelopeArgs = /<command-args>\s*([^<]*?)\s*<\/command-args>/.exec(normalized);
        const args = envelopeArgs ? envelopeArgs[1].trim() : '';
        prompt = args ? `${envelopeName[1]} ${args}` : envelopeName[1];
        normalized = prompt.toLowerCase().replace(/\s+/g, ' ');
      } else {
        skipNaturalLanguage = true;
      }
    }
    const lower = normalized;

    // /japanese-writing コマンド
    if (lower.startsWith('/japanese-writing')) {
      const parts = prompt.split(/\s+/);
      const arg = (parts[1] || '').trim().toLowerCase();
      let mode = null;

      if (!arg) {
        mode = 'review';
      } else if (arg === 'off' || arg === 'stop' || arg === 'disable') {
        mode = 'off';
      } else if (VALID_MODES.includes(arg)) {
        mode = arg;
      }

      if (mode === 'off') {
        setActiveMode('off');
      } else if (mode) {
        setActiveMode(mode);
        if (LOCKED_MODES.has(mode) || mode === 'watch') {
          emitReminder(mode);
        }
      }
      return;
    }

    // 自然言語 OFF
    if (!skipNaturalLanguage && (
      /japanese-writing\s*(やめて|解除|停止|オフ|無効)/i.test(prompt) ||
      /推敲モード\s*(解除|やめて|オフ|停止)/.test(prompt) ||
      /\b(stop|disable|turn off|deactivate)\b.*\bjapanese[- ]?writing\b/i.test(lower) ||
      /\bjapanese[- ]?writing\b.*\b(stop|disable|turn off|deactivate)\b/i.test(lower)
    )) {
      setActiveMode('off');
      return;
    }

    // 自然言語で明示ロック（推敲依頼）。watch のままゲートで足りるが、
    // 「推敲モードにして」系は review ロック。
    if (!skipNaturalLanguage &&
        /(推敲モード|校正モード|japanese-writing)\s*(に)?(して|起動|有効|オン)/i.test(prompt) &&
        !/(やめて|解除|停止|オフ|無効)/.test(prompt) &&
        !isQuestionLike(prompt)) {
      setActiveMode('review');
      emitReminder('review');
      return;
    }

    const activeMode = readFlag(flagPath) || getDefaultMode();

    if (!activeMode || activeMode === 'off') return;

    if (LOCKED_MODES.has(activeMode)) {
      emitReminder(activeMode);
      return;
    }

    // watch: ゲート一致時のみ
    if (activeMode === 'watch' && !skipNaturalLanguage && gateMatches(prompt)) {
      emitReminder('watch', { selfApply: isSharedDocRequest(prompt) });
    }
  } catch (e) {
    // silent fail
  }
});
