// The parts students can put on the bench, their real pins and where those
// pins sit, the breadboard, and the step that turns a wired circuit into
// running parts.
//
// A circuit is { parts, wires }:
//   part: { id, type, position: [x, z] (cm), rotation (degrees), props }
//   wire: { id, from: endpoint, to: endpoint, color }
//   endpoint: { uno: 'D7' | '5V' | 'GND' | ..., anchor? } or { part, pin }
// A breadboard is a part whose pins are its holes ('a12', 'T+5'). Parts whose
// pins land on breadboard holes are plugged in. Older circuits used
// { part, pin, uno } wires; normalizeCircuit() converts them.

export const UNO_DIGITAL = Array.from({ length: 14 }, (_, i) => `D${i}`)
export const UNO_ANALOG = Array.from({ length: 6 }, (_, i) => `A${i}`)
export const UNO_POWER = ['5V', '3V3', 'GND', 'VIN']
export const UNO_PINS = [...UNO_DIGITAL, ...UNO_ANALOG, ...UNO_POWER]
export const PWM_PINS = new Set(['D3', 'D5', 'D6', 'D9', 'D10', 'D11'])
export const PITCH = 0.254 // 2.54 mm header and breadboard pitch, in cm

export function unoPinNumber(name) {
  if (/^D\d+$/.test(name)) return Number(name.slice(1))
  if (/^A\d$/.test(name)) return 14 + Number(name.slice(1))
  return null
}

const LED_COLORS = { red: 'Kırmızı', yellow: 'Sarı', green: 'Yeşil', blue: 'Mavi', white: 'Beyaz' }
export const RESISTOR_VALUES = { 220: '220 Ω', 330: '330 Ω', 1000: '1 kΩ', 10000: '10 kΩ' }

// Board size of each breakout module (width, depth in cm). Their header pins
// run along the back edge at 2.54 mm pitch.
export const MODULE_SIZE = {
  led: [1.3, 1.5],
  rgbLed: [1.6, 1.6],
  button: [1.4, 1.6],
  potentiometer: [1.5, 1.8],
  ldr: [1.5, 1.8],
  buzzer: [1.6, 1.8],
  dht11: [1.6, 2.2],
  sevenSegment: [3.8, 2.6],
  irSensor: [1.4, 3.1],
  motorDriver: [4.3, 4.3],
}

function headerRow(pins, z) {
  return pins.map((pin, index) => ({ ...pin, x: (index - (pins.length - 1) / 2) * PITCH, z }))
}

function moduleRow(type, pins) {
  return headerRow(pins, -MODULE_SIZE[type][1] / 2 + 0.18)
}

