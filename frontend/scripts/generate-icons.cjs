// Script para gerar ícones PNG a partir do SVG usando Canvas do Node.js
// Requer: npm install canvas (opcional - usa fallback se não disponível)

const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 180, 192, 512];
const iconsDir = path.join(__dirname, '../public/icons');

if (!fs.existsSync(iconsDir)) fs.mkdirSync(iconsDir, { recursive: true });

// Gera PNG como Data URL usando SVG embutido em HTML canvas via sharp ou fallback
try {
  const sharp = require('sharp');
  const svgPath = path.join(iconsDir, 'icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  Promise.all(sizes.map(size =>
    sharp(svgBuffer).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`))
  )).then(() => {
    console.log('Ícones gerados com sharp!');
  });
} catch (e) {
  // Fallback: copia o SVG como PNG placeholder usando base64
  generateFallbackIcons(sizes, iconsDir);
}

function generateFallbackIcons(sizes, dir) {
  // PNG mínimo válido 1x1 azul (base64) - será substituído pelo SVG
  // Gera PNG simples usando Buffer manual
  sizes.forEach(size => {
    const pngPath = path.join(dir, `icon-${size}.png`);
    if (!fs.existsSync(pngPath)) {
      // Cria um PNG simples usando cabeçalho mínimo
      writeSolidColorPng(pngPath, size, size, [30, 64, 175, 255]); // cor primary-800
    }
  });
  console.log(`${sizes.length} ícones PNG gerados.`);
}

function writeSolidColorPng(filepath, width, height, [r, g, b, a]) {
  // PNG signature + IHDR + IDAT + IEND
  const crc32 = (buf) => {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
  };

  const makeChunk = (type, data) => {
    const typeBytes = Buffer.from(type, 'ascii');
    const lenBuf = Buffer.alloc(4); lenBuf.writeUInt32BE(data.length);
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBytes, data])));
    return Buffer.concat([lenBuf, typeBytes, data, crcBuf]);
  };

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0); ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); ihdrData.writeUInt8(2, 9); // 8-bit RGB

  const rowSize = width * 3 + 1;
  const raw = Buffer.alloc(rowSize * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowSize] = 0; // filter byte
    for (let x = 0; x < width; x++) {
      const base = y * rowSize + 1 + x * 3;
      // Desenha fundo azul com M branco simples
      const cx = x - width / 2, cy = y - height / 2;
      const inM = Math.abs(cx) < width * 0.3 && cy > -height * 0.25 && cy < height * 0.3;
      if (inM) { raw[base] = 255; raw[base+1] = 255; raw[base+2] = 255; }
      else { raw[base] = r; raw[base+1] = g; raw[base+2] = b; }
    }
  }

  const zlib = require('zlib');
  const compressed = zlib.deflateSync(raw);
  const idatData = compressed;

  const png = Buffer.concat([sig, makeChunk('IHDR', ihdrData), makeChunk('IDAT', idatData), makeChunk('IEND', Buffer.alloc(0))]);
  fs.writeFileSync(filepath, png);
}
