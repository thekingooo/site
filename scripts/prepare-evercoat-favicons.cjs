const fs = require('node:fs/promises');
const path = require('node:path');
const sharp = require('sharp');

// Export the approved dark-tile artwork at browser icon sizes.
async function main() {
  const root = path.resolve(__dirname, '..');
  const source = path.join(root, 'src/evercoat-preview/favicon.png');
  const output = path.join(root, 'public/evercoat-preview');
  await fs.mkdir(path.join(output, 'assets'), { recursive: true });
  const sizes = [16, 32, 48, 180, 192];
  const images = new Map();
  for (const size of sizes) {
    const png = await sharp(source).resize(size, size).png().toBuffer();
    images.set(size, png);
    const filename = size === 180 ? 'apple-touch-icon.png' : `favicon-${size}.png`;
    await fs.writeFile(path.join(output, 'assets', filename), png);
  }

  // ICO supports embedded PNG entries; supply all common desktop sizes.
  const icoSizes = [16, 32, 48];
  const header = Buffer.alloc(6 + icoSizes.length * 16);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(icoSizes.length, 4);
  let offset = header.length;
  icoSizes.forEach((size, index) => {
    const entry = 6 + index * 16;
    const png = images.get(size);
    header[entry] = size;
    header[entry + 1] = size;
    header.writeUInt16LE(1, entry + 4);
    header.writeUInt16LE(32, entry + 6);
    header.writeUInt32LE(png.length, entry + 8);
    header.writeUInt32LE(offset, entry + 12);
    offset += png.length;
  });
  await fs.writeFile(path.join(output, 'favicon.ico'), Buffer.concat([header, ...icoSizes.map(size => images.get(size))]));
}

main().catch(error => { console.error(error); process.exitCode = 1; });
