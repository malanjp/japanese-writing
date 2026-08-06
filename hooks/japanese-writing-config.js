#!/usr/bin/env node
// japanese-writing — 共有設定リゾルバ
//
// defaultMode の解決順:
//   1. JAPANESE_WRITING_DEFAULT_MODE 環境変数
//   2. 設定ファイル defaultMode:
//      - $XDG_CONFIG_HOME/japanese-writing/config.json
//      - ~/.config/japanese-writing/config.json
//      - %APPDATA%\japanese-writing\config.json
//   3. 'watch'

const fs = require('fs');
const path = require('path');
const os = require('os');

const VALID_MODES = ['off', 'watch', 'quick', 'review', 'strict'];

const LOCKED_MODES = new Set(['quick', 'review', 'strict']);

const MODE_TO_LABEL = {
  watch: '監視',
  quick: 'quick',
  review: 'review',
  strict: 'strict',
  off: 'off',
};

function getConfigDir() {
  if (process.env.XDG_CONFIG_HOME) {
    return path.join(process.env.XDG_CONFIG_HOME, 'japanese-writing');
  }
  if (process.platform === 'win32') {
    return path.join(
      process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'),
      'japanese-writing'
    );
  }
  return path.join(os.homedir(), '.config', 'japanese-writing');
}

function getConfigPath() {
  return path.join(getConfigDir(), 'config.json');
}

function getDefaultMode() {
  const envMode = process.env.JAPANESE_WRITING_DEFAULT_MODE;
  if (envMode && VALID_MODES.includes(envMode.toLowerCase())) {
    return envMode.toLowerCase();
  }

  try {
    const config = JSON.parse(fs.readFileSync(getConfigPath(), 'utf8'));
    if (config.defaultMode && VALID_MODES.includes(config.defaultMode.toLowerCase())) {
      return config.defaultMode.toLowerCase();
    }
  } catch (e) {
    // 設定不在 or 不正 → フォールスルー
  }

  return 'watch';
}

// Symlink-safe フラグ書込。temp + rename、0o600。
function safeWriteFlag(flagPath, content) {
  try {
    const flagDir = path.dirname(flagPath);
    fs.mkdirSync(flagDir, { recursive: true });

    try {
      if (fs.lstatSync(flagPath).isSymbolicLink()) return false;
    } catch (e) {
      if (e.code !== 'ENOENT') return false;
    }

    let tempPath;
    try {
      tempPath = path.join(
        flagDir,
        `.japanese-writing-active.${process.pid}.${Date.now()}.${Math.random().toString(16).slice(2)}`
      );
      const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
      const flags = fs.constants.O_WRONLY | fs.constants.O_CREAT | fs.constants.O_EXCL | O_NOFOLLOW;
      let fd;
      try {
        fd = fs.openSync(tempPath, flags, 0o600);
        fs.writeSync(fd, String(content));
        try { fs.fchmodSync(fd, 0o600); } catch (e) { /* Windows best-effort */ }
      } finally {
        if (fd !== undefined) fs.closeSync(fd);
      }

      let renamed = false;
      let windowsPrevious = null;
      let windowsRemovedOriginal = false;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          fs.renameSync(tempPath, flagPath);
          renamed = true;
          break;
        } catch (e) {
          const transient = ['EPERM', 'EBUSY', 'EACCES', 'EEXIST'].includes(e.code);
          if (!transient) throw e;
          if (process.platform === 'win32') {
            if (windowsRemovedOriginal) break;
            try {
              const current = fs.lstatSync(flagPath);
              if (current.isSymbolicLink() || !current.isFile()) return false;
              if (windowsPrevious === null) {
                windowsPrevious = fs.readFileSync(flagPath);
              }
              fs.unlinkSync(flagPath);
              windowsRemovedOriginal = true;
            } catch (unlinkError) {
              if (unlinkError.code !== 'ENOENT') continue;
            }
          }
        }
      }
      if (!renamed) {
        if (windowsPrevious !== null) {
          try {
            fs.writeFileSync(flagPath, windowsPrevious, { flag: 'wx', mode: 0o600 });
          } catch (e) { /* ignore */ }
        }
        return false;
      }
      return true;
    } finally {
      if (tempPath) {
        try { fs.unlinkSync(tempPath); } catch (e) { /* rename済み */ }
      }
    }
  } catch (e) {
    return false;
  }
}

const MAX_FLAG_BYTES = 64;

function readFlag(flagPath) {
  try {
    let st;
    try {
      st = fs.lstatSync(flagPath);
    } catch (e) {
      return null;
    }
    if (st.isSymbolicLink() || !st.isFile()) return null;
    if (st.size > MAX_FLAG_BYTES) return null;

    const O_NOFOLLOW = typeof fs.constants.O_NOFOLLOW === 'number' ? fs.constants.O_NOFOLLOW : 0;
    const flags = fs.constants.O_RDONLY | O_NOFOLLOW;
    let fd;
    let out;
    try {
      fd = fs.openSync(flagPath, flags);
      const buf = Buffer.alloc(MAX_FLAG_BYTES);
      const n = fs.readSync(fd, buf, 0, MAX_FLAG_BYTES, 0);
      out = buf.slice(0, n).toString('utf8');
    } finally {
      if (fd !== undefined) fs.closeSync(fd);
    }

    const raw = out.trim().toLowerCase();
    if (!VALID_MODES.includes(raw)) return null;
    return raw;
  } catch (e) {
    return null;
  }
}

module.exports = {
  getDefaultMode,
  getConfigDir,
  getConfigPath,
  VALID_MODES,
  LOCKED_MODES,
  MODE_TO_LABEL,
  safeWriteFlag,
  readFlag,
};
