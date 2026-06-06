const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const S = 1024, cx = 512;
// نسخة السائق: خلفية صفراء + W ودبوس أسود (معكوسة عن الراكب)
function defs() {
  return `<defs>
    <radialGradient id="glow" cx="50%" cy="44%" r="55%">
      <stop offset="0%" stop-color="#000000" stop-opacity="0.12"/>
      <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}
function rings(){const py=408;return `<g fill="none" stroke-width="6">
  <ellipse cx="${cx}" cy="${py}" rx="120" ry="105" stroke="#111" stroke-opacity="0.45"/>
  <ellipse cx="${cx}" cy="${py}" rx="185" ry="162" stroke="#111" stroke-opacity="0.25"/>
  <ellipse cx="${cx}" cy="${py}" rx="252" ry="218" stroke="#111" stroke-opacity="0.12"/></g>`;}
function letterW(){const hw=290,yTop=540,yBot=770,yMid=582;const pts=`${cx-hw},${yTop} ${cx-hw*0.5},${yBot} ${cx},${yMid} ${cx+hw*0.5},${yBot} ${cx+hw},${yTop}`;
  return `<polyline points="${pts}" fill="none" stroke="#111" stroke-width="60" stroke-linejoin="round" stroke-linecap="round"/>`;}
function pin(){const hc=408,R=80;const path=`M 512 566 C 480 492, 432 470, 432 ${hc} A ${R} ${R} 0 1 1 592 ${hc} C 592 470, 544 492, 512 566 Z`;
  return `<path d="${path}" fill="#111"/><circle cx="${cx}" cy="${hc}" r="33" fill="#FFD400"/>`;}
function svg(bg){return `<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs()}${bg}<rect x="40" y="60" width="944" height="900" fill="url(#glow)"/>${rings()}${letterW()}${pin()}</svg>`;}
function render(s,f,t){const r=new Resvg(s,{fitTo:{mode:'width',value:1024},background:t?'rgba(0,0,0,0)':undefined});fs.writeFileSync(f,r.render().asPng());console.log('OK',f);}
render(svg(`<rect width="${S}" height="${S}" fill="#FFD400"/>`),'icon-driver.png',false);
render(svg(`<rect width="${S}" height="${S}" rx="200" fill="#FFD400"/>`),'icon-driver-preview.png',true);
render(`<svg xmlns="http://www.w3.org/2000/svg" width="${S}" height="${S}" viewBox="0 0 ${S} ${S}">${defs()}<g transform="translate(512,512) scale(0.72) translate(-512,-512)">${rings()}${letterW()}${pin()}</g></svg>`,'adaptive-icon-driver.png',true);
