// The Arduino Uno R3, built from Arduino's own CAD files for the board
// (unoBoard.json, made by scripts/build-uno-board.mjs; CC BY-SA 4.0): the
// outline, holes, copper and every part sit where they do on the real
// board. The printing on top follows Arduino's photo of today's board
// (A000066). Hovering a part tells what it is.
import * as THREE from 'three'
import { PWM_PINS } from '../../../utils/avrSim/catalog'
import { GOLD, box, chipTop, crystal, cylinder, electrolytic, mat, metal, slab, topTexture } from './models'
import board from './unoBoard.json'

const HEADER_PITCH = 0.254
export const UNO_SIZE = { width: 6.858, depth: 5.334 }

// Board millimetres (x from the USB end, y up from the power header) to the
// scene's centimetres around the board's centre (z grows towards the power
// header).
export const bx = (x) => x / 10 - UNO_SIZE.width / 2
export const bz = (y) => UNO_SIZE.depth / 2 - y / 10

// Every header hole, in the pinout's order. A hole that is another pin
// under a second name (SDA is A4) keeps that name as its anchor.
const HEADERS = {
  digitalLow: { from: bx(63.5), count: 8, z: bz(50.8) }, // D0 … D7, towards the USB end
  digitalHigh: { from: bx(41.656), count: 10, z: bz(50.8) }, // D8 … D13, GND, AREF, SDA, SCL
  power: { from: bx(27.94), count: 8, z: bz(2.54) }, // NC … VIN, away from the USB end
  analog: { from: bx(50.8), count: 6, z: bz(2.54) }, // A0 … A5
}
export function unoPinLayout() {
  const pins = []
  const { digitalLow, digitalHigh, power, analog } = HEADERS
  for (let i = 0; i < 8; i += 1) pins.push({ id: `D${i}`, x: digitalLow.from - i * HEADER_PITCH, z: digitalLow.z })
  ;[['D8'], ['D9'], ['D10'], ['D11'], ['D12'], ['D13'], ['GND', 'GND@top'], ['AREF'], ['A4', 'SDA'], ['A5', 'SCL']].forEach(([id, anchor], i) => pins.push({ id, anchor, x: digitalHigh.from - i * HEADER_PITCH, z: digitalHigh.z }))
  ;[['NC'], ['5V', 'IOREF'], ['RESET'], ['3V3'], ['5V'], ['GND', 'GND@1'], ['GND', 'GND@2'], ['VIN']].forEach(([id, anchor], i) => pins.push({ id, anchor, x: power.from + i * HEADER_PITCH, z: power.z }))
  for (let i = 0; i < 6; i += 1) pins.push({ id: `A${i}`, x: analog.from + i * HEADER_PITCH, z: analog.z })
  return pins
}

// What the board prints beside a hole, as on Arduino's photo of the R3,
// all turned to read along the header: digital pins as bare numbers with ~
// for PWM; NC, SDA and SCL are left blank on top.
function unoSilk(pin) {
  if (pin.id === 'NC' || pin.anchor === 'SDA' || pin.anchor === 'SCL') return null
  if (pin.id === 'D0') return { text: 'RX←0' }
  if (pin.id === 'D1') return { text: 'TX→1' }
  if (/^D\d+$/.test(pin.id)) return { text: `${PWM_PINS.has(pin.id) ? '~' : ''}${pin.id.slice(1)}`, large: true }
  if (/^A\d$/.test(pin.id)) return { text: pin.id, large: true }
  if (pin.anchor === 'GND@top') return { text: 'GND', boxed: true }
  if (pin.anchor === 'GND@1' || pin.anchor === 'GND@2') return null // one boxed GND over both
  return { text: { '5V': pin.anchor === 'IOREF' ? 'IOREF' : '5V', '3V3': '3.3V', VIN: 'Vin' }[pin.id] ?? pin.id }
}

