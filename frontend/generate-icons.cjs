const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const svgPath = path.join(__dirname, 'public/icons/icon.svg');
const svgBuffer = fs.readFileSync(svgPath);

const sizes = [72, 96, 128, 144, 152, 180, 192, 512];

async function generate() {
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, `public/icons/icon-${size}.png`));
    console.log(`Generated icon-${size}.png`);
  }
  // favicon
  await sharp(svgBuffer).resize(32, 32).png().toFile(path.join(__dirname, 'public/favicon.ico'));
  console.log('Generated favicon.ico');
}

generate().catch(console.error);