// kind: 'signal' goes to an Arduino I/O pin, 'vcc' to 5V, 'gnd' to GND,
// 'lead' is a bare component lead that can go anywhere.
export const PART_CATALOG = {
  breadboard: {
    name: 'Breadboard (830)',
    help: 'Aynı sütundaki a–e delikleri birbirine, f–j delikleri birbirine bağlıdır; orta kanal iki yarıyı ayırır. Kenardaki + ve − hatları boydan boya bağlıdır.',
    pins: [],
  },
  resistor: {
    name: 'Direnç',
    help: 'LED’in akımını sınırlamak (220–330 Ω) ya da buton için pull-down/pull-up (10 kΩ) olarak kullanılır. Yönü yoktur.',
    pins: [{ id: 'A', label: '1', kind: 'lead', x: -2 * PITCH, z: 0 }, { id: 'B', label: '2', kind: 'lead', x: 2 * PITCH, z: 0 }],
    props: { ohms: 330 },
    options: { ohms: RESISTOR_VALUES },
    bare: true,
  },
  bareLed: {
    name: 'LED (5 mm)',
    help: 'Uzun bacak (+, anot) yüksek gerilime, kısa bacak (−, katot) GND’ye gelir. Ters takılırsa yanmaz; seri direnç olmadan bağlanırsa gerçekte LED ya da pin zarar görebilir.',
    pins: [{ id: 'A', label: '+', kind: 'lead', x: -PITCH / 2, z: 0 }, { id: 'K', label: '−', kind: 'lead', x: PITCH / 2, z: 0 }],
    props: { color: 'red' },
    options: { color: LED_COLORS },
    bare: true,
  },
  tactButton: {
    name: 'Buton (4 bacak)',
    help: 'Orta kanalın üstüne takılır. Aynı taraftaki iki bacak hep bağlıdır; basınca sol ve sağ bacak çiftleri birleşir. Pull-down için 10 kΩ direnç ya da kodda INPUT_PULLUP gerekir.',
    pins: [
      { id: 'A1', label: '1a', kind: 'lead', x: -PITCH, z: -1.5 * PITCH },
      { id: 'A2', label: '1b', kind: 'lead', x: -PITCH, z: 1.5 * PITCH },
      { id: 'B1', label: '2a', kind: 'lead', x: PITCH, z: -1.5 * PITCH },
      { id: 'B2', label: '2b', kind: 'lead', x: PITCH, z: 1.5 * PITCH },
    ],
    bare: true,
  },
  led: {
    name: 'LED modülü',
    help: 'Direnci üzerinde LED modülü. + ucunu bir dijital pine, − ucunu GND’ye bağlayın.',
    pins: moduleRow('led', [{ id: 'SIG', label: '+', kind: 'signal' }, { id: 'GND', label: '−', kind: 'gnd' }]),
    props: { color: 'red' },
    options: { color: LED_COLORS },
  },
  rgbLed: {
    name: 'RGB LED',
    help: 'Ortak katotlu RGB LED modülü. R, G ve B uçlarını PWM pinlerine bağlarsanız renkleri karıştırabilirsiniz.',
    pins: moduleRow('rgbLed', [{ id: 'R', label: 'R', kind: 'signal' }, { id: 'GND', label: '−', kind: 'gnd' }, { id: 'G', label: 'G', kind: 'signal' }, { id: 'B', label: 'B', kind: 'signal' }]),
  },
  button: {
    name: 'Buton modülü',
    help: 'Dirençli buton modülü. S ucunu dijital pine, diğer ucu 5V’a (basınca HIGH) ya da GND’ye (INPUT_PULLUP ile basınca LOW) bağlayın.',
    pins: moduleRow('button', [{ id: 'SIG', label: 'S', kind: 'signal' }, { id: 'OTHER', label: '5V/GND', kind: 'supply' }]),
  },
  potentiometer: {
    name: 'Potansiyometre',
    help: 'Kenar uçları 5V ve GND’ye, orta uç bir analog pine (A0–A5) bağlanır.',
    pins: moduleRow('potentiometer', [{ id: 'VCC', label: '5V', kind: 'end' }, { id: 'SIG', label: 'S', kind: 'signal', analog: true }, { id: 'GND', label: 'GND', kind: 'end' }]),
  },
  ldr: {
    name: 'LDR modülü',
    help: '10 kΩ dirençle gerilim bölücü olarak bağlı LDR. AO ucu bir analog pine bağlanır.',
    pins: moduleRow('ldr', [{ id: 'VCC', label: 'VCC', kind: 'vcc' }, { id: 'GND', label: 'GND', kind: 'gnd' }, { id: 'AO', label: 'AO', kind: 'signal', analog: true }]),
  },
  buzzer: {
    name: 'Aktif buzzer',
    help: '+ ucu HIGH olunca öter; tone() ile farklı frekanslar da çalar.',
    pins: moduleRow('buzzer', [{ id: 'SIG', label: '+', kind: 'signal' }, { id: 'GND', label: '−', kind: 'gnd' }]),
  },
  servo: {
    name: 'SG90 servo',
    help: 'Kahverengi GND, kırmızı 5V, turuncu sinyal. Dişi soketi breadboard’a değil, jumper kabloyla bağlanır. Servo kütüphanesi Timer1’i kullanır; D9 ve D10’da analogWrite çalışmaz.',
    pins: headerRow([{ id: 'GND', label: 'GND', kind: 'gnd' }, { id: 'VCC', label: '5V', kind: 'vcc' }, { id: 'SIG', label: 'SIG', kind: 'signal' }], -1.3),
    noPlug: true,
  },
  ultrasonic: {
    name: 'HC-SR04',
    help: 'TRIG’e 10 µs’lik bir darbe gönderin, ECHO’nun HIGH kaldığı süreyi pulseIn() ile ölçün.',
    pins: headerRow([{ id: 'VCC', label: 'VCC', kind: 'vcc' }, { id: 'TRIG', label: 'TRIG', kind: 'signal' }, { id: 'ECHO', label: 'ECHO', kind: 'signal' }, { id: 'GND', label: 'GND', kind: 'gnd' }], -0.3),
  },
  dht11: {
    name: 'DHT11',
    help: 'Sıcaklık ve nem sensörü. DHT kütüphanesiyle okunur: DHT dht(pin, DHT11);',
    pins: moduleRow('dht11', [{ id: 'VCC', label: 'VCC', kind: 'vcc' }, { id: 'DATA', label: 'DATA', kind: 'signal' }, { id: 'GND', label: 'GND', kind: 'gnd' }]),
  },
  sevenSegment: {
    name: '7 segment',
    help: 'Ortak katotlu gösterge. COM ucu GND’ye, a–g ve dp uçları dijital pinlere bağlanır; segment HIGH olunca yanar.',
    pins: moduleRow('sevenSegment', ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp'].map((id) => ({ id, label: id, kind: 'signal', optional: true })).concat([{ id: 'COM', label: 'COM', kind: 'gnd' }])),
  },
  irSensor: {
    name: 'KH-09 IR sensör',
    help: 'Siyah çizgi üzerinde OUT = HIGH, beyaz zeminde OUT = LOW.',
    pins: moduleRow('irSensor', [{ id: 'VCC', label: 'VCC', kind: 'vcc' }, { id: 'GND', label: 'GND', kind: 'gnd' }, { id: 'OUT', label: 'OUT', kind: 'signal', output: true }]),
  },
  motorDriver: {
    name: 'L298N + 2 motor',
    help: 'IN1/IN2 sol motorun, IN3/IN4 sağ motorun yönünü belirler. ENA/ENB’ye PWM verirseniz hız ayarlanır; boş bırakırsanız jumper tam hız verir. GND, Arduino GND’sine bağlanmalı.',
    pins: moduleRow('motorDriver', [
      { id: 'ENA', label: 'ENA', kind: 'signal', optional: true },
      { id: 'IN1', label: 'IN1', kind: 'signal' },
      { id: 'IN2', label: 'IN2', kind: 'signal' },
      { id: 'IN3', label: 'IN3', kind: 'signal' },
      { id: 'IN4', label: 'IN4', kind: 'signal' },
      { id: 'ENB', label: 'ENB', kind: 'signal', optional: true },
      { id: 'GND', label: 'GND', kind: 'gnd' },
    ]),
  },
}

export function partLabel(part) {
  if (!part) return ''
  if (part.type === 'led') return `${LED_COLORS[part.props?.color] ?? ''} LED modülü`.trim()
  if (part.type === 'bareLed') return `${LED_COLORS[part.props?.color] ?? ''} LED`.trim()
  if (part.type === 'resistor') return `${RESISTOR_VALUES[part.props?.ohms] ?? ''} direnç`.trim()
  // The robot car's three line sensors.
  const side = { 'ir-left': 'sol', 'ir-center': 'orta', 'ir-right': 'sağ' }[part.id]
  if (part.type === 'irSensor' && side) return `KH-09 ${side} sensör`
  return PART_CATALOG[part.type]?.name ?? part.type
}

// ------------------------------------------------------------ breadboard --

export const BREADBOARD_SIZE = [16.5, 5.5]
export const BREADBOARD_HEIGHT = 0.85
const ROWS_TOP = ['a', 'b', 'c', 'd', 'e']
const ROWS_BOTTOM = ['f', 'g', 'h', 'i', 'j']

let holeCache = null
// Every hole with its position on the board and the strip it belongs to.
export function breadboardHoles() {
  if (holeCache) return holeCache
  const holes = []
  for (let col = 1; col <= 63; col += 1) {
    const x = (col - 32) * PITCH
    ROWS_TOP.forEach((row, i) => holes.push({ id: `${row}${col}`, x, z: -0.381 - (4 - i) * PITCH, strip: `${col}t`, col, row }))
    ROWS_BOTTOM.forEach((row, i) => holes.push({ id: `${row}${col}`, x, z: 0.381 + i * PITCH, strip: `${col}b`, col, row }))
    // Power rails: groups of five holes along both long edges.
    if (col >= 3 && col <= 61 && (col - 3) % 6 !== 5) {
      holes.push({ id: `T+${col}`, x, z: -2.413, strip: 'T+', col, rail: '+' })
      holes.push({ id: `T-${col}`, x, z: -2.159, strip: 'T-', col, rail: '−' })
      holes.push({ id: `B+${col}`, x, z: 2.159, strip: 'B+', col, rail: '+' })
      holes.push({ id: `B-${col}`, x, z: 2.413, strip: 'B-', col, rail: '−' })
    }
  }
  holeCache = { list: holes, byId: new Map(holes.map((hole) => [hole.id, hole])) }
  return holeCache
}

export function describeHole(holeId) {
  const hole = breadboardHoles().byId.get(holeId)
  if (!hole) return holeId
  if (hole.rail) return `${hole.id.startsWith('T') ? 'üst' : 'alt'} ${hole.rail} hattı (${hole.col})`
  return `${hole.id} (${hole.col}. sütun, ${hole.strip.endsWith('t') ? 'a–e' : 'f–j'})`
}

// ------------------------------------------------------------- geometry --

function rotate([x, z], degrees) {
  const r = (degrees * Math.PI) / 180
  // Same convention as three.js rotation.y.
  return [x * Math.cos(r) + z * Math.sin(r), -x * Math.sin(r) + z * Math.cos(r)]
}

export function pinWorldPositions(part) {
  const [px, pz] = part.position
  return PART_CATALOG[part.type].pins.map((pin) => {
    const [x, z] = rotate([pin.x, pin.z], part.rotation ?? 0)
    return { pin: pin.id, x: px + x, z: pz + z }
  })
}

function holeAt(board, x, z, tolerance) {
  const [dx, dz] = rotate([x - board.position[0], z - board.position[1]], -(board.rotation ?? 0))
  let best = null
  let bestDistance = tolerance
  for (const hole of breadboardHoles().list) {
    const d = Math.hypot(hole.x - dx, hole.z - dz)
    if (d < bestDistance) {
      best = hole
      bestDistance = d
    }
  }
  return best
}

export function holeWorldPosition(board, holeId) {
  const hole = breadboardHoles().byId.get(holeId)
  const [x, z] = rotate([hole.x, hole.z], board.rotation ?? 0)
  return [board.position[0] + x, board.position[1] + z]
}

// Which breadboard holes each part's pins sit in. A part counts as plugged in
// only if all its pins land in holes of the same board.
export function pluggedParts(circuit) {
  const boards = circuit.parts.filter((part) => part.type === 'breadboard')
  const result = new Map()
  if (!boards.length) return result
  for (const part of circuit.parts) {
    const definition = PART_CATALOG[part.type]
    if (!definition || part.type === 'breadboard' || definition.noPlug || !definition.pins.length) continue
    const positions = pinWorldPositions(part)
    for (const board of boards) {
      const holes = positions.map(({ x, z }) => holeAt(board, x, z, 0.06))
      if (holes.every(Boolean)) {
        result.set(part.id, { board: board.id, holes: Object.fromEntries(positions.map((p, i) => [p.pin, holes[i].id])) })
        break
      }
    }
  }
  return result
}

// Dropping a part close enough to a breadboard pushes its pins into the
// nearest holes, like pressing a component into the board.
export function snapToBreadboard(part, circuit) {
  const definition = PART_CATALOG[part.type]
  if (part.type === 'breadboard' || definition.noPlug || !definition.pins.length) return part.position
  const positions = pinWorldPositions(part)
  for (const board of circuit.parts.filter((p) => p.type === 'breadboard')) {
    const first = holeAt(board, positions[0].x, positions[0].z, 0.5)
    if (!first) continue
    const [hx, hz] = holeWorldPosition(board, first.id)
    const moved = { ...part, position: [part.position[0] + hx - positions[0].x, part.position[1] + hz - positions[0].z] }
    const all = pinWorldPositions(moved).every(({ x, z }) => holeAt(board, x, z, 0.06))
    if (all) return moved.position
  }
  return part.position
}

// A free spot on the first breadboard for a new part, or null. Columns next
// to parts already plugged in are kept clear so bodies do not overlap.
export function placeOnBreadboard(circuit, part) {
  const definition = PART_CATALOG[part.type]
  const board = circuit.parts.find((p) => p.type === 'breadboard')
  if (!board || definition.noPlug || !definition.pins.length) return null
  const byId = breadboardHoles().byId
  const busy = new Set()
  for (const [, { holes }] of pluggedParts(circuit)) {
    for (const id of Object.values(holes)) {
      const hole = byId.get(id)
      if (hole.rail) continue
      const half = hole.strip.slice(-1)
      for (let col = hole.col - 1; col <= hole.col + 1; col += 1) busy.add(`${col}${half}`)
    }
  }
  for (const z of [0, 0.381 + 2 * PITCH, -0.381 - 2 * PITCH]) {
    for (let col = 6; col <= 58; col += 1) {
      const [dx, dz] = rotate([(col - 32) * PITCH, z], board.rotation ?? 0)
      const candidate = { ...part, position: [board.position[0] + dx, board.position[1] + dz] }
      candidate.position = snapToBreadboard(candidate, circuit)
      const plugged = pluggedParts({ parts: [board, candidate] }).get(part.id)
      if (!plugged) continue
      const free = Object.values(plugged.holes).every((id) => {
        const hole = byId.get(id)
        return hole.rail || !busy.has(`${hole.col}${hole.strip.slice(-1)}`)
      })
      if (free) return candidate.position
    }
  }
  return null
}

// --------------------------------------------------------------- wiring --

export function normalizeWire(wire) {
  if (wire.from) return wire
  return { id: wire.id, color: wire.color, from: { part: wire.part, pin: wire.pin }, to: { uno: wire.uno, ...(wire.anchor ? { anchor: wire.anchor } : {}) } }
}

export function normalizeCircuit(circuit) {
  return { parts: circuit.parts, wires: circuit.wires.map(normalizeWire) }
}

export const endpointKey = (end) => (end.uno ? `U:${end.uno}` : `P:${end.part}:${end.pin}`)

// The Uno pin a part pin is wired straight to, if any (inspector drop-downs).
export function directUnoPin(circuit, partId, pinId) {
  for (const wire of circuit.wires.map(normalizeWire)) {
    if (wire.from.part === partId && wire.from.pin === pinId && wire.to.uno) return wire.to.uno
    if (wire.to.part === partId && wire.to.pin === pinId && wire.from.uno) return wire.from.uno
  }
  return null
}

const newWireId = () => `w${Date.now().toString(36)}${Math.floor(Math.random() * 1000)}`
const sameEnd = (a, b) => endpointKey(a) === endpointKey(b) && (a.anchor ?? a.uno) === (b.anchor ?? b.uno)

// Runs a jumper between any two points; a duplicate or a loop onto the same
// point is ignored.
export function connectEndpoints(circuit, a, b) {
  if (sameEnd(a, b)) return circuit
  const wires = circuit.wires.map(normalizeWire)
  if (wires.some((wire) => (sameEnd(wire.from, a) && sameEnd(wire.to, b)) || (sameEnd(wire.from, b) && sameEnd(wire.to, a)))) return circuit
  return { ...circuit, wires: [...wires, { id: newWireId(), from: a, to: b }] }
}

// The inspector drop-downs: replace the direct wire from a part pin to the
// Uno (or remove it when uno is null).
export function setDirectUnoPin(circuit, partId, pinId, uno) {
  const direct = (end, other) => end.part === partId && end.pin === pinId && other.uno
  const isDirect = (wire) => direct(wire.from, wire.to) || direct(wire.to, wire.from)
  const all = circuit.wires.map(normalizeWire)
  const at = all.findIndex(isDirect)
  const wires = all.filter((wire) => !isDirect(wire))
  // A changed wire keeps its place in the list.
  if (uno) wires.splice(at < 0 ? wires.length : at, 0, { id: at < 0 ? newWireId() : all[at].id, from: { part: partId, pin: pinId }, to: { uno } })
  return { ...circuit, wires }
}

// A free hole in a breadboard strip (a column half such as "21b", or a rail
// such as "T+") for a new jumper: in a column the outermost one, on a rail
// the one nearest the Uno. Null when the strip is full.
export function freeHole(circuit, boardId, strip) {
  const board = circuit.parts.find((part) => part.id === boardId)
  if (!board) return null
  const used = new Set([
    ...[...pluggedParts(circuit)].filter(([, info]) => info.board === boardId).flatMap(([, info]) => Object.values(info.holes)),
    ...circuit.wires.map(normalizeWire).flatMap((wire) => [wire.from, wire.to].filter((end) => end.part === boardId).map((end) => end.pin)),
  ])
  const free = breadboardHoles().list.filter((hole) => hole.strip === strip && !used.has(hole.id))
  if (!free.length) return null
  if (free[0].rail) return free.reduce((best, hole) => (Math.hypot(...holeWorldPosition(board, hole.id)) < Math.hypot(...holeWorldPosition(board, best.id)) ? hole : best)).id
  const outer = strip.endsWith('t') ? 'abcde' : 'jihgf'
  return free.sort((a, b) => outer.indexOf(a.row) - outer.indexOf(b.row))[0].id
}

// The Uno pin a breadboard strip is jumpered to directly, if any.
export function directStripUno(circuit, boardId, strip) {
  const byId = breadboardHoles().byId
  for (const wire of circuit.wires.map(normalizeWire)) {
    if (wire.from.part === boardId && byId.get(wire.from.pin)?.strip === strip && wire.to.uno) return wire.to.uno
    if (wire.to.part === boardId && byId.get(wire.to.pin)?.strip === strip && wire.from.uno) return wire.from.uno
  }
  return null
}

// The breadboard boxes: replace the jumper from a strip straight to the Uno
// (in place, from the same hole), add one from a free hole, or remove it.
export function setStripUno(circuit, boardId, strip, uno) {
  const byId = breadboardHoles().byId
  const inStrip = (end) => end.part === boardId && byId.get(end.pin)?.strip === strip
  const isDirect = (wire) => (inStrip(wire.from) && wire.to.uno) || (inStrip(wire.to) && wire.from.uno)
  const all = circuit.wires.map(normalizeWire)
  const at = all.findIndex(isDirect)
  const wires = all.filter((wire) => !isDirect(wire))
  if (uno) {
    const hole = at >= 0 ? (inStrip(all[at].from) ? all[at].from.pin : all[at].to.pin) : freeHole(circuit, boardId, strip)
    if (!hole) return circuit
    wires.splice(at < 0 ? wires.length : at, 0, { id: at < 0 ? newWireId() : all[at].id, from: { part: boardId, pin: hole }, to: { uno } })
  }
  return { ...circuit, wires }
}

export function removePart(circuit, partId) {
  return {
    parts: circuit.parts.filter((part) => part.id !== partId),
    wires: circuit.wires.map(normalizeWire).filter((wire) => wire.from.part !== partId && wire.to.part !== partId),
  }
}

// Moves a part. A part let go near a breadboard snaps into its holes; a
// breadboard carries the parts plugged into it.
export function movePart(circuit, partId, position) {
  const part = circuit.parts.find((p) => p.id === partId)
  if (!part) return circuit
  if (part.type === 'breadboard') {
    const [dx, dz] = [position[0] - part.position[0], position[1] - part.position[1]]
    const riders = new Set([...pluggedParts(circuit)].filter(([, info]) => info.board === partId).map(([id]) => id))
    return {
      ...circuit,
      parts: circuit.parts.map((p) => (p.id === partId ? { ...p, position } : riders.has(p.id) ? { ...p, position: [p.position[0] + dx, p.position[1] + dz] } : p)),
    }
  }
  const snapped = snapToBreadboard({ ...part, position }, circuit)
  return { ...circuit, parts: circuit.parts.map((p) => (p.id === partId ? { ...p, position: snapped } : p)) }
}

// Rotating a plugged-in part turns it about its first pin so it stays in
// the board when it can.
export function rotatePart(circuit, partId) {
  const part = circuit.parts.find((p) => p.id === partId)
  if (!part) return circuit
  const rotated = { ...part, rotation: ((part.rotation ?? 0) + 90) % 360 }
  if (part.type === 'breadboard') {
    // The plugged-in parts turn with the board.
    const riders = new Set([...pluggedParts(circuit)].filter(([, info]) => info.board === partId).map(([id]) => id))
    const [cx, cz] = part.position
    return {
      ...circuit,
      parts: circuit.parts.map((p) => {
        if (p.id === partId) return rotated
        if (!riders.has(p.id)) return p
        const [x, z] = rotate([p.position[0] - cx, p.position[1] - cz], 90)
        return { ...p, position: [cx + x, cz + z], rotation: ((p.rotation ?? 0) + 90) % 360 }
      }),
    }
  }
  if (pluggedParts(circuit).has(partId) && PART_CATALOG[part.type].pins.length) {
    const before = pinWorldPositions(part)[0]
    const after = pinWorldPositions(rotated)[0]
    rotated.position = [part.position[0] + before.x - after.x, part.position[1] + before.z - after.z]
    rotated.position = snapToBreadboard(rotated, circuit)
  }
  return { ...circuit, parts: circuit.parts.map((p) => (p.id === partId ? rotated : p)) }
}

class Nets {
  constructor() {
    this.parent = new Map()
  }

  find(key) {
    if (!this.parent.has(key)) this.parent.set(key, key)
    let root = key
    while (this.parent.get(root) !== root) root = this.parent.get(root)
    let node = key
    while (this.parent.get(node) !== root) {
      const next = this.parent.get(node)
      this.parent.set(node, root)
      node = next
    }
    return root
  }

  union(a, b) {
    const ra = this.find(a)
    const rb = this.find(b)
    if (ra !== rb) this.parent.set(ra, rb)
  }
}

// Joins everything that is electrically the same point: wires, breadboard
// strips, plugged-in pins and the always-connected legs of a tact button.
// Resistors and pressed buttons are left to the runtime solver.
export function buildNets(circuit) {
  const normalized = normalizeCircuit(circuit)
  const nets = new Nets()
  for (const pin of UNO_PINS) nets.find(`U:${pin}`)
  for (const wire of normalized.wires) nets.union(endpointKey(wire.from), endpointKey(wire.to))
  const plugged = pluggedParts(normalized)
  for (const [partId, { board, holes }] of plugged) {
    for (const [pin, hole] of Object.entries(holes)) nets.union(`P:${partId}:${pin}`, `P:${board}:${hole}`)
  }
  for (const part of normalized.parts) {
    if (part.type === 'breadboard') {
      for (const hole of breadboardHoles().list) nets.union(`P:${part.id}:${hole.id}`, `S:${part.id}:${hole.strip}`)
    }
    if (part.type === 'tactButton') {
      nets.union(`P:${part.id}:A1`, `P:${part.id}:A2`)
      nets.union(`P:${part.id}:B1`, `P:${part.id}:B2`)
    }
  }
  return { nets, plugged, circuit: normalized }
}

// What the Uno side of each net is: I/O pins, 5 V, GND.
function netSummary(nets) {
  const summary = new Map()
  const get = (root) => {
    if (!summary.has(root)) summary.set(root, { io: [], vcc: false, gnd: false, v33: false })
    return summary.get(root)
  }
  for (const pin of UNO_PINS) {
    const info = get(nets.find(`U:${pin}`))
    const number = unoPinNumber(pin)
    if (number !== null) info.io.push(number)
    else if (pin === '5V' || pin === 'VIN') info.vcc = true
    else if (pin === '3V3') info.v33 = true
    else if (pin === 'GND') info.gnd = true
  }
  return { get, summary }
}

export function describeNet(nets, key) {
  const parts = []
  const root = nets.find(key)
  for (const pin of UNO_PINS) if (nets.find(`U:${pin}`) === root) parts.push(pin)
  return parts
}

// "Kırmızı LED · +" or "Breadboard · a12 (12. sütun, a–e)" for a wire end.
export function describeEndpoint(circuit, end) {
  if (end.uno) return end.uno
  const part = circuit.parts.find((p) => p.id === end.part)
  if (!part) return end.pin
  if (part.type === 'breadboard') return `Breadboard · ${describeHole(end.pin)}`
  const pin = PART_CATALOG[part.type].pins.find((p) => p.id === end.pin)
  return `${partLabel(part)} · ${pin?.label ?? end.pin}`
}

// Turns the circuit into engine parts plus a small netlist for the bare
// components, and reports the mistakes a real circuit would suffer from.
export function resolveCircuit(input) {
  const { nets, circuit } = buildNets(input)
  const { get } = netSummary(nets)
  const issues = []
  const engineParts = []
  const pinNames = (n) => (n >= 14 ? `A${n - 14}` : `D${n}`)

  // A net tied to both 5 V and GND is a short circuit.
  const reported = new Set()
  for (const pin of ['5V', '3V3', 'VIN']) {
    const root = nets.find(`U:${pin}`)
    if (root === nets.find('U:GND') && !reported.has(root)) {
      reported.add(root)
      issues.push({ level: 'error', message: `Kısa devre: ${pin} doğrudan GND’ye bağlı. Gerçek kartta USB koruması devreye girer ve kart kapanır.` })
    }
  }

  const bare = { switches: [], resistors: [], leds: [], buttons: [] }
  const ioUsedByBare = new Set()

  for (const part of circuit.parts) {
    const definition = PART_CATALOG[part.type]
    if (!definition || part.type === 'breadboard') continue
    const name = partLabel(part)

    if (definition.bare) {
      const key = (pin) => nets.find(`P:${part.id}:${pin}`)
      if (part.type === 'resistor') bare.resistors.push({ a: key('A'), b: key('B'), ohms: Number(part.props?.ohms ?? 330) })
      if (part.type === 'tactButton') bare.switches.push({ part: part.id, a: key('A1'), b: key('B1') })
      if (part.type === 'bareLed') bare.leds.push({ part: part.id, anode: key('A'), cathode: key('K') })
      for (const pin of definition.pins) for (const n of get(key(pin.id)).io) ioUsedByBare.add(n)
      continue
    }

    const problems = []
    const io = {}
    const constant = {}
    for (const pin of definition.pins) {
      const info = get(nets.find(`P:${part.id}:${pin.id}`))
      const connected = info.io.length || info.vcc || info.gnd || info.v33
      if (!connected) {
        if (!pin.optional && pin.kind !== 'end') problems.push(`${pin.label} ucu bağlı değil.`)
        continue
      }
      if (pin.kind === 'vcc' && !info.vcc) problems.push(info.v33 ? `${pin.label} 3.3V’ta; bu parça 5V ister.` : `${pin.label} ucu 5V’a bağlanmalı.`)
      if (pin.kind === 'gnd' && !info.gnd) problems.push(`${pin.label} ucu GND’ye bağlanmalı.`)
      if (pin.kind === 'signal') {
        if (info.io.length) {
          io[pin.id] = info.io[0]
          const named = pinNames(info.io[0])
          if (info.io.length > 1) issues.push({ part: part.id, level: 'warning', message: `${name}: ${pin.label} ucu aynı anda ${info.io.map(pinNames).join(', ')} pinlerine bağlı.` })
          if (info.io[0] <= 1) issues.push({ part: part.id, level: 'warning', message: `${name}: ${named}, Serial için kullanılır; Serial Monitor ile birlikte sorun çıkarır.` })
          if (pin.analog && info.io[0] < 14) issues.push({ part: part.id, level: 'warning', message: `${name}: ${pin.label} ucu analog bir pine (A0–A5) bağlanmalı; ${named} yalnızca HIGH/LOW okur.` })
          if (info.vcc || info.gnd) issues.push({ part: part.id, level: 'warning', message: `${name}: ${pin.label} hattı hem ${named} pinine hem ${info.vcc ? '5V' : 'GND'}’ye bağlı.` })
        } else if (pin.output) {
          problems.push(`${pin.label} çıkışı doğrudan ${info.vcc ? '5V' : 'GND'}’ye bağlı.`)
        } else {
          constant[pin.id] = info.vcc ? 1 : 0
        }
      }
    }

    let extra = {}
    if (part.type === 'button') {
      const other = get(nets.find(`P:${part.id}:OTHER`))
      if ((other.io.length || other.v33) && !other.vcc && !other.gnd) problems.push('Butonun diğer ucu 5V’a ya da GND’ye bağlanmalı.')
      extra = { toward: other.gnd ? 'gnd' : 'vcc' }
    }
    if (part.type === 'potentiometer') {
      const a = get(nets.find(`P:${part.id}:VCC`))
      const b = get(nets.find(`P:${part.id}:GND`))
      if (!((a.vcc && b.gnd) || (a.gnd && b.vcc))) problems.push('Kenar uçlardan biri 5V’a, diğeri GND’ye bağlanmalı.')
      extra = { inverted: a.gnd }
    }
    if (problems.length) {
      issues.push({ part: part.id, level: 'error', message: `${name} çalışmıyor: ${problems.join(' ')}` })
      continue
    }

    const pins = {
      led: () => ({ pin: io.SIG, constant: constant.SIG }),
      rgbLed: () => ({ r: io.R, g: io.G, b: io.B }),
      button: () => ({ pin: io.SIG }),
      potentiometer: () => ({ pin: io.SIG }),
      ldr: () => ({ pin: io.AO }),
      buzzer: () => ({ pin: io.SIG, constant: constant.SIG }),
      servo: () => ({ pin: io.SIG }),
      ultrasonic: () => ({ trig: io.TRIG, echo: io.ECHO }),
      dht11: () => ({ pin: io.DATA }),
      sevenSegment: () => io,
      irSensor: () => ({ pin: io.OUT }),
      motorDriver: () => ({ ena: io.ENA, in1: io.IN1, in2: io.IN2, enb: io.ENB, in3: io.IN3, in4: io.IN4 }),
    }[part.type]()
    engineParts.push({ id: part.id, type: part.type, pins: { ...pins, ...extra } })
  }

  // Static checks on the bare components, following nets through resistors.
  const neighbours = (net) => bare.resistors.flatMap((r) => (r.a === net ? [r.b] : r.b === net ? [r.a] : []))
  const reaches = (net, test) => test(get(net)) || neighbours(net).some((other) => test(get(other)))
  const isSource = (info) => info.vcc || info.io.length > 0
  for (const led of bare.leds) {
    const part = circuit.parts.find((p) => p.id === led.part)
    const direct = (info) => info.io.length || info.vcc || info.gnd
    if (direct(get(led.anode)) && direct(get(led.cathode)) && !neighbours(led.anode).length && !neighbours(led.cathode).length) {
      issues.push({ part: led.part, level: 'warning', message: `${partLabel(part)}: Seri direnç yok. Gerçekte LED’den fazla akım geçer; LED ya da pin zarar görebilir (220–330 Ω kullanın).` })
    }
    if (reaches(led.anode, (info) => info.gnd) && reaches(led.cathode, isSource)) {
      issues.push({ part: led.part, level: 'warning', message: `${partLabel(part)} ters takılmış: uzun bacak (+) pine ya da 5V’a, kısa bacak (−) GND’ye gelmeli. Bu hâliyle yanmaz.` })
    }
  }
  for (const sw of bare.switches) {
    for (const net of [sw.a, sw.b]) {
      const info = get(net)
      if (info.io.length && !info.vcc && !info.gnd && !neighbours(net).length) {
        const pin = info.io.map(pinNames).join(', ')
        issues.push({ part: sw.part, level: 'warning', message: `${pin} butona bağlı ama pull-down/pull-up direnci yok: buton bırakılınca pin boşta kalır ve rastgele okur. 10 kΩ direnç ekleyin ya da kodda INPUT_PULLUP kullanın.` })
      }
    }
  }

  if (bare.switches.length || bare.resistors.length || bare.leds.length) {
    // Snapshot of which Uno pins each net touches, for the runtime solver.
    const netInfo = {}
    const roots = new Set([...bare.switches.flatMap((s) => [s.a, s.b]), ...bare.resistors.flatMap((r) => [r.a, r.b]), ...bare.leds.flatMap((l) => [l.anode, l.cathode])])
    for (const root of roots) netInfo[root] = get(root)
    // Pins already driven by a module (sensor outputs, module buttons) are left alone.
    const moduleDriven = [...new Set(engineParts.flatMap((p) => Object.values(p.pins).filter((v) => typeof v === 'number')))]
    engineParts.push({ id: '__nets', type: 'netSolver', pins: { ...bare, netInfo, moduleDriven } })
  }

  return { engineParts, issues }
}

// The robot car carries an L298N and three KH-09 sensors; the student wires
// them to the Uno. Returns the pins RobotCar needs, or the problems.
export function resolveCar(circuit) {
  const { engineParts, issues } = resolveCircuit(circuit)
  const find = (id) => engineParts.find((part) => part.id === id)
  const driver = find('driver')
  const pins = driver ? { ...driver.pins } : {}
  for (const side of ['left', 'center', 'right']) {
    const sensor = find(`ir-${side}`)
    if (sensor) pins[side] = sensor.pins.pin
  }
  return { pins, driverReady: Boolean(driver), issues }
}
