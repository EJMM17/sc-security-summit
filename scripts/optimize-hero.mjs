#!/usr/bin/env node
// Compress public/images/hero-bg.jpg into responsive WebP variants.
// Idempotent — safe to re-run; outputs overwrite existing variants.
//
// Usage: node scripts/optimize-hero.mjs
import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

// Source: pass a path as argv[2], or drop the original at one of these defaults.
const SRC = await (async () => {
  const candidates = [
    process.argv[2],
    "public/images/hero-bg.jpg",
    "public/images/hero-bg-source.jpg",
    "public/images/hero-bg-source.png",
  ].filter(Boolean);
  for (const c of candidates) {
    try {
      await fs.access(c);
      return path.resolve(c);
    } catch {}
  }
  throw new Error(
    "No source image found. Pass one as argv[2] (e.g. node scripts/optimize-hero.mjs path/to/hi-res.jpg)",
  );
})();
const OUT_DIR = path.resolve("public/images");

const VARIANTS = [
  { width: 800, name: "hero-bg-800.webp", quality: 78 },
  { width: 1200, name: "hero-bg-1200.webp", quality: 80 },
  { width: 1920, name: "hero-bg.webp", quality: 80 },
];

async function main() {
  console.log(`Source: ${SRC}`);
  for (const v of VARIANTS) {
    const out = path.join(OUT_DIR, v.name);
    await sharp(SRC)
      .resize({ width: v.width, withoutEnlargement: true })
      .webp({ quality: v.quality, effort: 5 })
      .toFile(out);
    const { size } = await fs.stat(out);
    console.log(`✔ ${v.name} ${(size / 1024).toFixed(0)} KB (w=${v.width})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
