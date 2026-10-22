// Writes src/pages/arduino/simulator/unoBoard.json, the Arduino Uno Rev3's
// board as the 3D model draws it: outline, mounting holes, top copper
// (traces, pads, vias) and where every part sits with its body size. It is
// read from Arduino's own CAD files for the board (A000066, Eagle .brd),
// licensed CC BY-SA 4.0. Units are millimetres in the board's frame (x from
// the USB end, y up from the power header side).
//
//   node scripts/build-uno-board.mjs [path/to/UNO-TH_Rev3e.brd]
import { readFileSync, writeFileSync } from 'node:fs'
import { unzip } from '../src/pages/arduino/simulator/compiler/zip.js'

const CAD_FILES = 'https://docs.arduino.cc/static/6bb7a3ca51ebee82a252f60c0b418787/A000066-cad-files.zip'

async function loadBoard() {
  if (process.argv[2]) return readFileSync(process.argv[2], 'utf8')
  const response = await fetch(CAD_FILES)
  if (!response.ok) throw new Error(`CAD files: HTTP ${response.status}`)
  const files = await unzip(new Uint8Array(await response.arrayBuffer()))
  const [, data] = [...files].find(([path]) => path.endsWith('.brd'))
  return new TextDecoder().decode(data)
}

// A small XML reader: enough for Eagle's files (no CDATA, no entities that
// matter here).
function parseXml(text) {
  const root = { tag: '#root', attrs: {}, children: [] }
  const stack = [root]
  const pattern = /<(\/?)([A-Za-z_][\w.-]*)((?:\s+[\w:.-]+="[^"]*")*)\s*(\/?)>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<!DOCTYPE[^>]*>/g
  for (const match of text.matchAll(pattern)) {
    const [, closing, tag, rawAttrs, selfClosing] = match
    if (!tag) continue
    if (closing) {
      stack.pop()
      continue
    }
    const attrs = Object.fromEntries([...(rawAttrs ?? '').matchAll(/([\w:.-]+)="([^"]*)"/g)].map(([, key, value]) => [key, value]))
    const node = { tag, attrs, children: [] }
    stack[stack.length - 1].children.push(node)
    if (!selfClosing) stack.push(node)
  }
  return root
}

const find = (node, tag) => node.children.find((child) => child.tag === tag)
const findPath = (node, ...tags) => tags.reduce((current, tag) => current && find(current, tag), node)
const num = (value) => Number(value ?? 0)
const round = (value) => Math.round(value * 1000) / 1000

// Eagle's "MR90": mirrored, turned 90° counter-clockwise.
function rotation(rot = 'R0') {
  const mirror = rot.includes('M')
  const degrees = Number(rot.replace(/[A-Z]/g, '')) || 0
  return { mirror, degrees }
}

function place(element, x, y) {
  const { mirror, degrees } = rotation(element.attrs.rot)
  const local = [mirror ? -x : x, y]
  const angle = (degrees * Math.PI) / 180
  return [
    num(element.attrs.x) + local[0] * Math.cos(angle) - local[1] * Math.sin(angle),
    num(element.attrs.y) + local[0] * Math.sin(angle) + local[1] * Math.cos(angle),
  ]
}

const LAYER = { top: '1', bottom: '16', dimension: '20', tPlace: '21', tDocu: '51' }

const text = await loadBoard()
const drawing = findPath(parseXml(text), 'eagle', 'drawing', 'board')
const plain = find(drawing, 'plain')

const outline = plain.children
  .filter((item) => item.tag === 'wire' && item.attrs.layer === LAYER.dimension)
  .map(({ attrs }) => [num(attrs.x1), num(attrs.y1), num(attrs.x2), num(attrs.y2), num(attrs.curve)])
const holes = plain.children.filter((item) => item.tag === 'hole').map(({ attrs }) => [num(attrs.x), num(attrs.y), num(attrs.drill)])

// Top copper: traces and vias of every signal.
const traces = []
const vias = []
for (const signal of find(drawing, 'signals').children) {
  for (const item of signal.children) {
    const { attrs } = item
    if (item.tag === 'wire' && attrs.layer === LAYER.top) traces.push([num(attrs.x1), num(attrs.y1), num(attrs.x2), num(attrs.y2), num(attrs.width), num(attrs.curve)].map(round))
    if (item.tag === 'via') vias.push([num(attrs.x), num(attrs.y), num(attrs.drill), num(attrs.diameter) || num(attrs.drill) + 0.5].map(round))
  }
}

// Packages by library and name.
const packages = new Map()
for (const library of find(drawing, 'libraries').children) {
  for (const pack of find(library, 'packages')?.children ?? []) packages.set(`${library.attrs.name}/${pack.attrs.name}`, pack)
}

// A package's body outline (its documentation drawing, else its pads),
// as [minX, minY, maxX, maxY] around the part's origin.
function bodyBox(pack) {
  const xs = []
  const ys = []
  const add = (x, y) => {
    xs.push(x)
    ys.push(y)
  }
  for (const layer of [LAYER.tDocu, LAYER.tPlace, null]) {
    for (const item of pack.children) {
      const { attrs } = item
      if (layer && attrs.layer !== layer) continue
      if (!layer && item.tag !== 'smd' && item.tag !== 'pad') continue
      if (item.tag === 'wire') add(num(attrs.x1), num(attrs.y1)), add(num(attrs.x2), num(attrs.y2))
      if (item.tag === 'rectangle') add(num(attrs.x1), num(attrs.y1)), add(num(attrs.x2), num(attrs.y2))
      if (item.tag === 'circle') add(num(attrs.x) - num(attrs.radius), num(attrs.y) - num(attrs.radius)), add(num(attrs.x) + num(attrs.radius), num(attrs.y) + num(attrs.radius))
      if (item.tag === 'smd') add(num(attrs.x) - num(attrs.dx) / 2, num(attrs.y) - num(attrs.dy) / 2), add(num(attrs.x) + num(attrs.dx) / 2, num(attrs.y) + num(attrs.dy) / 2)
      if (item.tag === 'pad') add(num(attrs.x), num(attrs.y))
    }
    if (xs.length) break
  }
  return xs.length ? [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)].map(round) : null
}

const smdPads = []
const thtPads = []
const silk = []
const elements = []
for (const element of find(drawing, 'elements').children) {
  const pack = packages.get(`${element.attrs.library}/${element.attrs.package}`)
  if (!pack || element.attrs.package === 'FRAME') continue
  const { mirror, degrees } = rotation(element.attrs.rot)
  for (const item of pack.children) {
    const { attrs } = item
    if (item.tag === 'smd') {
      // Pads on the bottom (test points) or on a mirrored part are not seen.
      if ((attrs.layer === LAYER.top) === mirror) continue
      const [x, y] = place(element, num(attrs.x), num(attrs.y))
      const own = rotation(attrs.rot).degrees
      smdPads.push([x, y, num(attrs.dx), num(attrs.dy), (degrees + own) % 360, num(attrs.roundness)].map(round))
    }
    if (item.tag === 'pad') {
      const [x, y] = place(element, num(attrs.x), num(attrs.y))
      thtPads.push([round(x), round(y), num(attrs.drill), num(attrs.diameter) || num(attrs.drill) * 1.6, attrs.shape ?? 'round'])
    }
    if (!mirror && item.tag === 'wire' && attrs.layer === LAYER.tPlace) {
      const [x1, y1] = place(element, num(attrs.x1), num(attrs.y1))
      const [x2, y2] = place(element, num(attrs.x2), num(attrs.y2))
      silk.push([x1, y1, x2, y2, num(attrs.width), num(attrs.curve)].map(round))
    }
  }
  if (mirror) continue
  elements.push({
    name: element.attrs.name,
    package: element.attrs.package,
    value: element.attrs.value ?? '',
    x: round(num(element.attrs.x)),
    y: round(num(element.attrs.y)),
    rot: degrees,
    body: bodyBox(pack),
  })
}

const board = { source: 'Arduino Uno Rev3 (A000066) CAD files, CC BY-SA 4.0', outline, holes, traces, vias, smdPads, thtPads, silk, elements }
writeFileSync(new URL('../src/pages/arduino/simulator/unoBoard.json', import.meta.url), JSON.stringify(board))
console.log(`${traces.length} traces, ${vias.length} vias, ${smdPads.length + thtPads.length} pads, ${elements.length} parts`)
