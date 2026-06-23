import sharp from 'sharp'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dirname, '..')
const W = 1284
const H = 2778

// Read the existing icon and convert to base64 for embedding in SVG
const iconBuffer = readFileSync(join(ROOT, 'assets', 'icon.png'))
const iconB64   = iconBuffer.toString('base64')
const iconSrc   = `data:image/png;base64,${iconB64}`

function makeSvg({ bg, text, sub, tagline, lineColor }) {
  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <!-- Background -->
  <rect width="${W}" height="${H}" fill="${bg}"/>

  <!-- WR Icon (centered, upper half) -->
  <image href="${iconSrc}" x="${(W - 240) / 2}" y="900" width="240" height="240"/>

  <!-- WinRak wordmark -->
  <text
    x="${W / 2}" y="1230"
    font-family="'Arial Black', 'Arial', sans-serif"
    font-size="88" font-weight="900"
    fill="#ffbc07"
    text-anchor="middle"
    letter-spacing="4"
  >WinRak</text>

  <!-- Tagline Arabic -->
  <text
    x="${W / 2}" y="1330"
    font-family="'Segoe UI', 'Arial', sans-serif"
    font-size="42" font-weight="400"
    fill="${sub}"
    text-anchor="middle"
    letter-spacing="1"
  >تنقّل بحرية — في الجزائر</text>

  <!-- Accent dots -->
  <circle cx="${W/2 - 30}" cy="1400" r="5" fill="#ffbc07" opacity="0.4"/>
  <circle cx="${W/2}"      cy="1400" r="5" fill="#ffbc07" opacity="0.7"/>
  <circle cx="${W/2 + 30}" cy="1400" r="5" fill="#ffbc07" opacity="0.4"/>

  <!-- Watermark bottom -->
  <text
    x="${W / 2}" y="${H - 120}"
    font-family="'Segoe UI', 'Arial', sans-serif"
    font-size="28" font-weight="400"
    fill="${lineColor}"
    text-anchor="middle"
    opacity="0.5"
  >© 2026 WinRak · Algeria</text>
</svg>`.trim()
}

async function generate(svgStr, outPath) {
  await sharp(Buffer.from(svgStr))
    .png()
    .toFile(outPath)
  console.log('✅ Written:', outPath)
}

// Dark splash
await generate(
  makeSvg({ bg: '#22272b', text: '#f0f2f5', sub: '#8a95a3', tagline: '#8a95a3', lineColor: '#8a95a3' }),
  join(ROOT, 'assets', 'splash-dark.png'),
)

// Light splash
await generate(
  makeSvg({ bg: '#f2f3f5', text: '#22272b', sub: '#687180', tagline: '#687180', lineColor: '#687180' }),
  join(ROOT, 'assets', 'splash-light.png'),
)

console.log('🎉 Both splash screens generated!')
