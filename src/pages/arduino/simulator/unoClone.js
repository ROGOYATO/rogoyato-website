// The kit's board: the blue "UNO R3" clone with an SMD ATmega328P-AU and a
// CH340G USB chip. Its outline, mounting holes, headers, USB and power jacks
// are where the R3's are (shields fit both), so it takes the same unoBoard
// geometry; the parts in between follow photos of the board as sold
// (Robolink, Direnc.net).
import * as THREE from 'three'
import { PWM_PINS } from '../../../utils/avrSim/catalog'
import { chipTop, cylinder, electrolytic, metal } from './models'
import { BUILD, UNO_SIZE, boardSlab, bx, bz, chipPart, headerHoles, leads, placePart, plastic, unoElement, unoPinLayout } from './unoModel'

const PITCH = 0.254

// What each part is, for the hover text.
const INFO = {
  MCU: 'ATmega328P-AU · kartın beyni, yüzey montaj (SMD) kılıfta: yüklediğiniz program bunun içinde çalışır (16 MHz, 32 KB program belleği, 2 KB RAM)',
  CH340: 'CH340G · USB ile seri port arasında köprü; bilgisayar programı kartın içine bunun üzerinden yükler (Windows’ta sürücü gerekebilir)',
  Y1: '12 MHz kristal · CH340G’nin saati',
  Y2: '16 MHz kristal · ATmega328P’nin saati: delay() ve millis() buna göre sayar',
  U1: '5 V regülatör (AMS1117-5.0) · DC girişten gelen 7–12 V’u kartın 5 V’una indirir',
  U2: '3.3 V regülatör · 3.3V pinini besler (en fazla 50 mA çekin)',
  U5: 'LM358 op-amp · USB ile DC giriş arasında güç seçer',
  C1: '47 µF kondansatör · 5 V beslemeyi düzgünleştirir',
  C2: '47 µF kondansatör · DC girişi düzgünleştirir',
  RESET: 'RESET butonu · basıp bırakınca program setup()’tan yeniden başlar',
  ICSP: 'ICSP · ATmega328P’yi programlayıcıyla doğrudan programlama pinleri (MISO, 5V, SCK, MOSI, RESET, GND)',
  X1: 'DC güç girişi · 7–12 V adaptör (ortası +)',
  X2: 'USB-B soketi · bilgisayara bağlanır; hem güç hem program buradan gelir',
  L: 'L LED’i · D13’e bağlı (LED_BUILTIN); Blink bunu yakar',
  TX: 'TX LED’i · kart bilgisayara seri veri gönderirken yanıp söner',
  RX: 'RX LED’i · bilgisayardan seri veri gelirken yanıp söner',
  ON: 'ON LED’i · kartta güç varken yanar',
  IOH: 'Dişi pin soketi · dijital pinler 8–13, GND, AREF, SDA, SCL',
  IOL: 'Dişi pin soketi · dijital pinler 0–7',
  POWER: 'Dişi pin soketi · güç pinleri',
  AD: 'Dişi pin soketi · analog girişler A0–A5',
  extra: 'Boş lehim delikleri · başlıkların yanındaki ikinci sıra ve I²C/seri/güç pinleri; istenirse pin lehimlenir',
}

