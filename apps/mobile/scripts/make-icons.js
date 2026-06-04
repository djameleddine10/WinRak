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
  const r = size * 0.22; // corner radius
  const s = size / 100;  // scale unit
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 100 100">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#1A1A2E"/>
      <stop offset="100%" style="stop-color:#0D1B3E"/>
    </linearGradient>
    <linearGradient id="carGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#F5A623"/>
      <stop offset="100%" style="stop-color:#D4881A"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background rounded rect -->
  <rect width="100" height="100" fill="url(#bg)" rx="${r * 100 / size}"/>

  <!-- Subtle radial glow behind car -->
  <circle cx="50" cy="55" r="36" fill="#F5A623" opacity="0.07"/>

  <!-- Road / ground line -->
  <rect x="8" y="72" width="84" height="3" fill="#00D4AA" opacity="0.25" rx="1.5"/>

  <!-- Car body — side view silhouette -->
  <!-- Lower chassis -->
  <rect x="14" y="59" width="72" height="14" fill="url(#carGrad)" rx="3"/>
  <!-- Cabin roof -->
  <path d="M28 59 Q32 44 42 43 L60 43 Q70 43 73 59 Z" fill="url(#carGrad)"/>
  <!-- Windshield (front) -->
  <path d="M60 58 Q66 52 70 44 L60 44 Q58 51 58 58 Z" fill="#1A1A2E" opacity="0.55"/>
  <!-- Rear window -->
  <path d="M30 58 Q31 51 34 44 L42 44 Q39 51 38 58 Z" fill="#1A1A2E" opacity="0.55"/>
  <!-- Side window strip -->
  <rect x="41" y="44" width="17" height="14" fill="#1A1A2E" opacity="0.45" rx="1"/>

  <!-- Wheels -->
  <circle cx="27" cy="74" r="8" fill="#0D1B3E" stroke="#F5A623" stroke-width="2.5"/>
  <circle cx="27" cy="74" r="3.5" fill="#F5A623" opacity="0.8"/>
  <circle cx="72" cy="74" r="8" fill="#0D1B3E" stroke="#F5A623" stroke-width="2.5"/>
  <circle cx="72" cy="74" r="3.5" fill="#F5A623" opacity="0.8"/>

  <!-- Headlight -->
  <ellipse cx="86" cy="65" rx="4" ry="3" fill="#FFF9E6" opacity="0.9"/>
  <ellipse cx="86" cy="65" rx="2" ry="1.5" fill="#FFFFFF"/>

  <!-- Tail light -->
  <ellipse cx="14" cy="65" rx="3.5" ry="2.5" fill="#FF4444" opacity="0.85"/>

  <!-- Location pin above car — teal -->
  <circle cx="50" cy="26" r="9" fill="#00D4AA" filter="url(#glow)"/>
  <path d="M50 35 Q46 30 46 26 A4 4 0 0 1 54 26 Q54 30 50 35Z" fill="#00D4AA"/>
  <circle cx="50" cy="26" r="4.5" fill="#1A1A2E"/>
  <circle cx="50" cy="26" r="2" fill="#00D4AA"/>

  <!-- Speed lines behind car -->
  <line x1="8" y1="58" x2="20" y2="58" stroke="#00D4AA" stroke-width="1.2" opacity="0.5" stroke-linecap="round"/>
  <line x1="8" y1="62" x2="17" y2="62" stroke="#00D4AA" stroke-width="0.9" opacity="0.35" stroke-linecap="round"/>
  <line x1="8" y1="66" x2="18" y2="66" stroke="#00D4AA" stroke-width="0.9" opacity="0.35" stroke-linecap="round"/>
