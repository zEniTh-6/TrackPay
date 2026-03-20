const fs = require('fs');
const path = require('path');
const { Jimp } = require('jimp');

const densities = {
  mdpi: 48,
  hdpi: 72,
  xhdpi: 96,
  xxhdpi: 144,
  xxxhdpi: 192
};

const inputFile = path.join(__dirname, 'logo.png');
const androidPath = path.join(__dirname, 'android/app/src/main/res');

async function run() {
  console.log('Reading logo from:', inputFile);
  const image = await Jimp.read(inputFile);

  for (const [density, size] of Object.entries(densities)) {
    const dir = path.join(androidPath, `mipmap-${density}`);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const fileNormal = path.join(dir, 'ic_launcher.png');
    const fileRound  = path.join(dir, 'ic_launcher_round.png');

    await image.clone().resize({ w: size, h: size }).write(fileNormal);
    await image.clone().resize({ w: size, h: size }).write(fileRound);

    console.log(`✔ mipmap-${density}: ${size}x${size} written`);
  }

  console.log('\nAll icons generated successfully!');
}

run().catch(e => { console.error('Error:', e.message, e.stack); process.exit(1); });
