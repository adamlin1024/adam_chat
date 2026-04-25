#!/usr/bin/env node
// LINE 貼圖包安裝器
//   scan                        → 掃描候選，輸出 JSON
//   install <source> <pack-id>  → 安裝到 public/stickers/<pack-id>/
//
// 來源可為 ZIP 檔或已解壓資料夾（需含 productInfo.meta）。

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { execSync, execFileSync } from "node:child_process";
import sharp from "sharp";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const WEB_ROOT = path.resolve(__dirname, "..");
const STICKERS_ROOT = path.join(WEB_ROOT, "public", "stickers");
const PACKS_JSON = path.join(STICKERS_ROOT, "packs.json");
const PROJECT_ROOT = path.resolve(WEB_ROOT, "..");

const SEARCH_PATHS = [
  path.join(os.homedir(), "Desktop"),
  path.join(os.homedir(), "Downloads"),
  path.join(PROJECT_ROOT, "sticker"),
];

const META_NAME = "productInfo.meta";

function findMetaInDir(dir, maxDepth = 2) {
  if (!fs.existsSync(dir)) return null;
  let stat;
  try {
    stat = fs.statSync(dir);
  } catch {
    return null;
  }
  if (!stat.isDirectory()) return null;
  const direct = path.join(dir, META_NAME);
  if (fs.existsSync(direct)) return direct;
  if (maxDepth <= 0) return null;
  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return null;
  }
  for (const entry of entries) {
    const sub = path.join(dir, entry);
    try {
      if (fs.statSync(sub).isDirectory()) {
        const found = findMetaInDir(sub, maxDepth - 1);
        if (found) return found;
      }
    } catch {}
  }
  return null;
}

function readMeta(metaPath) {
  return JSON.parse(fs.readFileSync(metaPath, "utf8"));
}

function psEscape(s) {
  return s.replace(/'/g, "''");
}

function runPs(script) {
  return execFileSync(
    "powershell",
    ["-NoProfile", "-NonInteractive", "-Command", script],
    { stdio: ["ignore", "pipe", "pipe"], encoding: "utf8" }
  );
}

function peekZipMeta(zipPath) {
  try {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "line-peek-"));
    try {
      const script = [
        "$ErrorActionPreference = 'Stop'",
        "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
        "Add-Type -AssemblyName System.IO.Compression.FileSystem",
        `$zip = [System.IO.Compression.ZipFile]::OpenRead('${psEscape(zipPath)}')`,
        "try {",
        `  $entry = $zip.Entries | Where-Object { $_.Name -eq '${META_NAME}' } | Select-Object -First 1`,
        "  if ($entry) {",
        `    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '${psEscape(path.join(tempDir, META_NAME))}', $true)`,
        "  }",
        "} finally { $zip.Dispose() }",
      ].join("; ");
      runPs(script);
      const out = path.join(tempDir, META_NAME);
      if (!fs.existsSync(out)) return null;
      return readMeta(out);
    } finally {
      try {
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch {}
    }
  } catch {
    return null;
  }
}

function extractZip(zipPath, destDir) {
  fs.mkdirSync(destDir, { recursive: true });
  const script = [
    "$ErrorActionPreference = 'Stop'",
    "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8",
    `Expand-Archive -LiteralPath '${psEscape(zipPath)}' -DestinationPath '${psEscape(destDir)}' -Force`,
  ].join("; ");
  runPs(script);
}

function buildCandidate(type, sourcePath, meta, mtime) {
  const title = meta.title?.zh_TW || meta.title?.en || String(meta.packageId);
  return {
    path: sourcePath,
    type,
    title,
    packageId: meta.packageId,
    stickerCount: (meta.stickers || []).length,
    hasAnimation: !!meta.hasAnimation,
    hasSound: !!meta.hasSound,
    mtime: mtime.toISOString(),
  };
}

function scan() {
  const candidates = [];
  const seen = new Set();
  for (const basePath of SEARCH_PATHS) {
    if (!fs.existsSync(basePath)) continue;
    let entries;
    try {
      entries = fs.readdirSync(basePath);
    } catch {
      continue;
    }
    for (const entry of entries) {
      const full = path.join(basePath, entry);
      if (seen.has(full)) continue;
      seen.add(full);
      let stat;
      try {
        stat = fs.statSync(full);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        const metaPath = findMetaInDir(full, 2);
        if (!metaPath) continue;
        try {
          const meta = readMeta(metaPath);
          candidates.push(
            buildCandidate("folder", path.dirname(metaPath), meta, stat.mtime)
          );
        } catch {}
      } else if (stat.isFile() && entry.toLowerCase().endsWith(".zip")) {
        const meta = peekZipMeta(full);
        if (meta && meta.packageId && Array.isArray(meta.stickers)) {
          candidates.push(buildCandidate("zip", full, meta, stat.mtime));
        }
      }
    }
  }
  candidates.sort((a, b) => b.mtime.localeCompare(a.mtime));
  process.stdout.write(JSON.stringify(candidates, null, 2) + "\n");
}

