import sharp from "sharp";
import { readdir, rename } from "fs/promises";
import { join } from "path";

const IMAGES_DIR = "./public/images";
// 352px = 2× the displayed 176px (w-44) for retina; top crop preserves faces
const TARGET_SIZE = 352;

const files = await readdir(IMAGES_DIR);
for (const file of files) {
  if (!file.startsWith("speaker-") || !file.endsWith(".png")) continue;

  const inputPath = join(IMAGES_DIR, file);
  const outputPath = join(IMAGES_DIR, file.replace(".png", ".webp"));
  const sourcePath = join(IMAGES_DIR, file.replace(".png", ".src.png"));

  await sharp(inputPath)
    .resize(TARGET_SIZE, TARGET_SIZE, { fit: "cover", position: "top" })
    .webp({ quality: 82 })
    .toFile(outputPath);

  // Keep original as .src.png for future re-optimization
  await rename(inputPath, sourcePath);

  const { size } = await sharp(outputPath).metadata();
  console.log(`✓ ${file} → ${file.replace(".png", ".webp")} (${Math.round((size ?? 0) / 1024)} KB)`);
}

console.log("Done. Update image references in app/page.tsx to .webp");
