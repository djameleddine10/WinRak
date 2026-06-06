const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');

const S = 1024, cx = 512;
const GOLD = '#C9960A', AMBER = '#8B5E00', DARK = '#0A0A0A';

function defs() {
  return `
  <defs>
    <radialGradient id="glow" cx="50%" cy="44%" r="55%">
      <stop offset="0%" stop-color="${GOLD}" stop-opacity="0.20"/>
      <stop offset="45%" stop-color="${GOLD}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${GOLD}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="goldgrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#E4AE1E"/>
      <stop offset="100%" stop-color="#B5840A"/>
    </linearGradient>
    <filter id="soft" x="-60%" y="-60%" width="220%" height="220%">
      <feGaussianBlur stdDeviation="10"/>
    </filter>
  </defs>`;
}

// radar pulse rings radiating from the pin head
function rings() {
  const py = 408;
  return `
    <g fill="none" stroke-width="6">
      <ellipse cx="${cx}" cy="${py}" rx="120" ry="105" stroke="${GOLD}"  stroke-opacity="0.50"/>
      <ellipse cx="${cx}" cy="${py}" rx="185" ry="162" stroke="#A8780A" stroke-opacity="0.30"/>
      <ellipse cx="${cx}" cy="${py}" rx="252" ry="218" stroke="${AMBER}" stroke-opacity="0.15"/>
    </g>`;
}

// big bold geometric W
function letterW() {
  const hw = 290, yTop = 540, yBot = 770, yMid = 582;
  const pts = `${cx-hw},${yTop} ${cx-hw*0.5},${yBot} ${cx},${yMid} ${cx+hw*0.5},${yBot} ${cx+hw},${yTop}`;
  return `<polyline points="${pts}" fill="none" stroke="url(#goldgrad)" stroke-width="60"
            stroke-linejoin="round" stroke-linecap="round"/>`;
}

// location pin sitting on the W's central peak, tail pointing down
function pin() {
  const hc = 408, R = 80;
  const path = `M 512 566
    C 480 492, 432 470, 432 ${hc}
    A ${R} ${R} 0 1 1 592 ${hc}
    C 592 470, 544 492, 512 566 Z`;
  return `
    <path d="${path}" fill="url(#goldgrad)"/>
    <circle cx="${cx}" cy="${hc}" r="33" fill="${DARK}"/>`;
}

function compose(bgRect) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${defs()}
    ${bgRect}
    <rect x="40" y="60" width="944" height="900" fill="url(#glow)"/>
    ${rings()}
    ${letterW()}
    ${pin()}
  </svg>`;
}

function foreground() {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">
    ${defs()}
    <g transform="translate(512,512) scale(0.72) translate(-512,-512)">
      <rect x="40" y="60" width="944" height="900" fill="url(#glow)"/>
      ${rings()}
      ${letterW()}
      ${pin()}
    </g>
  </svg>`;
}

function render(svgStr, file, transparent) {
  const r = new Resvg(svgStr, { fitTo: { mode: 'width', value: 1024 }, background: transparent ? 'rgba(0,0,0,0)' : undefined });
  fs.writeFileSync(file, r.render().asPng());
  console.log('✔', file);
}

render(compose(`<rect width="${S}" height="${S}" fill="${DARK}"/>`), 'icon.png', false);
render(compose(`<rect width="${S}" height="${S}" rx="200" fill="${DARK}"/>`), 'icon-preview.png', true);
render(foreground(), 'adaptive-icon.png', true);
console.log('done');
