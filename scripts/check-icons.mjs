import { readFileSync, readdirSync, statSync } from 'fs'
import { join, extname } from 'path'

const ROOT = join(process.cwd())
const GLYPH = join(ROOT, 'node_modules/@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/MaterialCommunityIcons.json')
const valid = new Set(Object.keys(JSON.parse(readFileSync(GLYPH, 'utf8'))))

const SKIP = new Set(['node_modules', '.git', '.expo', 'scripts', 'assets', 'android', 'ios'])
const files = []
function walk(dir) {
  for (const e of readdirSync(dir)) {
    if (SKIP.has(e)) continue
    const p = join(dir, e)
    const s = statSync(p)
    if (s.isDirectory()) walk(p)
    else if (['.tsx', '.ts'].includes(extname(p))) files.push(p)
  }
}
walk(ROOT)

// Match icon usages only: <Icon name="x" />, icon="x", icon: 'x'
const patterns = [
  /<Icon\b[^>]*?\bname=["']([a-z][a-z0-9-]+)["']/g,
  /<MaterialCommunityIcons\b[^>]*?\bname=["']([a-z][a-z0-9-]+)["']/g,
  /\bicon\s*[:=]\s*["']([a-z][a-z0-9-]+)["']/g,
]

const used = new Map() // name -> [file:line]
for (const f of files) {
  const text = readFileSync(f, 'utf8')
  const lines = text.split('\n')
  lines.forEach((line, i) => {
    for (const re of patterns) {
      re.lastIndex = 0
      let m
      while ((m = re.exec(line))) {
        const name = m[1]
        if (!used.has(name)) used.set(name, [])
        used.get(name).push(`${f.replace(ROOT, '.')}:${i + 1}`)
      }
    }
  })
}

const broken = []
for (const [name, locs] of [...used].sort()) {
  if (!valid.has(name)) broken.push([name, locs])
}

console.log(`Total distinct icon names used: ${used.size}`)
console.log(`Glyphmap entries: ${valid.size}`)
console.log(`\n=== BROKEN (not in glyphmap) ===`)
if (broken.length === 0) console.log('(none)')
for (const [name, locs] of broken) {
  console.log(`\n  ${name}`)
  for (const l of locs) console.log(`    ${l}`)
}