async function install(sourcePath, packId) {
  if (!packId || !/^[a-z0-9_-]+$/i.test(packId)) {
    console.error("packId 必須為英數字、底線或連字號");
    process.exit(1);
  }
  if (!fs.existsSync(sourcePath)) {
    console.error(`來源不存在：${sourcePath}`);
    process.exit(1);
  }

  const stat = fs.statSync(sourcePath);
  let workDir;
  let cleanupWorkDir = false;
  if (stat.isFile() && sourcePath.toLowerCase().endsWith(".zip")) {
    workDir = fs.mkdtempSync(path.join(os.tmpdir(), "line-install-"));
    extractZip(sourcePath, workDir);
    cleanupWorkDir = true;
  } else if (stat.isDirectory()) {
    workDir = sourcePath;
  } else {
    console.error("來源必須是 ZIP 檔或資料夾");
    process.exit(1);
  }

  try {
    const metaPath = findMetaInDir(workDir, 3);
    if (!metaPath) {
      console.error("找不到 productInfo.meta");
      process.exit(1);
    }
    const sourceDir = path.dirname(metaPath);
    const meta = readMeta(metaPath);

    const destDir = path.join(STICKERS_ROOT, packId);
    const overwriting = fs.existsSync(destDir);
    fs.mkdirSync(destDir, { recursive: true });

    const animationDir = path.join(sourceDir, "animation");
    const hasAnimationDir =
      fs.existsSync(animationDir) && fs.statSync(animationDir).isDirectory();

    let filesCopied = 0;
    // 1. 複製根目錄所有檔案（靜態 PNG、_key.png 縮圖、tab_*.png、productInfo.meta）
    for (const entry of fs.readdirSync(sourceDir)) {
      const src = path.join(sourceDir, entry);
      if (!fs.statSync(src).isFile()) continue;
      fs.copyFileSync(src, path.join(destDir, entry));
      filesCopied++;
    }
    // 2. 若有 animation/ 子資料夾，以 APNG 覆蓋根目錄的靜態 {id}.png
    //    （_key.png 縮圖仍保留靜態版本，picker 格子顯示用）
    let animatedCount = 0;
    if (hasAnimationDir) {
      for (const entry of fs.readdirSync(animationDir)) {
        const src = path.join(animationDir, entry);
        if (!fs.statSync(src).isFile()) continue;
        fs.copyFileSync(src, path.join(destDir, entry));
        animatedCount++;
      }
    }

    // 3. 重產 _key.png：從 main 取第一幀（APNG 也適用）作為靜態縮圖，與 main 同解析度
    //    避免 LINE 原檔 _key 解析度過低（動態包 75×70）造成 picker 上採樣模糊
    let keysRegenerated = 0;
    for (const entry of fs.readdirSync(destDir)) {
      if (!entry.endsWith(".png") || entry.includes("_key") || entry.startsWith("tab_")) continue;
      const main = path.join(destDir, entry);
      const key = path.join(destDir, entry.replace(".png", "_key.png"));
      try {
        const buf = await sharp(main, { pages: 1 }).png({ compressionLevel: 9 }).toBuffer();
        fs.writeFileSync(key, buf);
        keysRegenerated++;
      } catch {
        /* 個別失敗保留 LINE 原檔 _key */
      }
    }

    const stickers = (meta.stickers || []).map((s) => ({
      id: String(s.id),
      w: s.width,
      h: s.height,
    }));
    const name = meta.title?.zh_TW || meta.title?.en || packId;
    const author = meta.author?.zh_TW || meta.author?.en || meta.author?.ja;
    const newPack = {
      id: packId,
      name,
      ...(author ? { author } : {}),
      tab_on: `/stickers/${packId}/tab_on.png`,
      tab_off: `/stickers/${packId}/tab_off.png`,
      stickers,
    };

    let packsData = { packs: [] };
    if (fs.existsSync(PACKS_JSON)) {
      packsData = JSON.parse(fs.readFileSync(PACKS_JSON, "utf8"));
      if (!Array.isArray(packsData.packs)) packsData.packs = [];
    }
    const idx = packsData.packs.findIndex((p) => p.id === packId);
    if (idx >= 0) packsData.packs[idx] = newPack;
    else packsData.packs.push(newPack);
    fs.writeFileSync(PACKS_JSON, JSON.stringify(packsData, null, 2) + "\n");

    process.stdout.write(
      JSON.stringify(
        {
          status: "ok",
          packId,
          name,
          stickerCount: stickers.length,
          filesCopied,
          animatedCount,
          keysRegenerated,
          overwriting,
          destDir: path.relative(PROJECT_ROOT, destDir).replace(/\\/g, "/"),
          hasAnimation: !!meta.hasAnimation,
          hasSound: !!meta.hasSound,
        },
        null,
        2
      ) + "\n"
    );
  } finally {
    if (cleanupWorkDir) {
      try {
        fs.rmSync(workDir, { recursive: true, force: true });
      } catch {}
    }
  }
}

const [, , cmd, ...args] = process.argv;
if (cmd === "scan") {
  scan();
} else if (cmd === "install") {
  const [sourcePath, packId] = args;
  if (!sourcePath || !packId) {
    console.error("用法：add-sticker.mjs install <source-path> <pack-id>");
    process.exit(1);
  }
  install(sourcePath, packId).catch((e) => { console.error(e); process.exit(1); });
} else {
  console.error("用法：");
  console.error("  node add-sticker.mjs scan");
  console.error("  node add-sticker.mjs install <source-path> <pack-id>");
  process.exit(1);
}