// The clone's own parts, in board millimetres (x from the USB end, y up
// from the power header), read off the photos.
const PARTS = [
  { name: 'MCU', build: 'TQFP32', x: 43.8, y: 26.3, rot: 0 },
  { name: 'CH340', build: 'SO16', x: 20.0, y: 31.2, rot: 0 },
  { name: 'Y1', build: 'QS', value: '12MHz', x: 21.6, y: 39.4, rot: 0 },
  { name: 'Y2', build: 'QS', value: '16MHz', x: 55.6, y: 26.6, rot: 90 },
  { name: 'U1', build: 'SOT223', x: 6.4, y: 17.6, rot: 90 },
  { name: 'U2', build: 'SOT-23', x: 15.8, y: 15.2, rot: 0 },
  { name: 'U5', build: 'SO8', x: 27.8, y: 15.6, rot: 90 },
  { name: 'C1', build: 'CAP47', x: 28.2, y: 9.4, rot: 90 },
  { name: 'C2', build: 'CAP47', x: 21.3, y: 9.4, rot: 90 },
  { name: 'RESET', build: 'TACT', x: 7.2, y: 49.6, rot: 0 },
  { name: 'ON', build: 'LED', x: 28.6, y: 42.4, rot: 90 },
  { name: 'RX', build: 'LED', x: 28.6, y: 36.0, rot: 90 },
  { name: 'TX', build: 'LED', x: 28.6, y: 29.6, rot: 90 },
  { name: 'L', build: 'LED', x: 28.6, y: 23.2, rot: 90 },
  ...[39.2, 32.8, 26.4, 20.0].map((y, i) => ({ name: `R${i}`, build: 'R0805', x: 28.6, y, rot: 90 })),
  ...[
    [24.6, 38.6], [24.6, 44.6], [13.2, 30.4], [13.2, 27.4], [19.2, 20.4], [16.6, 20.4], [22.0, 22.8],
    [12.0, 22.4], [33.8, 33.0], [33.8, 20.0], [50.2, 30.6], [50.2, 22.6], [38.6, 33.6], [38.6, 19.0], [35.0, 12.2],
  ].map(([x, y], i) => ({ name: `C${i + 10}`, build: i % 3 === 2 ? 'R0805' : 'C0805', x, y, rot: i % 2 ? 90 : 0 })),
  { name: 'T1', build: 'SOT-23', x: 22.4, y: 15.4, rot: 90 },
  { name: 'D1', build: 'SOD', x: 11.2, y: 9.6, rot: 0 },
]

// The ATmega328P-AU's pins: (side, index) to the board, and what each one
// carries, to route copper from it.
const MCU_SIGNALS = ['D3', 'D4', null, null, null, null, 'XTAL1', 'XTAL2', 'D5', 'D6', 'D7', 'D8', 'D9', 'D10', 'D11', 'D12', 'D13', null, null, 'AREF', null, null, 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'RESET', 'D0', 'D1', 'D2']
function mcuPin(number) {
  const { x, y } = PARTS[0]
  const side = Math.floor((number - 1) / 8)
  const along = (((number - 1) % 8) - 3.5) * 0.8
  const reach = 4.6
  // Seen from above, numbered counter-clockwise from the corner nearest the
  // power header on the far side: +x side, then +y, −x, −y.
  return [
    [x + reach, y + along],
    [x - along, y + reach],
    [x - reach, y - along],
    [x + along, y - reach],
  ][side]
}

