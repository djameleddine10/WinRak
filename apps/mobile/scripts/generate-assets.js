/**
 * WinRak Asset Generator
 * Generates app icon, splash screen, and adaptive icon using SVG -> PNG
 */
const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// We'll generate SVG and convert using a simple approach
// Since we don't have canvas, we'll create proper SVG files

const ASSETS_DIR = path.join(__dirname, '../assets');
if (!fs.existsSync(ASSETS_DIR)) fs.mkdirSync(ASSETS_DIR, { recursive: true });

// ─── WinRak Icon SVG (1024x1024) ─────────────────────────────
const iconSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="1024" height="1024">
  <!-- Background -->
  <rect width="1024" height="1024" fill="#1A1A2E" rx="200"/>

  <!-- Golden W letter -->
  <text x="512" y="580"
    font-family="Arial Black, sans-serif"
    font-weight="900"
    font-size="580"
    fill="#F5A623"
    text-anchor="middle"
    dominant-baseline="middle">W</text>

  <!-- Teal accent bar at bottom -->
  <rect x="200" y="850" width="624" height="18" fill="#00D4AA" rx="9"/>

  <!-- Small car icon hint -->
  <text x="512" y="960"
    font-family="Arial" font-size="60"
    fill="#F5A623" text-anchor="middle" opacity="0.7">🚖</text>
</svg>`;

// ─── Splash Screen SVG (2048x2048) ────────────────────────────
const splashSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 2048 2048" width="2048" height="2048">
  <!-- Background -->
  <rect width="2048" height="2048" fill="#1A1A2E"/>

  <!-- Center content -->
  <g transform="translate(1024, 900)">
    <!-- Icon circle -->
    <circle cx="0" cy="-180" r="160" fill="#F5A623" opacity="0.15"/>
    <circle cx="0" cy="-180" r="130" fill="#F5A623" opacity="0.25"/>

    <!-- W -->
    <text x="0" y="-120"
      font-family="Arial Black" font-weight="900" font-size="200"
      fill="#F5A623" text-anchor="middle">W</text>

    <!-- App Name -->
    <text x="0" y="80"
      font-family="Arial" font-weight="800" font-size="120"
      fill="#FFFFFF" text-anchor="middle">وين راك</text>

    <!-- Tagline -->
    <text x="0" y="200"
      font-family="Arial" font-weight="400" font-size="60"
      fill="#F5A623" text-anchor="middle">وين راك؟ نجيك!</text>

    <!-- Teal line -->
    <rect x="-300" y="270" width="600" height="8" fill="#00D4AA" rx="4"/>
  </g>
</svg>`;

// Save SVG files
fs.writeFileSync(path.join(ASSETS_DIR, 'icon.svg'), iconSVG);
fs.writeFileSync(path.join(ASSETS_DIR, 'splash.svg'), splashSVG);
fs.writeFileSync(path.join(ASSETS_DIR, 'adaptive-icon.svg'), iconSVG);

console.log('✅ SVG assets generated');
console.log('📁 Assets saved to:', ASSETS_DIR);
console.log('');
console.log('Next: Convert SVGs to PNGs using online tool or install sharp');
console.log('→ Upload icon.svg to: https://cloudconvert.com/svg-to-png');
console.log('  Set size to 1024x1024 → save as icon.png');
console.log('→ Upload splash.svg → set size 2048x2048 → save as splash.png');
