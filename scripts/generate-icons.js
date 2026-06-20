#!/usr/bin/env node
// Script de génération des icônes PWA depuis public/logo.jpeg
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE = path.join(__dirname, '..', 'public', 'logo.jpeg');
const DEST = path.join(__dirname, '..', 'public', 'icons');

const SIZES = [72, 96, 128, 144, 152, 180, 192, 512];

async function generateIcons() {
  if (!fs.existsSync(DEST)) fs.mkdirSync(DEST, { recursive: true });

  const meta = await sharp(SOURCE).metadata();
  console.log(`Source: ${meta.width}x${meta.height} ${meta.format}`);

  for (const size of SIZES) {
    const out = path.join(DEST, `icon-${size}x${size}.png`);
    await sharp(SOURCE)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 15, g: 23, b: 42, alpha: 1 }, // #0F172A navy
      })
      .png()
      .toFile(out);
    const stat = fs.statSync(out);
    console.log(`  icon-${size}x${size}.png — ${stat.size} bytes`);
  }

  console.log('\nDone — all icons regenerated from logo.jpeg');
}

generateIcons().catch(err => { console.error(err); process.exit(1); });
