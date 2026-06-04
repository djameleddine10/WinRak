/**
 * Generate all WinRak app icons using Sharp
 */
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ASSETS = path.join(__dirname, '../assets');
if (!fs.existsSync(ASSETS)) fs.mkdirSync(ASSETS, { recursive: true });

// ─── Build SVG Buffers ────────────────────────────────────────
function makeIconSVG(size) {
  const r = size * 0.2; // corner radius
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1A1A2E"/>
      <stop offset="100%" style="stop-color:#16213E"/>
    </linearGradient>
  </defs>

  <!-- Background -->
  <rect width="${size}" height="${size}" fill="url(#bg)" rx="${r}"/>

  <!-- Golden W - main letter -->
  <text
    x="${size * 0.5}"
    y="${size * 0.62}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${size * 0.58}"
    fill="#F5A623"
    text-anchor="middle"
    dominant-baseline="middle">W</text>

  <!-- Teal accent dots -->
  <circle cx="${size * 0.28}" cy="${size * 0.82}" r="${size * 0.04}" fill="#00D4AA" opacity="0.9"/>
  <circle cx="${size * 0.50}" cy="${size * 0.84}" r="${size * 0.04}" fill="#00D4AA" opacity="0.7"/>
  <circle cx="${size * 0.72}" cy="${size * 0.82}" r="${size * 0.04}" fill="#00D4AA" opacity="0.9"/>
</svg>`);
}

function makeSplashSVG(w, h) {
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="60%">
      <stop offset="0%" style="stop-color:#1e2040"/>
      <stop offset="100%" style="stop-color:#0D0D1A"/>
    </radialGradient>
  </defs>

  <!-- Background -->
  <rect width="${w}" height="${h}" fill="url(#bg)"/>

  <!-- Glow effect -->
  <circle cx="${w/2}" cy="${h*0.42}" r="${h*0.22}" fill="#F5A623" opacity="0.06"/>
  <circle cx="${w/2}" cy="${h*0.42}" r="${h*0.16}" fill="#F5A623" opacity="0.08"/>

  <!-- Icon circle -->
  <circle cx="${w/2}" cy="${h*0.38}" r="${h*0.13}" fill="#F5A623" opacity="0.12"/>

  <!-- W -->
  <text x="${w/2}" y="${h*0.42}"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="${h*0.2}"
    fill="#F5A623"
    text-anchor="middle"
    dominant-baseline="middle">W</text>

  <!-- App Name Arabic -->
  <text x="${w/2}" y="${h*0.60}"
    font-family="Arial, sans-serif"
    font-weight="800"
    font-size="${h*0.072}"
    fill="#FFFFFF"
    text-anchor="middle">WinRak</text>

  <!-- Arabic tagline -->
  <text x="${w/2}" y="${h*0.67}"
    font-family="Arial, sans-serif"
    font-size="${h*0.036}"
    fill="#F5A623"
    text-anchor="middle">وين راك؟ نجيك!</text>

  <!-- Bottom accent line -->
  <rect x="${w*0.3}" y="${h*0.73}" width="${w*0.4}" height="${h*0.005}" fill="#00D4AA" rx="${h*0.003}"/>
</svg>`);
}

async function generate() {
  console.log('🎨 Generating WinRak assets...\n');

  try {
    // 1. App Icon (1024x1024) - main icon
    await sharp(makeIconSVG(1024))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(ASSETS, 'icon.png'));
    console.log('✅ icon.png (1024x1024)');

    // 2. Adaptive Icon (1024x1024) - Android foreground
    await sharp(makeIconSVG(1024))
      .resize(1024, 1024)
      .png()
      .toFile(path.join(ASSETS, 'adaptive-icon.png'));
    console.log('✅ adaptive-icon.png (1024x1024)');

    // 3. Splash Screen (2048x2048)
    await sharp(makeSplashSVG(2048, 2048))
      .resize(2048, 2048)
      .png()
      .toFile(path.join(ASSETS, 'splash.png'));
    console.log('✅ splash.png (2048x2048)');

    // 4. Favicon for web (48x48)
    await sharp(makeIconSVG(256))
      .resize(48, 48)
      .png()
      .toFile(path.join(ASSETS, 'favicon.png'));
    console.log('✅ favicon.png (48x48)');

    // 5. Notification icon - white on transparent (Android)
    await sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96">
      <text x="48" y="72" font-family="Arial Black" font-weight="900" font-size="80"
        fill="white" text-anchor="middle">W</text>
    </svg>`))
      .resize(96, 96)
      .png()
      .toFile(path.join(ASSETS, 'notification-icon.png'));
    console.log('✅ notification-icon.png (96x96)');

    console.log('\n🚖 All WinRak assets generated successfully!');
    console.log('📁 Location:', ASSETS);

  } catch (err) {
    console.error('Error:', err.message);
  }
}

generate();
