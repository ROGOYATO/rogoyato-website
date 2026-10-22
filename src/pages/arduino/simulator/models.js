// Procedural 3D models of the Uno and the kit's parts, built from three.js
// primitives at real-world scale (1 unit = 1 cm). Every model exposes its
// pins as clickable markers and an update(state) that animates it.
import * as THREE from 'three'
import { BREADBOARD_HEIGHT, BREADBOARD_SIZE, MODULE_SIZE, breadboardHoles } from '../../../utils/avrSim/catalog'

const materials = new Map()
export function mat(color, options = {}) {
  const key = `${color}|${JSON.stringify(options)}`
  if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05, ...options }))
  return materials.get(key)
}

export function box(w, h, d, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof material === 'string' ? mat(material) : material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

export function cylinder(radius, height, material, x = 0, y = 0, z = 0, segments = 24) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), typeof material === 'string' ? mat(material) : material)
  mesh.position.set(x, y, z)
  mesh.castShadow = true
  return mesh
}

const labelCache = new Map()
export function label(text, { size = 0.32, color = '#ffffff', background = null, weight = 600 } = {}) {
  const key = `${text}|${color}|${background}|${weight}`
  let texture = labelCache.get(key)
  const font = `${weight} 64px "JetBrains Mono", ui-monospace, monospace`
  const measure = document.createElement('canvas').getContext('2d')
  measure.font = font
  const width = Math.ceil(measure.measureText(text).width) + 24
  if (!texture) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = 88
    const ctx = canvas.getContext('2d')
    if (background) {
      ctx.fillStyle = background
      ctx.beginPath()
      ctx.roundRect(0, 0, canvas.width, canvas.height, 18)
      ctx.fill()
    }
    ctx.font = font
    ctx.fillStyle = color
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, canvas.width / 2, canvas.height / 2 + 2)
    texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    labelCache.set(key, texture)
  }
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, depthWrite: false }))
  sprite.scale.set((size * width) / 88, size, 1)
  return sprite
}

// Text printed flat on a board, running along the z axis like the pin names
// on real breakout modules.
const silkCache = new Map()
export function silk(text, height = 0.13, color = '#f8fafc') {
  const key = `${text}|${color}`
  let entry = silkCache.get(key)
  if (!entry) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    ctx.font = '700 56px "JetBrains Mono", ui-monospace, monospace'
    canvas.width = Math.ceil(ctx.measureText(text).width) + 8
    canvas.height = 64
    ctx.font = '700 56px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillStyle = color
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 4, 34)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 4
    entry = { texture, aspect: canvas.width / canvas.height }
    silkCache.set(key, entry)
  }
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(height * entry.aspect, height), new THREE.MeshBasicMaterial({ map: entry.texture, transparent: true, depthWrite: false }))
  mesh.rotation.set(-Math.PI / 2, 0, -Math.PI / 2)
  mesh.userData.length = height * entry.aspect
  return mesh
}

const PIN_COLORS = { gnd: '#1f2937', vcc: '#dc2626', signal: '#d4a72c', supply: '#d4a72c', end: '#d4a72c' }

// A header pin with a larger invisible sphere around its tip so it is easy
// to click, tagged with who owns it.
function pinMarker(group, info, position, kind = 'signal') {
  // Square 0.64 mm header pins, tinted by what they carry.
  const leg = box(0.064, 0.6, 0.064, mat(PIN_COLORS[kind] ?? '#d4a72c', { metalness: kind === 'gnd' ? 0.5 : 0.9, roughness: 0.3 }), position.x, position.y - 0.3, position.z)
  leg.castShadow = false
  leg.receiveShadow = false
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 8), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, depthWrite: false }))
  hit.position.copy(position)
  hit.userData = { kind: 'pin', ...info }
  group.add(leg, hit)
  return hit
}

// ---------------------------------------------------------------- Uno ----

const HEADER_PITCH = 0.254
export const UNO_SIZE = { width: 6.86, depth: 5.34 }

function unoPinLayout() {
  const pins = []
  const top = -2.42
  const bottom = 2.42
  for (let i = 0; i < 8; i += 1) pins.push({ id: `D${i}`, x: 3.0 - i * HEADER_PITCH, z: top })
  for (let i = 0; i < 6; i += 1) pins.push({ id: `D${8 + i}`, x: 0.81 - i * HEADER_PITCH, z: top })
  pins.push({ id: 'GND', anchor: 'GND@top', x: 0.81 - 6 * HEADER_PITCH, z: top })
  ;[['3V3', -1.02], ['5V', -0.76], ['GND', -0.51, 'GND@1'], ['GND', -0.25, 'GND@2'], ['VIN', 0]].forEach(([id, x, anchor]) => pins.push({ id, anchor, x, z: bottom }))
  for (let i = 0; i < 6; i += 1) pins.push({ id: `A${i}`, x: 0.6 + i * HEADER_PITCH, z: bottom })
  return pins
}

// A flat outline in the XZ plane extruded upwards from y = 0. The shape is
// drawn in (x, -z), so its caps get UVs in those coordinates.
function slab(shape, height, materials, bevel = 0) {
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: height - 2 * bevel,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 6,
  })
  geometry.rotateX(-Math.PI / 2)
  geometry.translate(0, bevel, 0)
  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function roundedRect(width, depth, radius) {
  const shape = new THREE.Shape()
  const x = -width / 2
  const y = -depth / 2
  shape.moveTo(x + radius, y)
  shape.lineTo(x + width - radius, y)
  shape.quadraticCurveTo(x + width, y, x + width, y + radius)
  shape.lineTo(x + width, y + depth - radius)
  shape.quadraticCurveTo(x + width, y + depth, x + width - radius, y + depth)
  shape.lineTo(x + radius, y + depth)
  shape.quadraticCurveTo(x, y + depth, x, y + depth - radius)
  shape.lineTo(x, y + radius)
  shape.quadraticCurveTo(x, y, x + radius, y)
  return shape
}

// A canvas texture laid on a slab's top so that the canvas covers
// width × depth around the origin.
function topTexture(canvas, width, depth, color = true) {
  const texture = new THREE.CanvasTexture(canvas)
  if (color) texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  texture.repeat.set(1 / width, 1 / depth)
  texture.offset.set(0.5, 0.5)
  return texture
}

const metal = (color = '#c7ccd1', roughness = 0.28) => mat(color, { metalness: 1, roughness })
const GOLD = () => metal('#d6b25e', 0.3)

// Text printed on a chip's top, as a texture for a box of that size.
const chipCache = new Map()
function chipTop(lines, width, depth, color = '#1c1c1f') {
  const key = `${lines.join('|')}|${width}|${depth}`
  if (!chipCache.has(key)) {
    const scale = 220
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(width * scale)
    canvas.height = Math.round(depth * scale)
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = 'rgba(226, 232, 240, 0.78)'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    const size = Math.min(canvas.height / (lines.length + 1.2), 42)
    ctx.font = `600 ${size}px "JetBrains Mono", ui-monospace, monospace`
    lines.forEach((line, index) => ctx.fillText(line, canvas.width / 2, canvas.height / 2 + (index - (lines.length - 1) / 2) * size * 1.25))
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    chipCache.set(key, new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 }))
  }
  const side = mat(color, { roughness: 0.55 })
  return [side, side, chipCache.get(key), side, side, side]
}

// The ATmega328P in its DIP-28 socket, lying along x.
function dip28(group, x, y, z) {
  const body = box(3.56, 0.32, 0.72, chipTop(['ATMEGA328P-PU', '1932   ●'], 3.56, 0.72), x, y + 0.36, z)
  const socket = box(3.75, 0.2, 0.98, mat('#1a1a1a', { roughness: 0.7 }), x, y + 0.1, z)
  const notch = cylinder(0.09, 0.02, '#0e0e10', x - 1.62, y + 0.52, z, 16)
  group.add(body, socket, notch)
  const leg = metal('#d4d8dc', 0.35)
  for (let i = 0; i < 14; i += 1) {
    const lx = x - 1.651 + i * HEADER_PITCH
    for (const side of [-1, 1]) {
      group.add(box(0.07, 0.03, 0.14, leg, lx, y + 0.31, z + side * 0.42))
      group.add(box(0.07, 0.16, 0.03, leg, lx, y + 0.23, z + side * 0.49))
    }
  }
}