const BUILDERS = {
  TQFP32(group) {
    group.add(box3(0.7, 0.1, 0.7, chipTop(['ATMEL', 'MEGA328P', 'AU 2142'], 0.7, 0.7), 0, 0.21, 0))
    group.add(cylinder(0.03, 0.005, '#0b0b0d', 0.26, 0.262, 0.26, 12))
    const pins = []
    for (let i = 0; i < 8; i += 1) {
      const a = (i - 3.5) * 0.08
      pins.push([0.42, a, 0.14, 0.035], [-0.42, a, 0.14, 0.035], [a, 0.42, 0.035, 0.14], [a, -0.42, 0.035, 0.14])
    }
    leads(group, pins, 0.025)
  },
  SO16(group) {
    group.add(box3(1.0, 0.15, 0.39, chipTop(['CH340G', '2149F1E8'], 1.0, 0.39), 0, 0.235, 0))
    leads(group, [...Array(8)].flatMap((_, i) => [[(i - 3.5) * 0.127, -0.27, 0.042, 0.16], [(i - 3.5) * 0.127, 0.27, 0.042, 0.16]]), 0.03)
  },
  SO8(group) {
    group.add(box3(0.49, 0.15, 0.39, chipTop(['LM358'], 0.49, 0.39), 0, 0.235, 0))
    leads(group, [...Array(4)].flatMap((_, i) => [[(i - 1.5) * 0.127, -0.27, 0.042, 0.16], [(i - 1.5) * 0.127, 0.27, 0.042, 0.16]]), 0.03)
  },
  QS: BUILD.QS,
  SOT223: BUILD.SOT223,
  'SOT-23': BUILD['SOT-23'],
  CAP47(group) {
    group.add(box3(0.66, 0.06, 0.66, plastic('#131315', 0.6), 0, 0.19, 0))
    electrolytic(group, 0, 0.22, 0, 0.315, 0.54, ['RVT', '47', '25V'])
    leads(group, [[-0.3, 0, 0.12, 0.12], [0.3, 0, 0.12, 0.12]])
  },
  // The red-capped SMD tactile switch in the corner by the USB socket.
  TACT(group) {
    group.add(box3(0.6, 0.18, 0.36, metal('#c9cdd1', 0.3), 0, 0.25, 0))
    group.add(box3(0.6, 0.06, 0.36, plastic('#ecebe6', 0.5), 0, 0.19, 0))
    const cap = cylinder(0.11, 0.16, plastic('#d9312c', 0.4), 0, 0.42, 0, 24)
    cap.userData.kind = 'reset'
    group.add(cap)
    group.children[0].userData.kind = 'reset'
    leads(group, [[-0.36, -0.12, 0.12, 0.08], [0.36, -0.12, 0.12, 0.08], [-0.36, 0.12, 0.12, 0.08], [0.36, 0.12, 0.12, 0.08]], 0.03)
    return cap
  },
  // White-bodied 0805 LEDs; the chip shows through when lit.
  LED(group, element) {
    group.add(box3(0.2, 0.06, 0.125, plastic('#f1f1ec', 0.4), 0, 0.19, 0))
    const colour = element.name === 'ON' ? '#ef4444' : element.name === 'L' ? '#f59e0b' : '#f59e0b'
    const lens = box3(0.12, 0.03, 0.1, new THREE.MeshStandardMaterial({ color: colour, emissive: colour, emissiveIntensity: element.name === 'ON' ? 1.6 : 0, roughness: 0.3 }), 0, 0.235, 0)
    group.add(lens)
    leads(group, [[-0.105, 0, 0.04, 0.125], [0.105, 0, 0.04, 0.125]], 0.06)
    return lens
  },
  R0805(group) {
    chipPart(group, 0.2, 0.125, 0.05, plastic('#121214'))
  },
  C0805(group) {
    chipPart(group, 0.2, 0.125, 0.085, plastic('#a8865a'))
  },
  SOD(group) {
    group.add(box3(0.27, 0.1, 0.16, plastic('#18181b'), 0, 0.21, 0), box3(0.04, 0.002, 0.16, plastic('#b9bcc0'), -0.09, 0.261, 0))
    leads(group, [[-0.18, 0, 0.08, 0.1], [0.18, 0, 0.08, 0.1]])
  },
}

function box3(w, h, d, material, x, y, z) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  return mesh
}

// The holes beside the headers and the spare pin grid: plated, unfilled.
const innerRows = () => unoPinLayout().map((pin) => ({ x: pin.x, z: pin.z + (pin.z < 0 ? 0.254 : -0.254), pin }))
const GRID = [[58.42, 60.96, 63.5], [20.32, 17.78, 15.24]] // x × y, board mm
const GRID_LABELS = [['RX', 'TX', '5V', 'GND'], ['SCL', 'SDA', '5V', 'GND'], ['3.3V', '3.3V', 'GND', 'GND']]

// ---------------------------------------------------------------------------

