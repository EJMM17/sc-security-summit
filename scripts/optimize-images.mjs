#!/usr/bin/env node
// Comprime imágenes del folder public/images/ a WebP + AVIF
// Usar: node scripts/optimize-images.mjs
import sharp from "sharp";
import fs from "fs/promises";
import path from "path";

const DIR = "public/images";
const MAX_WIDTH = 1200; // suficiente para speaker cards en desktop
const QUALITY_WEBP = 82;
const QUALITY_AVIF = 70;

async function optimize() {
  const files = await fs.readdir(DIR);
  const pngs = files.filter(
    (f) => f.endsWith(".png") && !f.endsWith(".webp") && !f.endsWith(".avif")
  );

  if (pngs.length === 0) {
    console.log("No PNG files found to optimize.");
    return;
  }

  for (const file of pngs) {
    const input = path.join(DIR, file);
    const base = file.replace(/\.png$/, "");
    const webpOut = path.join(DIR, `${base}.webp`);
    const avifOut = path.join(DIR, `${base}.avif`);

    const img = sharp(input).resize(MAX_WIDTH, null, { withoutEnlargement: true });

    await img.clone().webp({ quality: QUALITY_WEBP }).toFile(webpOut);
    await img.clone().avif({ quality: QUALITY_AVIF }).toFile(avifOut);

    const inputSize = (await fs.stat(input)).size;
    const webpSize = (await fs.stat(webpOut)).size;
    console.log(
      `✓ ${file}: ${(inputSize / 1024 / 1024).toFixed(1)}MB → ${(webpSize / 1024).toFixed(0)}KB WebP`
    );
  }

  console.log("\nDone. Commit the .webp/.avif files and update image references in page.tsx.");
}

optimize().catch((err) => {
  console.error("❌ optimize failed:", err);
  process.exit(1);
});