// An electrolytic capacitor standing on the board.
function electrolytic(group, x, y, z, radius = 0.3, height = 0.62) {
  const can = cylinder(radius, height, mat('#1e2433', { roughness: 0.35 }), x, y + height / 2, z, 28)
  const stripe = cylinder(radius + 0.003, height * 0.94, mat('#9aa4b5', { roughness: 0.4 }), x, y + height / 2, z, 28)
  stripe.geometry = new THREE.CylinderGeometry(radius + 0.003, radius + 0.003, height * 0.94, 28, 1, true, -0.5, 1)
  const top = cylinder(radius * 0.92, 0.012, metal('#cfd4da', 0.35), x, y + height + 0.006, z, 28)
  group.add(can, stripe, top)
}

// A few tiny SMD resistors and capacitors.
function smd(group, list, top = 0.16) {
  for (const [x, z, rotated, kind] of list) {
    const [w, d] = rotated ? [0.06, 0.12] : [0.12, 0.06]
    group.add(box(w, 0.045, d, kind === 'c' ? '#b08d5a' : '#121214', x, top + 0.022, z))
    const cap = metal('#e2e5e8', 0.3)
    for (const s of [-1, 1]) group.add(box(rotated ? 0.062 : 0.025, 0.05, rotated ? 0.025 : 0.062, cap, x + (rotated ? 0 : s * 0.05), top + 0.023, z + (rotated ? s * 0.05 : 0)))
  }
}

