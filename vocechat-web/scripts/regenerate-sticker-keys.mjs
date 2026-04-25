#!/usr/bin/env node
/**
 * 重新產生貼圖包的 _key.png 縮圖。
 *
 * 為什麼：
 *   - LINE 動態包的 _key.png 原檔只有 75×70，picker tile 在 retina 上要上採樣 3x → 糊
 *   - 靜態包的 _key.png 是 108×100，也會輕微上採樣
 *   - 從 main 取第一幀重新產生 → tile 大小一致，無上採樣
 *
 * 用法：
 *   node scripts/regenerate-sticker-keys.mjs              # 重產所有包
 *   node scripts/regenerate-sticker-keys.mjs <packId>     # 重產指定包
 *
 * sharp 對 APNG 預設只取第一幀（pages: 1），動態包會得到靜止首幀。
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STICKERS_ROOT = path.join(__dirname, "..", "public", "stickers");

async function regeneratePack(packDir) {
  const packId = path.basename(packDir);
  const entries = fs.readdirSync(packDir);
  const mainStickers = entries
    .filter((f) => f.endsWith(".png") && !f.includes("_key") && !f.startsWith("tab_"))
    .sort();

  let done = 0, skipped = 0;
  for (const main of mainStickers) {
    const mainPath = path.join(packDir, main);
    const keyPath = path.join(packDir, main.replace(".png", "_key.png"));

    try {
      const buffer = await sharp(mainPath, { pages: 1 })
        .png({ compressionLevel: 9 })
        .toBuffer();
      fs.writeFileSync(keyPath, buffer);
      done++;
    } catch (e) {
      console.warn(`  ⚠ ${main}: ${e.message}`);
      skipped++;
    }
  }
  console.log(`[${packId}] ${done} 重產，${skipped} 跳過`);
}

async function main() {
  const arg = process.argv[2];
  if (!fs.existsSync(STICKERS_ROOT)) {
    console.error("找不到 public/stickers/");
    process.exit(1);
  }

  const packs = arg
    ? [path.join(STICKERS_ROOT, arg)]
    : fs
        .readdirSync(STICKERS_ROOT, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => path.join(STICKERS_ROOT, d.name));

  for (const dir of packs) {
    if (!fs.existsSync(dir)) {
      console.error(`包不存在：${dir}`);
      continue;
    }
    await regeneratePack(dir);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
