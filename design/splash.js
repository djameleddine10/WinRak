const { Resvg } = require('@resvg/resvg-js');
const fs = require('fs');
const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <circle cx="512" cy="512" r="150" fill="#111111"/>
  <circle cx="512" cy="512" r="34" fill="#ffffff"/>
</svg>`;
const r = new Resvg(svg, { fitTo:{mode:'width',value:1024}, background:'rgba(0,0,0,0)' });
fs.writeFileSync('splash.png', r.render().asPng());
console.log('splash.png done');