function unoOutline(width, depth) {
  // The Uno's far end (away from USB) has its corners cut at 45°.
  const shape = new THREE.Shape()
  const x0 = -width / 2
  const x1 = width / 2
  const y0 = -depth / 2
  const y1 = depth / 2
  const r = 0.12
  const cut = 0.32
  shape.moveTo(x0 + r, y0)
  shape.lineTo(x1 - cut, y0)
  shape.lineTo(x1, y0 + cut)
  shape.lineTo(x1, y1 - cut)
  shape.lineTo(x1 - cut, y1)
  shape.lineTo(x0 + r, y1)
  shape.quadraticCurveTo(x0, y1, x0, y1 - r)
  shape.lineTo(x0, y0 + r)
  shape.quadraticCurveTo(x0, y0, x0 + r, y0)
  // Mounting holes (shape y is -z).
  for (const [hx, hz] of [[-1.9, 2.15], [-1.9, -2.15], [3.12, -1.2], [3.12, 1.62]]) {
    const hole = new THREE.Path()
    hole.absarc(hx, -hz, 0.16, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  return shape
}

export function buildUno() {
  const group = new THREE.Group()
  group.name = 'uno'
  const { width, depth } = UNO_SIZE
  const layout = unoPinLayout()
  // Silkscreen: pin names printed on the board next to the headers.
  const scale = 180
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(depth * scale)
  const px = (x) => (x + width / 2) * scale
  const pz = (z) => (z + depth / 2) * scale
  // The same drawing twice: in colour, and as a height map in which traces
  // and silkscreen ink stand a little proud of the board and vias sink in.
  const draw = (ctx, bump) => {
    const ink = bump ? '#b8b8b8' : '#eefcfd'
    ctx.fillStyle = bump ? '#808080' : '#00808a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = bump ? '#9c9c9c' : 'rgba(110, 214, 210, 0.3)'
    ctx.lineWidth = 5
    ctx.lineJoin = 'round'
    for (const pin of layout) {
      const sx = px(pin.x)
      const sz = pz(pin.z)
      const toward = pin.z < 0 ? 1 : -1
      const chip = px(1.55 - 1.651 + ((Math.abs(pin.x * 7) | 0) % 14) * HEADER_PITCH)
      const chipZ = pz(0.75 - toward * 0.42)
      const bend = sz + toward * (34 + ((pin.x * 40) % 30))
      const run = Math.min(Math.abs(chip - sx), Math.abs(chipZ - bend))
      ctx.beginPath()
      ctx.moveTo(sx, sz + toward * 22)
      ctx.lineTo(sx, bend)
      ctx.lineTo(sx + Math.sign(chip - sx) * run, bend + Math.sign(chipZ - bend) * run)
      ctx.lineTo(chip, chipZ)
      ctx.stroke()
    }
    for (let i = 0; i < 46; i += 1) {
      const vx = (((i * 97) % 61) / 61) * (width - 1.2) - width / 2 + 0.8
      const vz = (((i * 53) % 47) / 47) * (depth - 1.6) - depth / 2 + 0.8
      ctx.fillStyle = bump ? '#a0a0a0' : 'rgba(214, 226, 222, 0.75)'
      ctx.beginPath()
      ctx.arc(px(vx), pz(vz), 6, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = bump ? '#202020' : '#0b3b3e'
      ctx.beginPath()
      ctx.arc(px(vx), pz(vz), 2.5, 0, Math.PI * 2)
      ctx.fill()
    }
    // Header outlines and section names, as on the real board.
    ctx.strokeStyle = ink
    ctx.lineWidth = 4
    for (const [x0, x1, z] of [[0.81 - 9.5 * HEADER_PITCH, 3.0 + 0.5 * HEADER_PITCH, -2.42], [-1.27 - 0.5 * HEADER_PITCH, 0.6 + 5.5 * HEADER_PITCH, 2.42]]) {
      ctx.strokeRect(px(x0) - 6, pz(z) - 30, px(x1) - px(x0) + 12, 60)
    }
    ctx.fillStyle = ink
    ctx.textBaseline = 'middle'
    ctx.textAlign = 'center'
    ctx.font = '700 34px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('DIGITAL (PWM~)', px(1.4), pz(-1.42))
    ctx.fillText('POWER', px(-0.5), pz(1.45))
    ctx.fillText('ANALOG IN', px(1.25), pz(1.45))
    ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace'
    for (const pin of layout) {
      ctx.save()
      ctx.translate(px(pin.x), pz(pin.z) + (pin.z < 0 ? 40 : -40))
      ctx.rotate(-Math.PI / 2)
      ctx.textAlign = pin.z < 0 ? 'right' : 'left'
      ctx.fillText(pin.id, 0, 0)
      ctx.restore()
    }
    // The ∞ logo: two loops with − and + in them.
    const lx = px(-0.65)
    const lz = pz(-0.74)
    ctx.strokeStyle = ink
    ctx.lineWidth = 13
    for (const side of [-1, 1]) {
      ctx.beginPath()
      ctx.ellipse(lx + side * 44, lz, 42, 29, 0, 0, Math.PI * 2)
      ctx.stroke()
    }
    ctx.fillRect(lx - 58, lz - 4, 28, 8)
    ctx.fillRect(lx + 30, lz - 4, 28, 8)
    ctx.fillRect(lx + 40, lz - 14, 8, 28)
    ctx.font = '700 64px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
    ctx.fillText('ARDUINO', px(-0.65), pz(-0.1))
    ctx.font = '700 46px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
    ctx.fillText('UNO', px(-0.65), pz(0.53))
    ctx.font = '600 22px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('RESET', px(-2.6), pz(-1.68))
    ctx.fillText('ICSP', px(2.95), pz(-0.13))
  }
  draw(canvas.getContext('2d'), false)
  const heights = document.createElement('canvas')
  heights.width = canvas.width
  heights.height = canvas.height
  draw(heights.getContext('2d'), true)
  const side = mat('#0d5f63', { roughness: 0.6 })
  const top = new THREE.MeshPhysicalMaterial({
    map: topTexture(canvas, width, depth),
    bumpMap: topTexture(heights, width, depth, false),
    bumpScale: 1.4,
    roughness: 0.4,
    clearcoat: 0.6,
    clearcoatRoughness: 0.25,
  })
  const pcb = slab(unoOutline(width, depth), 0.16, [top, side])
  pcb.userData = { kind: 'uno' }
  group.add(pcb)

  // USB-B socket: a drawn-steel shell with the plastic tongue inside.
  const usbX = -width / 2 + 0.55
  group.add(box(1.6, 1.1, 1.2, metal('#cdd2d7', 0.22), usbX, 0.71, -1.15))
  group.add(box(0.02, 0.78, 0.84, mat('#0b0b0c', { roughness: 0.9 }), usbX - 0.805, 0.71, -1.15))
  group.add(box(0.03, 0.3, 0.42, mat('#f2f2ee', { roughness: 0.6 }), usbX - 0.815, 0.71, -1.15))
  for (const z of [-1.62, -0.68]) group.add(box(1.1, 0.04, 0.05, metal('#b9bfc5', 0.3), usbX + 0.15, 1.27, z))
  // DC barrel jack.
  const jackX = -width / 2 + 0.5
  group.add(box(1.4, 1.1, 0.9, mat('#151517', { roughness: 0.5 }), jackX, 0.71, 1.75))
  const mouth = cylinder(0.3, 0.04, mat('#050506', { roughness: 0.9 }), jackX - 0.71, 0.76, 1.75, 24)
  mouth.rotation.z = Math.PI / 2
  const pinCentre = cylinder(0.07, 0.06, metal(), jackX - 0.72, 0.76, 1.75, 12)
  pinCentre.rotation.z = Math.PI / 2
  group.add(mouth, pinCentre)

  dip28(group, 1.55, 0.16, 0.75)
  // ATmega16U2 (the USB chip), the 16 MHz crystal and the 5 V regulator.
  group.add(box(0.5, 0.09, 0.5, chipTop(['16U2'], 0.5, 0.5), -1.55, 0.205, -1.05))
  const crystal = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.6, 6, 16), metal('#d9dde1', 0.18))
  crystal.rotation.z = Math.PI / 2
  crystal.scale.set(1, 1, 0.62)
  crystal.position.set(-1.75, 0.33, 0.35)
  crystal.castShadow = true
  group.add(crystal, box(0.95, 0.03, 0.32, mat('#111214'), -1.75, 0.175, 0.35))
  group.add(box(0.65, 0.16, 0.35, mat('#18181b', { roughness: 0.5 }), -1.0, 0.24, 0.95), box(0.3, 0.02, 0.38, metal('#c9ced3'), -1.0, 0.17, 1.2))
  electrolytic(group, -1.9, 0.16, 1.55)
  electrolytic(group, -1.2, 0.16, 1.55)
  // Reset push button in the corner by the USB socket.
  group.add(box(0.6, 0.2, 0.6, metal('#c3c8cd', 0.3), -2.6, 0.26, -2.15), cylinder(0.17, 0.12, mat('#7f1d1d', { roughness: 0.45 }), -2.6, 0.42, -2.15))
  // ICSP header (2 × 3 pins).
  group.add(box(0.52, 0.25, 0.77, mat('#141416', { roughness: 0.6 }), 2.95, 0.285, -0.65))
  for (const dx of [-0.127, 0.127]) for (const dz of [-0.254, 0, 0.254]) group.add(box(0.064, 0.6, 0.064, GOLD(), 2.95 + dx, 0.6, -0.65 + dz))
  smd(group, [[0.9, -1.0, false, 'r'], [1.2, -1.0, false, 'r'], [1.5, -1.0, false, 'c'], [2.3, -0.55, false, 'c'], [2.3, -0.8, false, 'r'], [2.3, -0.3, false, 'c'], [2.4, 1.7, true, 'c'], [2.7, 1.7, true, 'r'], [-2.0, -0.2, false, 'c']])

  // Black female headers along both long edges, with a contact visible in
  // every hole.
  const housing = mat('#141416', { roughness: 0.62 })
  group.add(box(8 * HEADER_PITCH + 0.06, 0.85, 0.26, housing, 3.0 - 3.5 * HEADER_PITCH, 0.585, -2.42))
  group.add(box(10 * HEADER_PITCH + 0.06, 0.85, 0.26, housing, 0.81 - 4.5 * HEADER_PITCH, 0.585, -2.42))
  group.add(box(8 * HEADER_PITCH + 0.06, 0.85, 0.26, housing, -1.27 + 2.5 * HEADER_PITCH, 0.585, 2.42))
  group.add(box(6 * HEADER_PITCH + 0.06, 0.85, 0.26, housing, 0.6 + 2.5 * HEADER_PITCH, 0.585, 2.42))

  const markers = []
  const pit = mat('#030303', { roughness: 1 })
  const contact = GOLD()
  for (const pin of layout) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, depthWrite: false }))
    hit.position.set(pin.x, 1.06, pin.z)
    hit.userData = { kind: 'pin', owner: 'uno', pin: pin.id, anchor: pin.anchor ?? pin.id }
    group.add(box(0.13, 0.02, 0.13, pit, pin.x, 1.004, pin.z), box(0.05, 0.02, 0.03, contact, pin.x, 1.006, pin.z - 0.03), hit)
    markers.push(hit)
  }

  // On-board LEDs: L follows D13, ON is always lit, TX blinks with Serial.
  const ledL = box(0.18, 0.08, 0.1, mat('#f59e0b', { emissive: '#f59e0b', emissiveIntensity: 0 }), 0.3, 0.2, -1.6)
  ledL.material = ledL.material.clone()
  const ledOn = box(0.18, 0.08, 0.1, mat('#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.6 }), 2.6, 0.2, 0.2)
  const ledTx = box(0.18, 0.08, 0.1, mat('#f59e0b', { emissive: '#f59e0b', emissiveIntensity: 0 }), 0.3, 0.2, -1.25)
  ledTx.material = ledTx.material.clone()
  group.add(ledL, ledOn, ledTx)
  for (const [x, z] of [[0.3, -1.6], [2.6, 0.2], [0.3, -1.25]]) for (const s of [-1, 1]) group.add(box(0.03, 0.085, 0.1, metal('#e2e5e8', 0.3), x + s * 0.09, 0.2, z))
  ;[['L', 0.3, -1.85], ['TX', 0.3, -1.0], ['ON', 2.6, 0.2]].forEach(([text, x, z]) => {
    const sprite = label(text, { size: 0.16, color: '#e5f6f7' })
    sprite.position.set(x - 0.35, 0.2, z)
    group.add(sprite)
  })

  return {
    group,
    markers,
    update(state) {
      ledL.material.emissiveIntensity = (state?.pins?.[13] ?? 0) * 3
      ledTx.material.emissiveIntensity = state?.serialActive ? 2.5 : 0
    },
  }
}

// -------------------------------------------------------------- parts ----

// Solder mask: a satin colour under a thin glossy coat.
const pcbMaterials = new Map()
function pcbMaterial(color) {
  if (!pcbMaterials.has(color)) pcbMaterials.set(color, new THREE.MeshPhysicalMaterial({ color, roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 }))
  return pcbMaterials.get(color)
}

// A small breakout PCB with a row of 2.54 mm header pins along its back
// edge (positions come from the catalogue, so they fit breadboard holes).
function breakout(group, partId, pins, { type, color = '#1d4ed8' }) {
  const [width, depth] = MODULE_SIZE[type]
  const pcb = slab(roundedRect(width, depth, 0.08), 0.14, [pcbMaterial(color), mat(color, { roughness: 0.7 })])
  pcb.userData = { kind: 'part', partId }
  group.add(pcb)
  const markers = pins.map((pin) => {
    // The black plastic spacer that holds the header pins.
    group.add(box(0.254, 0.25, 0.25, mat('#121214', { roughness: 0.6 }), pin.x, 0.265, pin.z))
    const marker = pinMarker(group, { owner: 'part', partId, pin: pin.id }, new THREE.Vector3(pin.x, 0.75, pin.z), pin.kind)
    const text = silk(pin.label)
    text.position.set(pin.x, 0.145, pin.z + 0.16 + text.userData.length / 2)
    group.add(text)
    return marker
  })
  return { pcb, markers }
}

let glowTexture = null
// A soft round falloff so light halos are discs, not squares.
function glowMap() {
  if (glowTexture) return glowTexture
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 64
  const ctx = canvas.getContext('2d')
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.35, 'rgba(255,255,255,0.45)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 64, 64)
  glowTexture = new THREE.CanvasTexture(canvas)
  return glowTexture
}

const LED_HEX = { red: '#ef4444', yellow: '#facc15', green: '#22c55e', blue: '#3b82f6', white: '#f8fafc' }

// The clickable spot at the end of a bare component lead (resistor, LED,
// tact button): low enough to sit in a breadboard hole.
function leadMarker(group, info, x, z) {
  const hit = new THREE.Mesh(new THREE.SphereGeometry(0.13, 12, 8), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, depthWrite: false }))
  hit.position.set(x, 0.1, z)
  hit.userData = { kind: 'pin', ...info }
  group.add(hit)
  return hit
}