// What each part is, shown when the pointer rests on it.
const PART_INFO = {
  ZU4: 'ATmega328P · kartın beyni: yüklediğiniz program bunun içinde çalışır (16 MHz, 32 KB program belleği, 2 KB RAM)',
  U3: 'ATmega16U2 · USB ile seri port arasında köprü; bilgisayar programı kartın içine bunun üzerinden yükler',
  Y1: '16 MHz kristal · ATmega16U2’nin saati',
  Y2: '16 MHz rezonatör · ATmega328P’nin saati: delay() ve millis() buna göre sayar',
  U1: '5 V regülatör (NCP1117) · DC girişten gelen 7–12 V’u kartın 5 V’una indirir',
  U2: '3.3 V regülatör (LP2985) · 3.3V pinini besler (en fazla 50 mA çekin)',
  U5: 'LMV358 op-amp · USB ile DC giriş arasında güç seçer ve L LED’ini sürer',
  T1: 'FDN340P MOSFET · DC girişte güç varken USB’nin 5 V’unu keser',
  F1: '500 mA sigorta (polyfuse) · bilgisayarın USB portunu aşırı akımdan korur; soğuyunca kendiliğinden düzelir',
  D1: 'M7 diyot · adaptör ters bağlanırsa kartı korur',
  PC1: '47 µF kondansatör · 5 V beslemeyi düzgünleştirir',
  PC2: '47 µF kondansatör · DC girişi düzgünleştirir',
  RESET: 'RESET butonu · basıp bırakınca program setup()’tan yeniden başlar',
  ICSP: 'ICSP · ATmega328P’yi programlayıcıyla doğrudan programlama pinleri (MISO, 5V, SCK, MOSI, RESET, GND)',
  ICSP1: 'ICSP · ATmega16U2’nin programlama pinleri',
  JP2: 'JP2 · ATmega16U2’nin boş kalan pinleri (lehimlenmemiş)',
  X1: 'DC güç girişi · 7–12 V adaptör (ortası +)',
  X2: 'USB-B soketi · bilgisayara bağlanır; hem güç hem program buradan gelir',
  L: 'L LED’i · D13’e bağlı (LED_BUILTIN); Blink bunu yakar',
  TX: 'TX LED’i · kart bilgisayara seri veri gönderirken yanıp söner',
  RX: 'RX LED’i · bilgisayardan seri veri gelirken yanıp söner',
  ON: 'ON LED’i · kartta güç varken yanar',
  'RESET-EN': 'RESET-EN köprüsü · kesilirse kart, Serial Monitor açılınca kendini resetlemez',
  GROUND: 'GROUND köprüsü · USB soketinin gövdesini GND’ye bağlar',
  Z1: 'Varistör · USB veri hattını statik elektriğe karşı korur',
  Z2: 'Varistör · USB veri hattını statik elektriğe karşı korur',
  L1: 'Ferrit · USB’den gelen gürültüyü süzer',
  L2: '10 µH bobin · analog ölçümlerin beslemesini (AVCC) süzer',
  RN1: 'Direnç dizisi (4 × 10 kΩ)',
  RN2: 'Direnç dizisi (4 × 1 kΩ) · TX/RX/L LED’lerinin dirençleri',
  RN3: 'Direnç dizisi (4 × 22 Ω) · USB veri hattı',
  RN4: 'Direnç dizisi (4 × 1 kΩ)',
  D2: 'Diyot · 5 V hattını korur',
  D3: 'Diyot · ATmega16U2’nin reset hattını korur',
  IOH: 'Dişi pin soketi · dijital pinler 8–13, GND, AREF, SDA, SCL',
  IOL: 'Dişi pin soketi · dijital pinler 0–7',
  POWER: 'Dişi pin soketi · güç pinleri',
  AD: 'Dişi pin soketi · analog girişler A0–A5',
}
const infoFor = (element) =>
  PART_INFO[element.name] ??
  { 'C0603-ROUND': `${element.value}F kondansatör · beslemedeki gürültüyü süzer`, 'R0603-ROUND': `${element.value}Ω direnç`, 'FIDUCIA-MOUNT': 'Hizalama işareti · makinenin kartı yerleştirirken baktığı nokta' }[element.package] ??
  null