</svg>`);
}

function makeSplashSVG(w, h) {
  // All coordinates in a 100x100 viewBox, scaled up
  return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 100 100">
  <defs>
    <radialGradient id="bg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" style="stop-color:#1e2040"/>
      <stop offset="100%" style="stop-color:#0D0D1A"/>
    </radialGradient>
    <linearGradient id="carGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" style="stop-color:#F5A623"/>
      <stop offset="100%" style="stop-color:#D4881A"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="1.2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="100" height="100" fill="url(#bg)"/>

  <!-- Ambient glow -->
  <circle cx="50" cy="48" r="38" fill="#F5A623" opacity="0.05"/>
  <circle cx="50" cy="48" r="24" fill="#00D4AA" opacity="0.04"/>

  <!-- Road -->
  <rect x="5" y="68" width="90" height="2.5" fill="#00D4AA" opacity="0.2" rx="1.2"/>
  <!-- Dashed center line -->
  <rect x="15" y="69" width="10" height="1" fill="#00D4AA" opacity="0.3" rx="0.5"/>
  <rect x="33" y="69" width="10" height="1" fill="#00D4AA" opacity="0.3" rx="0.5"/>
  <rect x="51" y="69" width="10" height="1" fill="#00D4AA" opacity="0.3" rx="0.5"/>
  <rect x="69" y="69" width="10" height="1" fill="#00D4AA" opacity="0.3" rx="0.5"/>

  <!-- Car body -->
  <rect x="18" y="55" width="64" height="13" fill="url(#carGrad)" rx="3"/>
  <path d="M30 55 Q33 42 42 41 L59 41 Q68 42 71 55 Z" fill="url(#carGrad)"/>
  <!-- Windows -->
  <path d="M59 54 Q64 49 68 42 L59 42 Q57 48 57 54 Z" fill="#1A1A2E" opacity="0.5"/>
  <path d="M32 54 Q33 48 36 42 L43 42 Q41 48 40 54 Z" fill="#1A1A2E" opacity="0.5"/>
  <rect x="43" y="42" width="15" height="12" fill="#1A1A2E" opacity="0.4" rx="1"/>
  <!-- Wheels -->
  <circle cx="30" cy="70" r="7" fill="#0D0D1A" stroke="#F5A623" stroke-width="2"/>
  <circle cx="30" cy="70" r="3" fill="#F5A623" opacity="0.8"/>
  <circle cx="69" cy="70" r="7" fill="#0D0D1A" stroke="#F5A623" stroke-width="2"/>
  <circle cx="69" cy="70" r="3" fill="#F5A623" opacity="0.8"/>
  <!-- Headlight -->
  <ellipse cx="82" cy="61" rx="3.5" ry="2.5" fill="#FFF9E6" opacity="0.95"/>
  <ellipse cx="82" cy="61" rx="1.8" ry="1.2" fill="#FFFFFF"/>
  <!-- Tail light -->
  <ellipse cx="18" cy="61" rx="3" ry="2" fill="#FF4444" opacity="0.8"/>
  <!-- Speed lines -->
  <line x1="5" y1="54" x2="15" y2="54" stroke="#00D4AA" stroke-width="1" opacity="0.5" stroke-linecap="round"/>
  <line x1="5" y1="58" x2="13" y2="58" stroke="#00D4AA" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>
  <line x1="5" y1="62" x2="14" y2="62" stroke="#00D4AA" stroke-width="0.8" opacity="0.35" stroke-linecap="round"/>

  <!-- Location pin -->
  <circle cx="50" cy="24" r="8" fill="#00D4AA" filter="url(#glow)"/>
  <path d="M50 32 Q46.5 27.5 46.5 24 A3.5 3.5 0 0 1 53.5 24 Q53.5 27.5 50 32Z" fill="#00D4AA"/>
  <circle cx="50" cy="24" r="4" fill="#0D0D1A"/>
  <circle cx="50" cy="24" r="1.8" fill="#00D4AA"/>

  <!-- App name -->
  <text x="50" y="82"
    font-family="Arial Black, Arial, sans-serif"
    font-weight="900"
    font-size="7"
    fill="#FFFFFF"
    text-anchor="middle"
    letter-spacing="1">WinRak</text>

  <!-- Tagline -->
  <text x="50" y="90"
    font-family="Arial, sans-serif"
    font-size="3.8"
    fill="#F5A623"
    text-anchor="middle">وين راك؟ نجيك!</text>

  <!-- Accent line -->
  <rect x="32" y="94" width="36" height="0.8" fill="#00D4AA" rx="0.4" opacity="0.7"/>
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