const leadMaterial = () => mat('#cbd5e1', { metalness: 0.75, roughness: 0.3 })

// A lead bent along a polyline, with rounded bends like real formed wire.
function bentLead(group, points, radius = 0.022, bend = 0.07) {
  const v = points.map((p) => new THREE.Vector3(...p))
  const path = new THREE.CurvePath()
  let from = v[0]
  for (let i = 1; i < v.length - 1; i += 1) {
    const corner = v[i]
    const r = Math.min(bend, corner.distanceTo(v[i - 1]) / 2, corner.distanceTo(v[i + 1]) / 2)
    const enter = corner.clone().add(v[i - 1].clone().sub(corner).setLength(r))
    const leave = corner.clone().add(v[i + 1].clone().sub(corner).setLength(r))
    if (from.distanceTo(enter) > 1e-4) path.add(new THREE.LineCurve3(from, enter))
    path.add(new THREE.QuadraticBezierCurve3(enter, corner, leave))
    from = leave
  }
  path.add(new THREE.LineCurve3(from, v[v.length - 1]))
  const mesh = new THREE.Mesh(new THREE.TubeGeometry(path, 12 * v.length, radius, 8), leadMaterial())
  mesh.castShadow = true
  group.add(mesh)
}

// A body turned around the y axis from (radius, y) points sampled evenly in
// y, so a texture's v runs evenly along it.
function turned(profile, samples, material) {
  const [y0, y1] = [profile(0)[1], profile(1)[1]]
  const points = []
  for (let i = 0; i <= samples; i += 1) {
    const [r, y] = profile(i / samples)
    points.push(new THREE.Vector2(Math.max(r, 0.0001), y ?? y0 + ((y1 - y0) * i) / samples))
  }
  const mesh = new THREE.Mesh(new THREE.LatheGeometry(points, 32), material)
  mesh.castShadow = true
  return mesh
}

const BAND_COLORS =['#111111', '#7c3f00', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#6b7280', '#f8fafc']
function resistorBands(ohms) {
  const digits = String(ohms)
  const multiplier = digits.length - 2
  return [BAND_COLORS[Number(digits[0])], BAND_COLORS[Number(digits[1])], BAND_COLORS[multiplier], '#c9a227']
}

// The resistor's body texture: beige lacquer and the colour code, laid
// along v (which runs from x = -half to x = +half).
const resistorMaterials = new Map()
function resistorMaterial(ohms, half) {
  if (!resistorMaterials.has(ohms)) {
    const canvas = document.createElement('canvas')
    canvas.width = 8
    canvas.height = 256
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#d8bf96'
    ctx.fillRect(0, 0, 8, 256)
    const row = (x) => (1 - (x + half) / (2 * half)) * 256
    resistorBands(ohms).forEach((color, index) => {
      const x = -0.2 + index * 0.11 + (index === 3 ? 0.06 : 0)
      ctx.fillStyle = color
      ctx.fillRect(0, row(x + 0.024), 8, row(x - 0.024) - row(x + 0.024))
    })
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    resistorMaterials.set(ohms, new THREE.MeshPhysicalMaterial({ map: texture, roughness: 0.55, clearcoat: 0.12, clearcoatRoughness: 0.5 }))
  }
  return resistorMaterials.get(ohms)
}

function breadboardTexture() {
  const [width, depth] = BREADBOARD_SIZE
  const scale = 110
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(depth * scale)
  const ctx = canvas.getContext('2d')
  const px = (x) => (x + width / 2) * scale
  const pz = (z) => (z + depth / 2) * scale
  ctx.fillStyle = '#f4f4ef'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#dcdcd4'
  ctx.fillRect(0, pz(-0.17), canvas.width, 0.34 * scale) // centre channel
  for (const [z, color] of [[-2.56, '#dc2626'], [-2.01, '#2563eb'], [2.01, '#dc2626'], [2.56, '#2563eb']]) {
    ctx.fillStyle = color
    ctx.fillRect(px(-7.6), pz(z) - 2, 15.2 * scale, 4)
  }
  // Square holes with the spring clip's dark throat and a lit lower edge.
  for (const hole of breadboardHoles().list) {
    const x = px(hole.x)
    const z = pz(hole.z)
    ctx.fillStyle = '#c9c9c0'
    ctx.fillRect(x - 8, z - 8, 16, 16)
    ctx.fillStyle = '#4a4a4f'
    ctx.fillRect(x - 6.5, z - 6.5, 13, 13)
    ctx.fillStyle = '#121214'
    ctx.fillRect(x - 6.5, z - 6.5, 11, 10)
    ctx.fillStyle = 'rgba(255,255,255,0.75)'
    ctx.fillRect(x - 7, z + 6.5, 14, 1.5)
  }
  ctx.fillStyle = '#71717a'
  ctx.font = '600 17px "JetBrains Mono", monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  for (let col = 1; col <= 63; col += 1) {
    if (col !== 1 && col % 5 !== 0) continue
    const x = px((col - 32) * 0.254)
    ctx.fillText(String(col), x, pz(-1.66))
    ctx.fillText(String(col), x, pz(1.66))
  }
  ;['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j'].forEach((row, i) => {
    const z = i < 5 ? -0.381 - (4 - i) * 0.254 : 0.381 + (i - 5) * 0.254
    ctx.fillText(row, px(-8.05), pz(z))
    ctx.fillText(row, px(8.05), pz(z))
  })
  ctx.font = '700 22px "JetBrains Mono", monospace'
  ctx.fillStyle = '#dc2626'
  ctx.fillText('+', px(-7.9), pz(-2.413))
  ctx.fillText('+', px(-7.9), pz(2.159))
  ctx.fillStyle = '#2563eb'
  ctx.fillText('−', px(-7.9), pz(-2.159))
  ctx.fillText('−', px(-7.9), pz(2.413))
  // Height map: the holes and the centre channel are sunk into the board.
  const heights = document.createElement('canvas')
  heights.width = canvas.width
  heights.height = canvas.height
  const hctx = heights.getContext('2d')
  hctx.fillStyle = '#c8c8c8'
  hctx.fillRect(0, 0, heights.width, heights.height)
  hctx.fillStyle = '#3a3a3a'
  hctx.fillRect(0, pz(-0.12), heights.width, 0.24 * scale)
  hctx.fillStyle = '#000000'
  for (const hole of breadboardHoles().list) hctx.fillRect(px(hole.x) - 6.5, pz(hole.z) - 6.5, 13, 13)
  return { map: topTexture(canvas, width, depth), bumpMap: topTexture(heights, width, depth, false) }
}