// The board's outline as a shape (shape y is -z), arcs included.
export function outlineShape() {
  const segments = board.outline.map(([x1, y1, x2, y2, curve]) => ({ from: [bx(x1), -bz(y1)], to: [bx(x2), -bz(y2)], curve }))
  const chain = [segments.shift()]
  while (segments.length) {
    const end = chain[chain.length - 1].to
    const index = segments.findIndex(({ from, to }) => Math.hypot(from[0] - end[0], from[1] - end[1]) < 1e-4 || Math.hypot(to[0] - end[0], to[1] - end[1]) < 1e-4)
    if (index < 0) break
    const [next] = segments.splice(index, 1)
    // Run it the right way round (an arc's sweep turns with it).
    chain.push(Math.hypot(next.from[0] - end[0], next.from[1] - end[1]) < 1e-4 ? next : { from: next.to, to: next.from, curve: -next.curve })
  }
  const shape = new THREE.Shape()
  shape.moveTo(...chain[0].from)
  for (const { from, to, curve } of chain) {
    if (!curve) {
      shape.lineTo(...to)
      continue
    }
    // An Eagle arc: `curve` degrees from `from` to `to` (y is flipped here).
    const sweep = (-curve * Math.PI) / 180
    const chord = Math.hypot(to[0] - from[0], to[1] - from[1])
    const radius = chord / 2 / Math.sin(Math.abs(sweep) / 2)
    const mid = [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2]
    const normal = [-(to[1] - from[1]) / chord, (to[0] - from[0]) / chord]
    const offset = Math.sqrt(Math.max(0, radius * radius - (chord / 2) ** 2)) * Math.sign(sweep)
    const centre = [mid[0] + normal[0] * offset, mid[1] + normal[1] * offset]
    const start = Math.atan2(from[1] - centre[1], from[0] - centre[0])
    shape.absarc(centre[0], centre[1], radius, start, start + sweep, sweep < 0)
  }
  for (const [x, y, drill] of board.holes) {
    const hole = new THREE.Path()
    hole.absarc(bx(x), -bz(y), drill / 20, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  return shape
}

// ---------------------------------------------------------------------------
// The top of the board: solder mask over copper traces, tinned pads, vias
// and the white printing, drawn once in colour and once as a height map.

function drawBoardTop(scale, bump) {
  const { width, depth } = UNO_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(depth * scale)
  const ctx = canvas.getContext('2d')
  // (scale switches to 180 for the printing; these read it when called.)
  const px = (x) => (x + width / 2) * scale
  const pz = (z) => (z + depth / 2) * scale
  const mmx = (x) => px(bx(x))
  const mmz = (y) => pz(bz(y))
  const ink = bump ? '#bdbdbd' : '#f1fbfb'
  const mask = bump ? '#808080' : '#006c72'
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Copper under the mask shows a little lighter and stands proud.
  ctx.strokeStyle = bump ? '#9a9a9a' : '#0b8584'
  ctx.lineCap = 'round'
  for (const [x1, y1, x2, y2, w] of board.traces) {
    ctx.lineWidth = Math.max(1.5, (w * scale) / 10)
    ctx.beginPath()
    ctx.moveTo(mmx(x1), mmz(y1))
    ctx.lineTo(mmx(x2), mmz(y2))
    ctx.stroke()
  }
  // Vias: a ring with the plated hole.
  for (const [x, y, drill, diameter] of board.vias) {
    ctx.fillStyle = bump ? '#a0a0a0' : '#2aa3a0'
    ctx.beginPath()
    ctx.arc(mmx(x), mmz(y), (diameter * scale) / 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bump ? '#202020' : '#0c2c2e'
    ctx.beginPath()
    ctx.arc(mmx(x), mmz(y), (drill * scale) / 20, 0, Math.PI * 2)
    ctx.fill()
  }
  // Tinned pads (surface-mount and through-hole).
  const tin = bump ? '#b0b0b0' : '#c9cdd1'
  for (const [x, y, w, h, rot, roundness] of board.smdPads) {
    ctx.save()
    ctx.translate(mmx(x), mmz(y))
    ctx.rotate((-rot * Math.PI) / 180)
    ctx.fillStyle = tin
    ctx.beginPath()
    const [pw, ph] = [(w * scale) / 10, (h * scale) / 10]
    ctx.roundRect(-pw / 2, -ph / 2, pw, ph, (Math.min(pw, ph) / 2) * (roundness / 100))
    ctx.fill()
    ctx.restore()
  }
  for (const [x, y, drill, diameter] of board.thtPads) {
    ctx.fillStyle = tin
    ctx.beginPath()
    ctx.arc(mmx(x), mmz(y), (diameter * scale) / 20, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bump ? '#101010' : '#141414'
    ctx.beginPath()
    ctx.arc(mmx(x), mmz(y), (drill * scale) / 20, 0, Math.PI * 2)
    ctx.fill()
  }

  // The printing, after Arduino's photo of the board. It is laid out at
  // 180 px/cm and scaled to the canvas.
  ctx.setTransform(scale / 180, 0, 0, scale / 180, 0, 0)
  scale = 180
  const paper = mask // text cut out of a white box
  ctx.fillStyle = ink
  ctx.strokeStyle = ink
  ctx.textBaseline = 'middle'
  for (const pin of unoPinLayout()) {
    const silk = unoSilk(pin)
    if (!silk) continue
    const top = pin.z < 0
    ctx.font = `700 ${silk.large ? 30 : 22}px "JetBrains Mono", ui-monospace, monospace`
    ctx.save()
    ctx.translate(px(pin.x), pz(pin.z + (top ? 0.11 : -0.11)))
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = top ? 'right' : 'left'
    if (silk.boxed) {
      const length = ctx.measureText(silk.text).width
      ctx.fillRect(-length - 10, -20, length + 16, 40)
      ctx.fillStyle = paper
    }
    ctx.fillText(silk.text, top ? -4 : 4, 1)
    ctx.restore()
    ctx.fillStyle = ink
  }
  // The two GNDs of the power header share one white box.
  const [g1, g2] = unoPinLayout()
    .filter((pin) => pin.anchor === 'GND@1' || pin.anchor === 'GND@2')
    .map((pin) => pin.x)
  ctx.fillRect(px(g1 - 0.13), pz(2.0), (g2 - g1 + 0.26) * scale, 0.27 * scale)
  ctx.fillStyle = paper
  ctx.font = '700 24px "JetBrains Mono", ui-monospace, monospace'
  ctx.textAlign = 'center'
  ctx.fillText('GND', px((g1 + g2) / 2), pz(2.14))
  ctx.fillStyle = ink

  // Section names on their rules: DIGITAL - PWM~ is cut out of a white bar.
  ctx.lineWidth = 3
  const rule = (z, from, to) => {
    ctx.beginPath()
    ctx.moveTo(px(from), pz(z))
    ctx.lineTo(px(to), pz(z))
    ctx.stroke()
  }
  ctx.fillRect(px(-0.56), pz(-1.82), 1.68 * scale, 0.15 * scale)
  ctx.fillStyle = paper
  ctx.font = '700 24px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('DIGITAL - PWM~', px(0.28), pz(-1.74))
  ctx.fillStyle = ink
  rule(-1.68, 1.12, 3.02)
  ctx.font = '700 26px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('POWER', px(0.97), pz(1.79))
  ctx.fillText('ANALOG IN', px(2.05), pz(1.79))
  rule(1.7, 0.0, 0.6)
  rule(1.7, 1.33, 1.5)
  rule(1.7, 2.6, 3.04)

  // The ∞ logo with ®, ARDUINO, the UNO R3 plate and the web address.
  const lx = px(0.47)
  const lz = pz(-1.2)
  ctx.lineWidth = 15
  for (const side of [-1, 1]) {
    ctx.beginPath()
    ctx.ellipse(lx + side * 50, lz, 48, 36, 0, 0, Math.PI * 2)
    ctx.stroke()
  }
  ctx.fillRect(lx - 66, lz - 5, 32, 10)
  ctx.fillRect(lx + 34, lz - 5, 32, 10)
  ctx.fillRect(lx + 45, lz - 16, 10, 32)
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.arc(lx + 112, lz - 38, 9, 0, Math.PI * 2)
  ctx.stroke()
  ctx.font = '700 12px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('R', lx + 112, lz - 37)
  ctx.font = '800 46px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
  ctx.fillText('ARDUINO', px(0.46), pz(-0.7))
  ctx.fillRect(px(-0.23), pz(-0.38), 0.76 * scale, 0.32 * scale)
  ctx.lineWidth = 3
  ctx.strokeRect(px(0.53), pz(-0.38), 0.59 * scale, 0.32 * scale)
  ctx.font = '700 40px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillStyle = paper
  ctx.fillText('UNO', px(0.15), pz(-0.21))
  ctx.fillStyle = ink
  ctx.fillText('R3', px(0.82), pz(-0.21))
  ctx.font = '700 18px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('ARDUINO.CC', px(1.97), pz(0.22))

  // Small names by the parts, and the dotted frames of JP2 and RST EN.
  const at = (name) => board.elements.find((element) => element.name === name)
  ctx.font = '700 20px "JetBrains Mono", ui-monospace, monospace'
  ctx.textAlign = 'right'
  for (const name of ['L', 'TX', 'RX']) ctx.fillText(name, mmx(at(name).x) - 0.15 * scale, mmz(at(name).y))
  ctx.textAlign = 'left'
  ctx.fillText('ON', mmx(at('ON').x) + 0.16 * scale, mmz(at('ON').y))
  ctx.textAlign = 'center'
  ctx.fillText('ICSP', mmx(at('ICSP').x) + 0.1 * scale, mmz(at('ICSP').y) - 0.48 * scale)
  ctx.lineWidth = 3
  ctx.setLineDash([5, 5])
  for (const [name, w, h] of [['JP2', 5.6, 5.6], ['RESET-EN', 3.6, 2.4]]) {
    const element = at(name)
    ctx.strokeRect(mmx(element.x) - (w * scale) / 20, mmz(element.y) - (h * scale) / 20, (w * scale) / 10, (h * scale) / 10)
  }
  ctx.setLineDash([])
  const vertical = (text, x, z, size = 20) => {
    ctx.save()
    ctx.translate(x, z)
    ctx.rotate(-Math.PI / 2)
    ctx.font = `700 ${size}px "JetBrains Mono", ui-monospace, monospace`
    ctx.fillText(text, 0, 0)
    ctx.restore()
  }
  vertical('JP2', mmx(at('JP2').x) - 0.38 * scale, mmz(at('JP2').y))
  vertical('RST EN', mmx(at('RESET-EN').x) - 0.28 * scale, mmz(at('RESET-EN').y) + 0.05 * scale, 16)
  vertical('RESET', mmx(at('RESET').x) - 0.46 * scale, mmz(at('RESET').y))
  return canvas
}

// ---------------------------------------------------------------------------
// The parts, each built around its own origin (centimetres; its x along the
// footprint's x, its z = −footprint y) and then put where the CAD file says.

export const tin = () => metal('#d5d8db', 0.32)
export const plastic = (color, roughness = 0.5) => mat(color, { roughness })

// The part's body box from the CAD outline: [centreX, centreZ, width, depth].
function footprint(element) {
  const [x0, y0, x1, y1] = element.body ?? [-0.5, -0.5, 0.5, 0.5]
  return [(x0 + x1) / 20, -(y0 + y1) / 20, (x1 - x0) / 10, (y1 - y0) / 10]
}

// A two-terminal chip (resistor, capacitor, inductor) along its x.
export function chipPart(group, length, width, height, body, ends = tin()) {
  group.add(box(length * 0.62, height, width, body, 0, 0.16 + height / 2, 0))
  for (const side of [-1, 1]) group.add(box(length * 0.2, height + 0.004, width + 0.004, ends, (side * length * 0.4), 0.16 + height / 2, 0))
}

// Gull-wing leads from the body's sides out to the pads.
export function leads(group, points, height = 0.03) {
  for (const [x, z, w, d] of points) group.add(box(w, height, d, tin(), x, 0.16 + height / 2, z))
}

export const BUILD = {
  'DIL28-3'(group) {
    // The ATmega328P in its socket; pin 1 (the notch) at the footprint's -x.
    group.add(box(3.75, 0.2, 0.98, plastic('#1a1a1a', 0.7), 0, 0.26, 0))
    group.add(box(3.56, 0.32, 0.72, chipTop(['ATMEL', 'ATMEGA328P-PU', '2039YE8'], 3.56, 0.72), 0, 0.52, 0))
    group.add(cylinder(0.09, 0.02, '#0e0e10', -1.62, 0.68, 0, 16))
    for (const dx of [-1.0, 1.0]) group.add(cylinder(0.11, 0.01, '#141416', dx, 0.682, 0, 20))
    const leg = metal('#d4d8dc', 0.35)
    for (let i = 0; i < 14; i += 1) {
      const x = -1.651 + i * HEADER_PITCH
      for (const side of [-1, 1]) {
        group.add(box(0.07, 0.03, 0.14, leg, x, 0.47, side * 0.42))
        group.add(box(0.07, 0.16, 0.03, leg, x, 0.39, side * 0.49))
      }
    }
  },
  '2X03'(group) {
    // Male 2 × 3 header, three pins along the footprint's x.
    group.add(box(0.77, 0.25, 0.52, plastic('#141416', 0.6), 0, 0.285, 0))
    for (const a of [-0.254, 0, 0.254]) for (const b of [-0.127, 0.127]) group.add(box(0.064, 0.6, 0.064, GOLD(), a, 0.6, b))
  },
  PANASONIC_D(group, element) {
    // A 6.3 mm SMD electrolytic on its black base; + towards the footprint's +x.
    group.add(box(0.66, 0.06, 0.66, plastic('#131315', 0.6), 0, 0.19, 0))
    electrolytic(group, 0, 0.22, 0, 0.315, 0.52, ['71134', '47', '25V'])
    leads(group, [[-0.3, 0, 0.12, 0.12], [0.3, 0, 0.12, 0.12]])
    group.userData.value = element.value
  },
  L1812(group) {
    // Resettable fuse: dark body between tinned ends.
    chipPart(group, 0.45, 0.32, 0.09, plastic('#2a2622'), metal('#c7a65a', 0.35))
  },
  SMB(group) {
    group.add(box(0.43, 0.22, 0.36, plastic('#1b1b1d'), 0, 0.27, 0))
    group.add(box(0.05, 0.003, 0.36, plastic('#b9bcc0'), -0.16, 0.381, 0)) // cathode band
    leads(group, [[-0.25, 0, 0.12, 0.2], [0.25, 0, 0.12, 0.2]])
  },
  MINIMELF(group) {
    const body = cylinder(0.08, 0.34, mat('#2b3a4a', { roughness: 0.2 }), 0, 0.24, 0, 16)
    body.rotation.z = Math.PI / 2
    const band = cylinder(0.082, 0.05, plastic('#111'), -0.12, 0.24, 0, 16)
    band.rotation.z = Math.PI / 2
    group.add(body, band)
    for (const side of [-1, 1]) {
      const cap = cylinder(0.083, 0.04, tin(), side * 0.17, 0.24, 0, 16)
      cap.rotation.z = Math.PI / 2
      group.add(cap)
    }
  },
  'CHIP-LED0805'(group, element) {
    // White body, the coloured chip shows through the clear top.
    group.add(box(0.125, 0.06, 0.2, plastic('#f1f1ec', 0.4), 0, 0.19, 0))
    const color = element.name === 'ON' ? '#22c55e' : '#f59e0b'
    const lens = box(0.1, 0.03, 0.12, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: element.name === 'ON' ? 1.6 : 0, roughness: 0.3 }), 0, 0.235, 0)
    group.add(lens)
    leads(group, [[0, -0.105, 0.125, 0.04], [0, 0.105, 0.125, 0.04]], 0.06)
    return lens
  },
  SOT223(group) {
    group.add(box(0.65, 0.16, 0.35, plastic('#18181b'), 0, 0.24, 0.03))
    group.add(box(0.3, 0.02, 0.36, tin(), 0, 0.17, -0.31)) // the tab
    leads(group, [-0.231, 0, 0.231].map((x) => [x, 0.29, 0.07, 0.18]))
  },
  MSOP08(group) {
    group.add(box(0.3, 0.1, 0.3, chipTop(['358'], 0.3, 0.3), 0, 0.21, 0))
    leads(group, [-0.0976, -0.0326, 0.0324, 0.0974].flatMap((x) => [[x, -0.19, 0.03, 0.09], [x, 0.19, 0.03, 0.09]]))
  },
  'SOT-23'(group) {
    group.add(box(0.29, 0.1, 0.13, plastic('#18181b'), 0, 0.21, 0))
    leads(group, [[0.099, -0.09, 0.04, 0.07], [-0.094, -0.09, 0.04, 0.07], [0.003, 0.09, 0.04, 0.07]])
  },
  'SOT23-DBV'(group) {
    group.add(box(0.29, 0.1, 0.16, plastic('#18181b'), 0, 0.21, 0))
    leads(group, [[-0.095, 0.11, 0.04, 0.07], [0, 0.11, 0.04, 0.07], [0.095, 0.11, 0.04, 0.07], [-0.095, -0.11, 0.04, 0.07], [0.095, -0.11, 0.04, 0.07]])
  },
  MLF32(group) {
    group.add(box(0.5, 0.09, 0.5, chipTop(['ATMEL', 'MEGA16U2'], 0.5, 0.5), 0, 0.205, 0))
  },
  RESONATOR(group) {
    group.add(box(0.32, 0.06, 0.13, plastic('#d8c7a0', 0.45), 0, 0.19, 0))
    group.add(box(0.3, 0.05, 0.11, metal('#cfd3d7', 0.3), 0, 0.245, 0))
  },
  QS(group, element) {
    // HC-49/S crystal, its length along the footprint's x.
    crystal(group, /12/.test(element.value) ? '12.000' : '16.000')
  },
  TS42(group) {
    // Tactile switch: metal frame, round cap, four tinned legs.
    const frame = box(0.6, 0.2, 0.6, metal('#c3c8cd', 0.3), 0, 0.26, 0)
    const cap = cylinder(0.165, 0.12, plastic('#e2e2dc', 0.45), 0, 0.42, 0, 28)
    frame.userData.kind = 'reset'
    cap.userData.kind = 'reset'
    group.add(frame, cap)
    leads(group, [[-0.42, 0.225, 0.16, 0.14], [0.42, 0.225, 0.16, 0.14], [-0.42, -0.225, 0.16, 0.14], [0.42, -0.225, 0.16, 0.14]], 0.04)
    return cap
  },
  'POWERSUPPLY_DC-21MM'(group, element) {
    // Barrel jack: its mouth at the footprint's +y end, over the board edge.
    const [cx, cz, w, d] = footprint(element)
    group.add(box(w, 1.1, d, plastic('#151517'), cx, 0.71, cz))
    const mouth = cylinder(0.3, 0.04, plastic('#050506', 0.9), cx, 0.76, cz - d / 2 - 0.01, 24)
    mouth.rotation.x = Math.PI / 2
    const centre = cylinder(0.07, 0.06, metal(), cx, 0.76, cz - d / 2 - 0.02, 12)
    centre.rotation.x = Math.PI / 2
    group.add(mouth, centre)
  },
  PN61729(group, element) {
    // USB-B socket: its opening at the footprint's -y end, over the edge.
    const [cx, cz, w, d] = footprint(element)
    group.add(box(w, 1.09, d, metal('#cdd2d7', 0.22), cx, 0.705, cz))
    const back = cz + d / 2
    group.add(box(0.82, 0.78, 0.02, plastic('#0b0b0c', 0.9), cx, 0.7, back + 0.005))
    group.add(box(0.42, 0.3, 0.03, plastic('#f2f2ee', 0.6), cx, 0.7, back + 0.015))
    for (const dx of [-0.45, 0.45]) group.add(box(0.05, 0.04, d - 0.5, metal('#b9bfc5', 0.3), cx + dx, 1.255, cz - 0.2))
  },
  CAY16(group, element) {
    const code = { '10K': '103', '1K': '102', '22R': '220' }[element.value] ?? ''
    group.add(box(0.32, 0.05, 0.16, chipTop([code], 0.32, 0.16), 0, 0.185, 0))
    leads(group, [-0.12, -0.04, 0.04, 0.12].flatMap((x) => [[x, -0.075, 0.04, 0.05], [x, 0.075, 0.04, 0.05]]), 0.04)
  },
  'R0603-ROUND'(group) {
    chipPart(group, 0.16, 0.08, 0.045, plastic('#121214'))
  },
  'C0603-ROUND'(group) {
    chipPart(group, 0.16, 0.08, 0.07, plastic('#a8865a'))
  },
  'CT/CN0603'(group) {
    chipPart(group, 0.16, 0.08, 0.07, plastic('#7d8287'))
  },
  '0805'(group, element) {
    chipPart(group, 0.2, 0.125, 0.085, plastic(element.name === 'L1' ? '#202022' : '#5b5e62'))
  },
  // Female headers: just the housing; the holes and their pins are added
  // with the markers.
  '1X06': header,
  '1X08': header,
  '1X10': header,
}

function header(group, element) {
  const count = Number(element.package.slice(2))
  group.add(box(count * HEADER_PITCH + 0.04, 0.85, 0.26, plastic('#141416', 0.62), 0, 0.585, 0))
}

// ---------------------------------------------------------------------------

// The board itself: the outline cut from a slab with `colour` and
// `heights` canvases on top.
export function boardSlab(colour, heights, edge, info) {
  const { width, depth } = UNO_SIZE
  const top = new THREE.MeshPhysicalMaterial({
    map: topTexture(colour, width, depth),
    bumpMap: topTexture(heights, width, depth, false),
    bumpScale: 1.4,
    roughness: 0.45,
    clearcoat: 0.4,
    clearcoatRoughness: 0.3,
  })
  const pcb = slab(outlineShape(), 0.16, [top, mat(edge, { roughness: 0.6 })])
  pcb.userData = { kind: 'uno', info }
  return pcb
}

// One part at its place on the board (board millimetres, Eagle rotation),
// tagged with what it is for the hover text.
export function placePart(group, element, build, info) {
  const part = new THREE.Group()
  part.position.set(bx(element.x), 0, bz(element.y))
  part.rotation.y = (element.rot * Math.PI) / 180
  const result = build(part, element)
  part.traverse((child) => {
    if (child.isMesh) child.userData = { kind: child.userData.kind ?? 'uno', info }
  })
  group.add(part)
  return result
}

// The holes of the female headers: a dark pit with a contact, and the
// invisible sphere that takes clicks.
export function headerHoles(group) {
  const markers = []
  const pit = mat('#030303', { roughness: 1 })
  const contact = GOLD()
  for (const pin of unoPinLayout()) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, depthWrite: false }))
    hit.position.set(pin.x, 1.06, pin.z)
    hit.userData = { kind: 'pin', owner: 'uno', pin: pin.id, anchor: pin.anchor ?? pin.id, seat: -0.05 }
    const hole = box(0.13, 0.02, 0.13, pit, pin.x, 1.004, pin.z)
    const spring = box(0.05, 0.02, 0.03, contact, pin.x, 1.006, pin.z - 0.03)
    hole.userData = spring.userData = { kind: 'uno' }
    group.add(hole, spring, hit)
    markers.push(hit)
  }
  return markers
}

// The official board's parts by name (the clone keeps its connectors and
// headers where they are).
export const unoElement = (name) => board.elements.find((element) => element.name === name)

export function buildUno() {
  const group = new THREE.Group()
  group.name = 'uno'
  const scale = 240
  group.add(boardSlab(drawBoardTop(scale, false), drawBoardTop(scale, true), '#0d5f63', 'Arduino Uno R3 (resmî) · sürükleyerek taşıyabilirsiniz'))

  // Every part from the CAD file, in place.
  const named = {}
  for (const element of board.elements) {
    const build = BUILD[element.package]
    if (build) named[element.name] = placePart(group, element, build, infoFor(element))
  }
  const markers = headerHoles(group)

  const { L: ledL, TX: ledTx, RX: ledRx, RESET: resetCap } = named
  return {
    group,
    markers,
    setReset(pressed) {
      resetCap.position.y = pressed ? 0.37 : 0.42
    },
    update(state) {
      ledL.material.emissiveIntensity = (state?.pins?.[13] ?? 0) * 3
      ledTx.material.emissiveIntensity = state?.serialActive ? 2.5 : 0
      ledRx.material.emissiveIntensity = state?.serialRx ? 2.5 : 0
    },
  }
}