function drawCloneTop(scale, bump) {
  const { width, depth } = UNO_SIZE
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(depth * scale)
  const ctx = canvas.getContext('2d')
  const px = (x) => (x + width / 2) * scale
  const pz = (z) => (z + depth / 2) * scale
  const mmx = (x) => px(bx(x))
  const mmz = (y) => pz(bz(y))
  const mask = bump ? '#808080' : '#1846b0'
  const copper = bump ? '#9a9a9a' : '#2a5fd0'
  const ink = bump ? '#bdbdbd' : '#f4f7fb'
  const tinned = bump ? '#b0b0b0' : '#d1d5d9'
  ctx.fillStyle = mask
  ctx.fillRect(0, 0, canvas.width, canvas.height)

  // Copper under the mask: each I/O pin of the chip runs to its header
  // hole, the crystals and the USB chip to theirs, wide power traces.
  ctx.strokeStyle = copper
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  const route = (points, w = 0.3) => {
    ctx.lineWidth = Math.max(1.5, (w * scale) / 10)
    ctx.beginPath()
    points.forEach(([x, y], i) => (i ? ctx.lineTo(mmx(x), mmz(y)) : ctx.moveTo(mmx(x), mmz(y))))
    ctx.stroke()
  }
  const header = Object.fromEntries(unoPinLayout().map((pin) => [pin.anchor ?? pin.id, [(pin.x + UNO_SIZE.width / 2) * 10, (UNO_SIZE.depth / 2 - pin.z) * 10]]))
  MCU_SIGNALS.forEach((signal, i) => {
    const target = header[signal]
    if (!target) return
    const [sx, sy] = mcuPin(i + 1)
    // Out of the chip, a 45° run, then straight to the hole.
    const towardY = Math.abs(target[1] - sy) > Math.abs(target[0] - sx)
    const bend = towardY ? [target[0], sy + Math.sign(target[1] - sy) * Math.abs(target[0] - sx)] : [sx + Math.sign(target[0] - sx) * Math.abs(target[1] - sy), target[1]]
    route([[sx, sy], bend, target], 0.25)
  })
  const xtal = [mcuPin(7), mcuPin(8)]
  route([xtal[0], [52.4, 25.4], [53.2, 25.4]], 0.25)
  route([xtal[1], [52.4, 27.8], [58, 27.8]], 0.25)
  route([[16.4, 33.5], [12, 33.5], [8, 36], [3.8, 36]], 0.4) // USB D+ / D−
  route([[16.4, 34.4], [12.6, 34.4], [8.6, 37.6], [3.8, 37.6]], 0.4)
  route([[18.5, 33.5], [18.5, 39.4]], 0.3)
  route([[23.5, 33.5], [23.5, 39.4]], 0.3)
  route([[23.5, 28.8], [33, 28.8], [36, 31.6], [40.6, 31.6]], 0.25) // CH340 TXD/RXD → D0/D1
  route([[22.6, 28.8], [22.6, 26], [36, 26], [39, 22.6]], 0.25)
  route([[6.4, 13.2], [6.4, 6], [20, 6], [21.3, 9.4]], 1.2) // DC jack → regulator → caps
  route([[6.4, 21.6], [14, 21.6], [28.2, 12.6], [36, 12.6], [41.4, 6]], 1.0)
  route([[3.2, 44], [3.2, 52], [41, 52], [44, 49.2]], 0.8) // GND edge run
  route([[36, 4], [62, 4]], 0.8)

  // Tinned pads: header holes and their second row, the spare grid, the
  // CH340's unused 1×4, ICSP.
  const hole = (x, z, r = 0.085) => {
    ctx.fillStyle = tinned
    ctx.beginPath()
    ctx.arc(px(x), pz(z), r * scale, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bump ? '#101010' : '#141414'
    ctx.beginPath()
    ctx.arc(px(x), pz(z), r * 0.5 * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  for (const { x, z } of innerRows()) hole(x, z)
  for (const x of GRID[0]) for (const y of GRID[1]) hole(bx(x), bz(y))
  for (let i = 0; i < 4; i += 1) hole(bx(15.6 + i * 2.54), bz(24.4))
  for (const [x, y, d] of unoElementHoles()) hole(bx(x), bz(y), d / 20 + 0.04)
  // SMD pads under the parts: drawn for the chips, the rest is hidden.
  ctx.fillStyle = tinned
  for (let n = 1; n <= 32; n += 1) {
    const [x, y] = mcuPin(n)
    ctx.fillRect(mmx(x) - 0.03 * scale, mmz(y) - 0.03 * scale, 0.06 * scale, 0.06 * scale)
  }

  // The printing, laid out at 180 px/cm.
  ctx.setTransform(scale / 180, 0, 0, scale / 180, 0, 0)
  scale = 180
  ctx.fillStyle = ink
  ctx.strokeStyle = ink
  ctx.textBaseline = 'middle'
  // Pin names inside the second row of holes, turned along the header.
  for (const { x, z, pin } of innerRows()) {
    const text = cloneSilk(pin)
    if (!text) continue
    const top = z < 0
    ctx.font = `700 ${/^~?\d+$|^A\d$/.test(text) ? 26 : 20}px "JetBrains Mono", ui-monospace, monospace`
    ctx.save()
    ctx.translate(px(x), pz(z + (top ? 0.12 : -0.12)))
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = top ? 'right' : 'left'
    ctx.fillText(text, top ? -4 : 4, 1)
    ctx.restore()
  }
  // Titles run along the headers, as printed on the board.
  ctx.textAlign = 'center'
  ctx.font = 'italic 700 96px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
  ctx.fillText('UNO', mmx(50), mmz(39.5))
  ctx.font = '700 24px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('DIGITAL PWM(~)', mmx(45), mmz(44.4))
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(mmx(31), mmz(45.6))
  ctx.lineTo(mmx(66), mmz(45.6))
  ctx.stroke()
  ctx.font = '700 26px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('POWER', mmx(37.5), mmz(11.2))
  ctx.fillText('ANALOG IN', mmx(57), mmz(11.2))
  ctx.font = '700 18px "JetBrains Mono", ui-monospace, monospace'
  ctx.fillText('ICSP', mmx(61.2), mmz(27.9))
  for (const [name, x, y] of [['ON', 31.6, 42.4], ['RX', 31.6, 36.0], ['TX', 31.6, 29.6], ['L', 31.6, 23.2], ['X1', 14, 26.8]]) {
    ctx.save()
    ctx.translate(mmx(x), mmz(y))
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(name, 0, 0)
    ctx.restore()
  }
  // The crystals' outlines, a little wider than their cans.
  ctx.lineWidth = 3
  for (const { x, y, rot } of PARTS.filter((part) => part.build === 'QS')) {
    const [l, w] = [12.0 * (scale / 10), 5.4 * (scale / 10)]
    ctx.save()
    ctx.translate(mmx(x), mmz(y))
    ctx.rotate((-rot * Math.PI) / 180)
    ctx.beginPath()
    ctx.roundRect(-l / 2, -w / 2, l, w, w / 2)
    ctx.stroke()
    ctx.restore()
  }
  // Names of the spare grid's holes.
  ctx.font = '700 15px "JetBrains Mono", ui-monospace, monospace'
  GRID_LABELS.forEach((column, c) => {
    ctx.save()
    ctx.translate(mmx(53.6), mmz(GRID[1][c]))
    ctx.rotate(-Math.PI / 2)
    ctx.fillText(column.join(' '), 0, 0)
    ctx.restore()
  })
  return canvas
}

// What the clone prints by a hole: the R3's names, its IOREF hole marked 5V.
function cloneSilk(pin) {
  if (pin.id === 'NC') return null
  if (pin.anchor === 'IOREF') return '5V'
  if (pin.anchor === 'SDA') return 'SDA'
  if (pin.anchor === 'SCL') return 'SCL'
  if (pin.id === 'D0') return 'RX←0'
  if (pin.id === 'D1') return 'TX→1'
  if (/^D\d+$/.test(pin.id)) return `${PWM_PINS.has(pin.id) ? '~' : ''}${pin.id.slice(1)}`
  return { RESET: 'RES', '3V3': '3.3V', VIN: 'VIN' }[pin.id] ?? pin.id
}

// Through-holes of the connectors the clone shares with the R3 (ICSP pins).
function unoElementHoles() {
  const icsp = unoElement('ICSP')
  return [-1, 0, 1].flatMap((a) => [-1, 1].map((b) => [icsp.x + b * 1.27, icsp.y + a * 2.54, 1.0]))
}

export function buildUnoClone() {
  const group = new THREE.Group()
  group.name = 'uno'
  const scale = 240
  group.add(boardSlab(drawCloneTop(scale, false), drawCloneTop(scale, true), '#123a94', 'Arduino Uno R3 klon (CH340, SMD) · kitteki kart · sürükleyerek taşıyabilirsiniz'))

  // Connectors and headers sit where the R3 has them.
  for (const name of ['X1', 'X2', 'ICSP', 'IOH', 'IOL', 'POWER', 'AD']) {
    const element = unoElement(name)
    placePart(group, element, BUILD[element.package], INFO[name])
  }
  const named = {}
  for (const element of PARTS) {
    named[element.name] = placePart(group, element, BUILDERS[element.build], INFO[element.name] ?? (element.build === 'C0805' ? 'Kondansatör · beslemedeki gürültüyü süzer' : element.build === 'R0805' ? 'Direnç' : null))
  }
  // The unfilled holes take hover text too.
  const spare = new THREE.Mesh(new THREE.BoxGeometry(0.85, 0.01, 0.65), new THREE.MeshBasicMaterial({ visible: false }))
  spare.position.set(bx(60.96), 0.17, bz(17.78))
  spare.userData = { kind: 'uno', info: INFO.extra }
  group.add(spare)
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