// A 5 mm LED's epoxy lens, from its flange (y = 0) to the top of the dome.
function lensGeometry(radius = 0.25, height = 0.86) {
  const points = [[0.0001, 0], [radius + 0.04, 0], [radius + 0.046, 0.03], [radius + 0.04, 0.06], [radius, 0.066], [radius, height - radius]]
  for (let i = 1; i <= 12; i += 1) {
    const angle = (i / 12) * (Math.PI / 2)
    points.push([Math.max(0.0001, radius * Math.cos(angle)), height - radius + radius * Math.sin(angle)])
  }
  return new THREE.LatheGeometry(
    points.map(([r, y]) => new THREE.Vector2(r, y)),
    40,
  )
}

function lensMaterial(color, diffused = false) {
  return new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0,
    transparent: true,
    opacity: diffused ? 0.94 : 0.8,
    roughness: diffused ? 0.5 : 0.08,
    clearcoat: 1,
    clearcoatRoughness: diffused ? 0.3 : 0.05,
  })
}

// An LED standing on its legs: lens, the lead frame inside, and the legs
// down to y = 0 (spread to `spread` at the bottom).
function ledOnLegs(group, material, { x = 0, y = 0.45, z = 0, spread = 0.127, frame = true } = {}) {
  const lens = new THREE.Mesh(lensGeometry(), material)
  lens.position.set(x, y, z)
  lens.castShadow = true
  group.add(lens)
  if (frame) {
    const metalFrame = mat('#6b7280', { metalness: 0.8, roughness: 0.35 })
    group.add(box(0.12, 0.16, 0.03, metalFrame, x + 0.07, y + 0.15, z), box(0.04, 0.13, 0.03, metalFrame, x - 0.08, y + 0.135, z))
  }
  for (const side of [-1, 1]) bentLead(group, [[x + side * 0.08, y + 0.02, z], [x + side * 0.08, y - 0.1, z], [x + side * spread, y - 0.22, z], [x + side * spread, -0.05, z]])
  return lens
}

function halo(color, size, x, y, z) {
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
  sprite.scale.set(size, size, 1)
  sprite.position.set(x, y, z)
  return sprite
}

// A small canvas texture drawn by `paint(ctx, w, h)`, cached by key.
const paintedCache = new Map()
function painted(key, width, height, paint, color = true) {
  if (!paintedCache.has(key)) {
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    paint(canvas.getContext('2d'), width, height)
    const texture = new THREE.CanvasTexture(canvas)
    if (color) texture.colorSpace = THREE.SRGBColorSpace
    texture.anisotropy = 8
    paintedCache.set(key, texture)
  }
  return paintedCache.get(key)
}

// The CdS track of a photoresistor: an orange serpentine on white ceramic.
function ldrFace() {
  return painted('ldr', 128, 128, (ctx) => {
    ctx.fillStyle = '#efe7d6'
    ctx.fillRect(0, 0, 128, 128)
    ctx.save()
    ctx.beginPath()
    ctx.arc(64, 64, 58, 0, Math.PI * 2)
    ctx.clip()
    ctx.fillStyle = '#c2622d'
    ctx.fillRect(0, 0, 128, 128)
    ctx.strokeStyle = '#efe7d6'
    ctx.lineWidth = 6
    ctx.beginPath()
    for (let i = 0; i < 9; i += 1) {
      const y = 16 + i * 12
      ctx.moveTo(i % 2 ? 22 : 0, y)
      ctx.lineTo(i % 2 ? 128 : 106, y)
    }
    ctx.stroke()
    ctx.restore()
    ctx.fillStyle = '#d9d0bd'
    ctx.fillRect(0, 0, 128, 10)
    ctx.fillRect(0, 118, 128, 10)
  })
}

// A metal ultrasonic transducer's front: fine mesh.
function meshFace(bump) {
  return painted(`mesh-${bump}`, 256, 256, (ctx) => {
    ctx.fillStyle = bump ? '#d0d0d0' : '#b8bec5'
    ctx.fillRect(0, 0, 256, 256)
    ctx.fillStyle = bump ? '#000000' : '#2c3036'
    for (let row = 0; row < 32; row += 1) {
      for (let col = 0; col < 32; col += 1) {
        ctx.beginPath()
        ctx.arc(col * 8 + (row % 2) * 4 + 2, row * 8 + 4, 2.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    // The rolled rim.
    ctx.strokeStyle = bump ? '#ffffff' : '#d7dce1'
    ctx.lineWidth = 22
    ctx.beginPath()
    ctx.arc(128, 128, 128, 0, Math.PI * 2)
    ctx.stroke()
  }, !bump)
}

// The DHT11's front grille: rows of rectangular slots in blue plastic.
function dhtFace(bump) {
  return painted(`dht-${bump}`, 160, 200, (ctx) => {
    ctx.fillStyle = bump ? '#c0c0c0' : '#3d9be0'
    ctx.fillRect(0, 0, 160, 200)
    ctx.fillStyle = bump ? '#000000' : '#0d2c45'
    for (let row = 0; row < 7; row += 1) {
      for (let col = 0; col < 4; col += 1) ctx.fillRect(14 + col * 36 + (row % 2) * 8, 14 + row * 26, 24, 14)
    }
  }, !bump)
}

function servoSticker() {
  return painted('servo', 256, 220, (ctx) => {
    ctx.fillStyle = '#1e5fd6'
    ctx.fillRect(0, 0, 256, 220)
    ctx.fillStyle = '#e8eefc'
    ctx.fillRect(18, 58, 220, 104)
    ctx.fillStyle = '#1b3a7a'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '800 50px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
    ctx.fillText('SG90', 128, 94)
    ctx.font = '600 24px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('MICRO SERVO 9g', 128, 138)
  })
}

function sonarSilk() {
  return painted('sonar', 540, 240, (ctx) => {
    ctx.fillStyle = '#1f4fbf'
    ctx.fillRect(0, 0, 540, 240)
    ctx.fillStyle = '#eef3ff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.font = '700 26px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('HC-SR04', 270, 150)
    ctx.font = '700 30px "JetBrains Mono", ui-monospace, monospace'
    ctx.fillText('T', 40, 30)
    ctx.fillText('R', 500, 30)
    ctx.font = '600 13px "JetBrains Mono", ui-monospace, monospace'
    ;['Vcc', 'Trig', 'Echo', 'Gnd'].forEach((text, index) => ctx.fillText(text, 270 + (index - 1.5) * 30.5, 214))
  })
}

let breadboardTop = null

const BUILDERS = {
  breadboard(part) {
    const group = new THREE.Group()
    const [width, depth] = BREADBOARD_SIZE
    breadboardTop ??= new THREE.MeshPhysicalMaterial({ ...breadboardTexture(), bumpScale: 2, roughness: 0.55, clearcoat: 0.2, clearcoatRoughness: 0.5 })
    const side = mat('#e9e9e2', { roughness: 0.62 })
    const bevel = 0.05
    const body = slab(roundedRect(width - 2 * bevel, depth - 2 * bevel, 0.12), BREADBOARD_HEIGHT, [breadboardTop, side], bevel)
    body.userData = { kind: 'board', partId: part.id }
    group.add(body)
    return { group, markers: [], update() {} }
  },

  resistor(part, definition) {
    const group = new THREE.Group()
    const [a, b] = definition.pins
    const y = 0.32
    // The dog-bone body of a carbon-film resistor, its colour bands painted
    // on so they follow the bulges.
    const half = 0.315
    const radius = (s) => (s > 0.235 ? 0.108 * Math.sqrt(Math.max(0, 1 - ((s - 0.235) / 0.08) ** 2)) : 0.088 + 0.02 * Math.exp(-(((s - 0.235) / 0.035) ** 2)))
    const body = turned((t) => [Math.max(radius(Math.abs(-half + 2 * half * t)), 0.02), -half + 2 * half * t], 64, resistorMaterial(part.props?.ohms ?? 330, half))
    body.rotation.z = -Math.PI / 2
    body.position.set(0, y, 0)
    group.add(body)
    for (const pin of [a, b]) {
      const end = Math.sign(pin.x) * (half - 0.01)
      bentLead(group, [[end, y, 0], [pin.x, y, 0], [pin.x, -0.05, 0]])
    }
    const markers = definition.pins.map((pin) => leadMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, pin.x, pin.z))
    return { group, markers, update() {} }
  },

  bareLed(part, definition) {
    const group = new THREE.Group()
    const color = LED_HEX[part.props?.color] ?? LED_HEX.red
    const material = lensMaterial(color)
    ledOnLegs(group, material, { y: 0.45, spread: Math.abs(definition.pins[0].x) })
    const glow = halo(color, 1.6, 0, 0.95, 0)
    group.add(glow)
    const markers = definition.pins.map((pin) => leadMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, pin.x, pin.z))
    return {
      group,
      markers,
      update(state) {
        const b = state?.brightness ?? 0
        material.emissiveIntensity = b * 2.6
        glow.material.opacity = b * 0.75
      },
    }
  },

  tactButton(part, definition) {
    const group = new THREE.Group()
    const base = box(0.62, 0.3, 0.62, mat('#1b1b1e', { roughness: 0.55 }), 0, 0.2, 0)
    base.userData = { kind: 'part', partId: part.id }
    group.add(base)
    // The steel cover plate with its four corner studs.
    group.add(box(0.6, 0.025, 0.6, metal('#c5cacf', 0.3), 0, 0.362, 0))
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) group.add(cylinder(0.035, 0.05, mat('#1b1b1e'), sx * 0.22, 0.38, sz * 0.22, 10))
    const cap = cylinder(0.17, 0.2, mat('#26262b', { roughness: 0.5 }), 0, 0.45, 0, 28)
    cap.userData = { kind: 'press', partId: part.id }
    group.add(cap)
    for (const pin of definition.pins) bentLead(group, [[pin.x, 0.12, Math.sign(pin.z) * 0.29], [pin.x, 0.12, pin.z], [pin.x, -0.05, pin.z]], 0.026, 0.05)
    const markers = definition.pins.map((pin) => leadMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, pin.x, pin.z))
    return {
      group,
      markers,
      update(state, inputs) {
        cap.position.y = state?.pressed || inputs?.pressed ? 0.39 : 0.45
      },
    }
  },

  led(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'led', color: '#18181b' })
    const color = LED_HEX[part.props?.color] ?? LED_HEX.red
    const material = lensMaterial(color)
    ledOnLegs(group, material, { y: 0.34, z: 0.25, spread: 0.127 })
    smd(group, [[0.42, -0.1, true, 'r']], 0.14)
    const glow = halo(color, 1.6, 0, 0.95, 0.25)
    group.add(glow)
    return {
      group,
      markers,
      update(state) {
        const b = state?.brightness ?? 0
        material.emissiveIntensity = b * 2.5
        glow.material.opacity = b * 0.75
      },
    }
  },

  rgbLed(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'rgbLed', color: '#18181b' })
    const material = lensMaterial('#eef2f7', true)
    material.emissive.set('#000000')
    material.emissiveIntensity = 1
    ledOnLegs(group, material, { y: 0.34, z: 0.25, spread: 0.19, frame: false })
    smd(group, [[-0.5, -0.05, true, 'r'], [0.5, -0.05, true, 'r'], [0.5, 0.45, true, 'r']], 0.14)
    const glow = halo('#ffffff', 1.8, 0, 0.95, 0.25)
    group.add(glow)
    return {
      group,
      markers,
      update(state) {
        const r = state?.red ?? 0
        const g = state?.green ?? 0
        const b = state?.blue ?? 0
        material.emissive.setRGB(r * 2, g * 2, b * 2)
        glow.material.color.setRGB(r, g, b)
        glow.material.opacity = Math.max(r, g, b) * 0.7
      },
    }
  },

  button(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'button', color: '#1f2937' })
    // A 12 mm tactile switch: black body, steel cover, round cap.
    group.add(box(0.9, 0.32, 0.9, mat('#1b1b1e', { roughness: 0.55 }), 0, 0.3, 0.25))
    group.add(box(0.88, 0.03, 0.88, metal('#c5cacf', 0.3), 0, 0.475, 0.25))
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) group.add(cylinder(0.045, 0.05, mat('#1b1b1e'), sx * 0.33, 0.5, 0.25 + sz * 0.33, 10))
    const cap = cylinder(0.3, 0.3, new THREE.MeshPhysicalMaterial({ color: '#e11d48', roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 }), 0, 0.64, 0.25, 32)
    cap.userData = { kind: 'press', partId: part.id }
    group.add(cap)
    smd(group, [[0.5, -0.3, true, 'r']], 0.14)
    return {
      group,
      markers,
      update(state) {
        cap.position.y = state?.pressed ? 0.56 : 0.64
      },
    }
  },

  potentiometer(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'potentiometer', color: '#0f766e' })
    // A rotary potentiometer: steel can, threaded bushing and nut, and a
    // knurled knob with a pointer line.
    group.add(cylinder(0.5, 0.32, metal('#9aa1a8', 0.42), 0, 0.3, 0.25, 40))
    group.add(cylinder(0.47, 0.02, metal('#b8bec4', 0.35), 0, 0.47, 0.25, 40))
    group.add(cylinder(0.3, 0.07, metal('#c9ccd0', 0.3), 0, 0.51, 0.25, 6))
    group.add(cylinder(0.19, 0.24, metal('#d3d6d9', 0.25), 0, 0.62, 0.25, 28))
    const knob = new THREE.Group()
    const plastic = new THREE.MeshPhysicalMaterial({ color: '#17171a', roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.4 })
    knob.add(cylinder(0.36, 0.42, plastic, 0, 0, 0, 40))
    for (let i = 0; i < 24; i += 1) {
      const angle = (i / 24) * Math.PI * 2
      const ridge = box(0.05, 0.36, 0.05, plastic, Math.cos(angle) * 0.36, -0.02, Math.sin(angle) * 0.36)
      ridge.rotation.y = -angle
      knob.add(ridge)
    }
    knob.add(cylinder(0.33, 0.03, plastic, 0, 0.22, 0, 40))
    knob.add(box(0.05, 0.012, 0.26, mat('#f8fafc', { roughness: 0.5 }), 0, 0.24, -0.15))
    knob.position.set(0, 0.95, 0.25)
    group.add(knob)
    return {
      group,
      markers,
      update(state, inputs) {
        const value = inputs?.value ?? 512
        knob.rotation.y = -((value / 1023) * 270 - 135) * (Math.PI / 180)
      },
    }
  },

  ldr(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'ldr' })
    // A 5 mm photoresistor: the CdS track under clear epoxy, on two legs.
    const side = mat('#e4dccb', { roughness: 0.5 })
    const face = new THREE.MeshPhysicalMaterial({ map: ldrFace(), roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 })
    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.1, 40), [side, face, side])
    disc.position.set(0, 0.6, 0.35)
    disc.castShadow = true
    group.add(disc)
    for (const x of [-0.12, 0.12]) bentLead(group, [[x, 0.55, 0.35], [x, 0.3, 0.35], [x * 1.06, 0.12, 0.35]])
    smd(group, [[0.45, -0.15, true, 'r']], 0.14)
    const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), color: '#fde68a', transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending, depthWrite: false }))
    sun.position.set(0, 1.4, 0.35)
    group.add(sun)
    return {
      group,
      markers,
      update(state, inputs) {
        const light = (inputs?.light ?? 50) / 100
        sun.material.opacity = 0.1 + light * 0.8
        sun.scale.setScalar(0.6 + light * 1.4)
      },
    }
  },

  buzzer(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'buzzer', color: '#18181b' })
    // A 12 mm active buzzer with a rounded top edge and the sound hole.
    const outline = [[0.0001, 0.14], [0.6, 0.14], [0.6, 0.86]]
    for (let i = 1; i <= 8; i += 1) {
      const angle = (i / 8) * (Math.PI / 2)
      outline.push([0.52 + 0.08 * Math.cos(angle), 0.86 + 0.08 * Math.sin(angle)])
    }
    outline.push([0.0001, 0.94])
    const body = new THREE.Mesh(
      new THREE.LatheGeometry(
        outline.map(([r, y]) => new THREE.Vector2(r, y)),
        48,
      ),
      new THREE.MeshPhysicalMaterial({ color: '#141416', roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.35 }),
    )
    body.position.set(0, 0, 0.25)
    body.castShadow = true
    group.add(body, cylinder(0.1, 0.012, mat('#030303', { roughness: 1 }), 0, 0.942, 0.25, 24))
    const plus = silk('+', 0.22)
    plus.position.set(0.32, 0.945, 0.25)
    group.add(plus)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 8, 48), new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0 }))
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 1.0, 0.25)
    group.add(ring)
    let phase = 0
    return {
      group,
      markers,
      update(state) {
        phase += 0.6
        ring.material.opacity = state?.on ? 0.35 + 0.35 * Math.sin(phase) : 0
        ring.scale.setScalar(state?.on ? 1 + 0.15 * Math.sin(phase) : 1)
      },
    }
  },

  servo(part, definition) {
    const group = new THREE.Group()
    const blue = new THREE.MeshPhysicalMaterial({ color: '#1e5fd6', roughness: 0.4, clearcoat: 0.35, clearcoatRoughness: 0.4 })
    const sticker = new THREE.MeshStandardMaterial({ map: servoSticker(), roughness: 0.55 })
    const body = box(2.3, 2.25, 1.22, [blue, blue, blue, blue, sticker, blue], 0, 1.15, 0.6)
    body.userData = { kind: 'part', partId: part.id }
    group.add(body)
    // Mounting ears with their screw holes.
    const ears = new THREE.Shape()
    ears.moveTo(-1.6, -0.61)
    ears.lineTo(1.6, -0.61)
    ears.lineTo(1.6, 0.61)
    ears.lineTo(-1.6, 0.61)
    ears.lineTo(-1.6, -0.61)
    for (const x of [-1.38, 1.38]) {
      const hole = new THREE.Path()
      hole.absarc(x, 0, 0.11, 0, Math.PI * 2, true)
      ears.holes.push(hole)
    }
    const earPlate = slab(ears, 0.22, [blue, blue])
    earPlate.position.set(0, 1.6, 0.6)
    group.add(earPlate)
    // The gear tower, the small bump beside it and the white output spline.
    group.add(cylinder(0.55, 0.45, blue, 0.55, 2.45, 0.6, 40), cylinder(0.3, 0.3, blue, -0.2, 2.38, 0.6, 32))
    group.add(cylinder(0.2, 0.12, mat('#f1f1ee', { roughness: 0.5 }), 0.55, 2.72, 0.6, 20))
    // A one-arm horn: a hub and a tapering arm with holes.
    const arm = new THREE.Shape()
    arm.absarc(0, 0, 0.3, Math.PI / 2, (Math.PI * 3) / 2, false)
    arm.lineTo(1.5, -0.1)
    arm.absarc(1.5, 0, 0.1, -Math.PI / 2, Math.PI / 2, false)
    arm.lineTo(0, 0.3)
    for (let i = 0; i < 5; i += 1) {
      const hole = new THREE.Path()
      hole.absarc(0.55 + i * 0.22, 0, 0.035, 0, Math.PI * 2, true)
      arm.holes.push(hole)
    }
    const white = mat('#f4f4f1', { roughness: 0.5 })
    const horn = new THREE.Group()
    const hornPlate = slab(arm, 0.12, [white, white])
    hornPlate.position.y = -0.06
    horn.add(hornPlate, cylinder(0.24, 0.16, white, 0, -0.08, 0, 24), cylinder(0.05, 0.02, metal(), 0, 0.07, 0, 12))
    horn.position.set(0.55, 2.84, 0.6)
    group.add(horn)
    // Brown, red and orange leads running to a female connector.
    const connector = box(0.8, 0.9, 0.3, mat('#141416', { roughness: 0.6 }), 0, 0.45, -1.3)
    connector.userData = { kind: 'part', partId: part.id }
    group.add(connector)
    ;[['#5b3a1f', -0.254], ['#c81e1e', 0], ['#f08a24', 0.254]].forEach(([color, x]) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x * 0.6, 0.35, 0.02), new THREE.Vector3(x * 0.8, 0.12, -0.35), new THREE.Vector3(x, 0.07, -0.85), new THREE.Vector3(x, 0.2, -1.1), new THREE.Vector3(x, 0.25, -1.16)])
      const wire = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.045, 8), mat(color, { roughness: 0.45 }))
      wire.castShadow = true
      group.add(wire)
    })
    const markers = definition.pins.map((pin) => {
      group.add(box(0.1, 0.02, 0.1, mat('#030303'), pin.x, 0.905, pin.z))
      return pinMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, new THREE.Vector3(pin.x, 0.92, pin.z), pin.kind)
    })
    return {
      group,
      markers,
      update(state) {
        horn.rotation.y = -(((state?.angle ?? 90) - 90) * Math.PI) / 180
      },
    }
  },

  ultrasonic(part, definition) {
    const group = new THREE.Group()
    const blue = pcbMaterial('#1f4fbf')
    const front = new THREE.MeshPhysicalMaterial({ map: sonarSilk(), roughness: 0.45, clearcoat: 0.6, clearcoatRoughness: 0.3 })
    const board = box(4.5, 2.0, 0.15, [blue, blue, blue, blue, front, blue], 0, 1.05, 0)
    board.userData = { kind: 'part', partId: part.id }
    group.add(board)
    const can = metal('#c3c8ce', 0.32)
    const mesh = new THREE.MeshStandardMaterial({ map: meshFace(false), bumpMap: meshFace(true), bumpScale: 2, metalness: 0.85, roughness: 0.4 })
    for (const x of [-1.3, 1.3]) {
      const transducer = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 48), [can, mesh, can])
      transducer.rotation.x = Math.PI / 2
      transducer.position.set(x, 1.1, 0.68)
      transducer.castShadow = true
      group.add(transducer)
    }
    // The 4 MHz crystal between them and the chips on the back.
    const crystal = new THREE.Mesh(new THREE.CapsuleGeometry(0.16, 0.5, 6, 16), metal('#d9dde1', 0.18))
    crystal.rotation.z = Math.PI / 2
    crystal.scale.set(1, 1, 0.55)
    crystal.position.set(0, 1.72, 0.17)
    group.add(crystal)
    for (const [x, y] of [[-1.1, 1.2], [0, 1.0], [1.1, 1.2]]) {
      group.add(box(0.5, 0.4, 0.1, mat('#1c1c1f', { roughness: 0.55 }), x, y, -0.125))
    }
    // Right-angle header along the bottom edge.
    group.add(box(1.02, 0.25, 0.25, mat('#121214', { roughness: 0.6 }), 0, 0.17, -0.3))
    const markers = definition.pins.map((pin) => pinMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, new THREE.Vector3(pin.x, 0.62, pin.z), pin.kind))
    // A short sound cone in front of the sensor and the distance it is
    // currently "seeing" (set with the slider in the inspector).
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }))
    beam.rotation.x = -Math.PI / 2
    beam.position.set(0, 1.1, 2.8)
    const distanceLabel = label('50 cm', { size: 0.5, color: '#0f172a', background: '#e0f2fe' })
    distanceLabel.position.set(0, 2.7, 0)
    group.add(beam, distanceLabel)
    let shown = null
    return {
      group,
      markers,
      update(state, inputs) {
        const distance = inputs?.distance ?? 50
        if (shown !== distance) {
          shown = distance
          const next = label(`${Math.round(distance)} cm`, { size: 0.45, color: '#0f172a', background: '#e0f2fe' })
          distanceLabel.material = next.material
          distanceLabel.scale.copy(next.scale)
        }
      },
    }
  },

  dht11(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'dht11' })
    const plastic = mat('#3d9be0', { roughness: 0.5 })
    const grille = new THREE.MeshStandardMaterial({ map: dhtFace(false), bumpMap: dhtFace(true), bumpScale: 3, roughness: 0.5 })
    group.add(box(1.25, 1.55, 0.55, [plastic, plastic, plastic, plastic, grille, plastic], 0, 0.92, 0.3))
    smd(group, [[0.55, -0.3, true, 'r']], 0.14)
    group.add(box(0.1, 0.05, 0.16, mat('#ef4444', { emissive: '#ef4444', emissiveIntensity: 1.2 }), -0.55, 0.165, -0.3))
    return { group, markers, update() {} }
  },

  sevenSegment(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'sevenSegment', color: '#18181b' })
    group.add(box(1.4, 0.5, 1.9, mat('#1a1a1d', { roughness: 0.5 }), 0, 0.39, 0.3))
    group.add(box(1.32, 0.005, 1.82, mat('#26262a', { roughness: 0.2 }), 0, 0.643, 0.3))
    // Unlit segments show as pale diffusers; lit ones glow red. They lean
    // slightly, like the real italic digits.
    const off = '#55555b'
    const segments = {}
    const makeSegment = (name, w, d, x, z) => {
      const material = new THREE.MeshStandardMaterial({ color: off, emissive: '#ef4444', emissiveIntensity: 0, roughness: 0.4 })
      const segment = box(w, 0.03, d, material, x - z * 0.12, 0.66, z + 0.3)
      if (d > w) segment.rotation.y = 0.12
      segments[name] = segment
      group.add(segment)
    }
    makeSegment('a', 0.6, 0.1, 0, -0.68)
    makeSegment('b', 0.1, 0.6, 0.36, -0.35)
    makeSegment('c', 0.1, 0.6, 0.36, 0.35)
    makeSegment('d', 0.6, 0.1, 0, 0.68)
    makeSegment('e', 0.1, 0.6, -0.36, 0.35)
    makeSegment('f', 0.1, 0.6, -0.36, -0.35)
    makeSegment('g', 0.6, 0.1, 0, 0)
    const dp = new THREE.MeshStandardMaterial({ color: off, emissive: '#ef4444', emissiveIntensity: 0, roughness: 0.4 })
    segments.dp = cylinder(0.065, 0.03, dp, 0.5, 0.66, 1.02, 16)
    group.add(segments.dp)
    const names = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp']
    return {
      group,
      markers,
      update(state) {
        names.forEach((name, index) => {
          const on = state?.segments?.[index] ?? 0
          segments[name].material.emissiveIntensity = on * 3
          segments[name].material.color.set(on > 0.05 ? '#ef4444' : off)
        })
      },
    }
  },

  irSensor(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'irSensor' })
    // The IR emitter (clear) and receiver (dark) at the front.
    ledOnLegs(group, lensMaterial('#e0f2fe'), { x: -0.3, y: 0.25, z: 1.2, spread: 0.1 })
    ledOnLegs(group, new THREE.MeshPhysicalMaterial({ color: '#141418', roughness: 0.1, clearcoat: 1, clearcoatRoughness: 0.05 }), { x: 0.3, y: 0.25, z: 1.2, spread: 0.1, frame: false })
    // The sensitivity trimmer: a blue box with a brass screw.
    group.add(box(0.45, 0.35, 0.45, mat('#2563eb', { roughness: 0.45 }), 0, 0.32, 0.2))
    const screw = cylinder(0.08, 0.06, metal('#d9b45a', 0.3), 0.12, 0.52, 0.32, 16)
    group.add(screw, box(0.12, 0.02, 0.02, mat('#6b5523'), 0.12, 0.555, 0.32))
    group.add(box(0.5, 0.12, 0.4, chipTop(['LM393'], 0.5, 0.4), -0.2, 0.2, -0.6))
    smd(group, [[0.4, -0.75, true, 'r'], [0.4, -0.15, true, 'r']], 0.14)
    const led = box(0.16, 0.08, 0.1, new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0 }), 0.45, 0.19, -0.4)
    group.add(led)
    return {
      group,
      markers,
      update(state, inputs) {
        // The module's own LED lights when it sees reflected IR (white floor).
        led.material.emissiveIntensity = inputs?.black ? 0 : 2.2
      },
    }
  },

  motorDriver(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'motorDriver', color: '#b91c1c' })
    // The L298N under its finned black heat sink.
    const sink = mat('#16161a', { metalness: 0.6, roughness: 0.45 })
    group.add(box(2.4, 1.6, 0.4, sink, 0, 0.94, 0.3))
    for (let i = 0; i < 7; i += 1) group.add(box(0.06, 0.4, 0.9, sink, -1.1 + i * 0.36, 1.9, 0.3))
    // Screw terminals for the motors.
    for (const x of [-1.6, 1.6]) {
      group.add(box(0.75, 0.75, 0.75, mat('#1d4ed8', { roughness: 0.45 }), x, 0.52, 1.6))
      for (const dx of [-0.18, 0.18]) {
        group.add(cylinder(0.12, 0.04, metal('#cfd4da', 0.3), x + dx, 0.91, 1.6, 20), box(0.18, 0.02, 0.03, mat('#5b6168'), x + dx, 0.935, 1.6))
      }
    }
    electrolytic(group, 1.4, 0.14, -0.9, 0.3, 0.8)
    smd(group, [[-1.2, -1.0, false, 'r'], [-0.8, -1.0, false, 'r']], 0.14)
    const wheels = []
    const yellow = new THREE.MeshPhysicalMaterial({ color: '#f5c518', roughness: 0.45, clearcoat: 0.3 })
    const rubber = mat('#151517', { roughness: 0.85 })
    for (const side of [-1, 1]) {
      const motor = box(2.2, 1.9, 2.2, yellow, side * 4.2, 0.95, 0.6)
      group.add(motor)
      // The motor can sticking out of the gearbox.
      const can = cylinder(0.55, 0.9, metal('#c7ccd1', 0.35), side * 4.2, 0.95, -0.95, 28)
      can.rotation.x = Math.PI / 2
      group.add(can)
      const wheel = new THREE.Group()
      const tyre = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.4, 18, 48), rubber)
      tyre.rotation.y = Math.PI / 2
      tyre.castShadow = true
      for (let i = 0; i < 24; i += 1) {
        const angle = (i / 24) * Math.PI * 2
        const tread = box(0.7, 0.12, 0.16, rubber, 0, Math.cos(angle) * 1.62, Math.sin(angle) * 1.62)
        tread.rotation.x = angle
        wheel.add(tread)
      }
      const hub = cylinder(0.95, 0.6, yellow, 0, 0, 0, 6)
      hub.rotation.z = Math.PI / 2
      const cap = cylinder(0.25, 0.64, mat('#f8fafc'), 0, 0, 0, 16)
      cap.rotation.z = Math.PI / 2
      wheel.add(tyre, hub, cap)
      wheel.position.set(side * 5.75, 1.65, 0.6)
      group.add(wheel)
      wheels.push(wheel)
    }
    return {
      group,
      markers,
      update(state, inputs, dt = 1 / 60) {
        const speeds = [state?.left ?? 0, state?.right ?? 0]
        wheels.forEach((wheel, index) => {
          wheel.rotation.x += speeds[index] * 18 * dt
        })
      },
    }
  },
}

export function buildPart(part, definition) {
  const model = BUILDERS[part.type](part, definition)
  model.group.userData = { kind: 'part', partId: part.id }
  model.group.traverse((child) => {
    if (child.isMesh && !child.userData.kind) child.userData = { kind: 'part', partId: part.id }
  })
  return model
}
