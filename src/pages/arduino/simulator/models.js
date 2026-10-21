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
  const leg = cylinder(0.032, 0.6, new THREE.MeshStandardMaterial({ color: PIN_COLORS[kind] ?? '#d4a72c', metalness: 0.6, roughness: 0.35 }), position.x, position.y - 0.3, position.z, 8)
  leg.castShadow = false
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

export function buildUno() {
  const group = new THREE.Group()
  group.name = 'uno'
  const { width, depth } = UNO_SIZE
  const layout = unoPinLayout()
  const pcb = box(width, 0.16, depth, mat('#0b7a80', { roughness: 0.45 }), 0, 0.08, 0)
  // Silkscreen: pin names printed on the board next to the headers.
  const scale = 180
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(width * scale)
  canvas.height = Math.round(depth * scale)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#0b7a80'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = '#e6fbfc'
  ctx.textBaseline = 'middle'
  ctx.font = '600 30px "JetBrains Mono", ui-monospace, monospace'
  for (const pin of layout) {
    const px = (pin.x + width / 2) * scale
    const pz = (pin.z + depth / 2) * scale
    ctx.save()
    ctx.translate(px, pz + (pin.z < 0 ? 40 : -40))
    ctx.rotate(-Math.PI / 2)
    ctx.textAlign = pin.z < 0 ? 'right' : 'left'
    ctx.fillText(pin.id, 0, 0)
    ctx.restore()
  }
  ctx.font = '700 64px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ARDUINO', canvas.width * 0.45, canvas.height * 0.48)
  ctx.font = '700 46px "Space Grotesk", "Plus Jakarta Sans", sans-serif'
  ctx.fillText('UNO', canvas.width * 0.45, canvas.height * 0.6)
  const silkscreen = new THREE.CanvasTexture(canvas)
  silkscreen.colorSpace = THREE.SRGBColorSpace
  silkscreen.anisotropy = 8
  const side = mat('#0b7a80', { roughness: 0.45 })
  pcb.material = [side, side, new THREE.MeshStandardMaterial({ map: silkscreen, roughness: 0.45 }), side, side, side]
  pcb.userData = { kind: 'uno' }
  group.add(pcb)
  group.add(box(1.6, 1.1, 1.2, mat('#c0c6cc', { metalness: 0.8, roughness: 0.3 }), -width / 2 + 0.55, 0.71, -1.15)) // USB-B
  group.add(box(1.4, 1.1, 0.9, '#111827', -width / 2 + 0.5, 0.71, 1.75)) // DC jack
  group.add(box(3.5, 0.35, 0.95, '#111827', 1.55, 0.34, 0.75)) // ATmega328P
  group.add(box(0.5, 0.3, 0.5, '#9ca3af', -1.4, 0.31, -0.2)) // crystal can

  // Black female headers along both long edges.
  group.add(box(8 * HEADER_PITCH + 0.06, 0.85, 0.26, '#111827', 3.0 - 3.5 * HEADER_PITCH, 0.585, -2.42))
  group.add(box(10 * HEADER_PITCH + 0.06, 0.85, 0.26, '#111827', 0.81 - 4.5 * HEADER_PITCH, 0.585, -2.42))
  group.add(box(8 * HEADER_PITCH + 0.06, 0.85, 0.26, '#111827', -1.27 + 2.5 * HEADER_PITCH, 0.585, 2.42))
  group.add(box(6 * HEADER_PITCH + 0.06, 0.85, 0.26, '#111827', 0.6 + 2.5 * HEADER_PITCH, 0.585, 2.42))

  const markers = []
  for (const pin of layout) {
    const hit = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 8), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0, depthWrite: false }))
    hit.position.set(pin.x, 1.06, pin.z)
    hit.userData = { kind: 'pin', owner: 'uno', pin: pin.id, anchor: pin.anchor ?? pin.id }
    const hole = box(0.11, 0.02, 0.11, '#000000', pin.x, 1.015, pin.z)
    group.add(hole, hit)
    markers.push(hit)
  }

  // On-board LEDs: L follows D13, ON is always lit, TX blinks with Serial.
  const ledL = box(0.18, 0.08, 0.1, mat('#f59e0b', { emissive: '#f59e0b', emissiveIntensity: 0 }), 0.3, 0.2, -1.6)
  ledL.material = ledL.material.clone()
  const ledOn = box(0.18, 0.08, 0.1, mat('#22c55e', { emissive: '#22c55e', emissiveIntensity: 1.6 }), 2.6, 0.2, 0.2)
  const ledTx = box(0.18, 0.08, 0.1, mat('#f59e0b', { emissive: '#f59e0b', emissiveIntensity: 0 }), 0.3, 0.2, -1.25)
  ledTx.material = ledTx.material.clone()
  group.add(ledL, ledOn, ledTx)
  ;[['L', 0.3, -1.85], ['TX', 0.3, -1.0], ['ON', 2.6, 0.45]].forEach(([text, x, z]) => {
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

// A small breakout PCB with a row of 2.54 mm header pins along its back
// edge (positions come from the catalogue, so they fit breadboard holes).
function breakout(group, partId, pins, { type, color = '#1d4ed8' }) {
  const [width, depth] = MODULE_SIZE[type]
  const pcb = box(width, 0.14, depth, mat(color, { roughness: 0.5 }), 0, 0.07, 0)
  pcb.userData = { kind: 'part', partId }
  group.add(pcb)
  const markers = pins.map((pin) => {
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

function glowMaterial(color) {
  return new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0, transparent: true, opacity: 0.88, roughness: 0.2 })
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

// A wire-like lead between two points.
function lead(group, from, to, radius = 0.022) {
  const a = new THREE.Vector3(...from)
  const b = new THREE.Vector3(...to)
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, a.distanceTo(b), 8), leadMaterial())
  mesh.position.copy(a).lerp(b, 0.5)
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
  group.add(mesh)
}

const BAND_COLORS = ['#111111', '#7c3f00', '#dc2626', '#f97316', '#facc15', '#16a34a', '#2563eb', '#7c3aed', '#6b7280', '#f8fafc']
function resistorBands(ohms) {
  const digits = String(ohms)
  const multiplier = digits.length - 2
  return [BAND_COLORS[Number(digits[0])], BAND_COLORS[Number(digits[1])], BAND_COLORS[multiplier], '#c9a227']
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
  ctx.fillStyle = '#3f3f46'
  for (const hole of breadboardHoles().list) ctx.fillRect(px(hole.x) - 6, pz(hole.z) - 6, 12, 12)
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
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

let breadboardTop = null

const BUILDERS = {
  breadboard(part) {
    const group = new THREE.Group()
    const [width, depth] = BREADBOARD_SIZE
    breadboardTop ??= new THREE.MeshStandardMaterial({ map: breadboardTexture(), roughness: 0.7 })
    const side = mat('#ececE6', { roughness: 0.7 })
    const body = box(width, BREADBOARD_HEIGHT, depth, side, 0, BREADBOARD_HEIGHT / 2, 0)
    body.material = [side, side, breadboardTop, side, side, side]
    body.userData = { kind: 'board', partId: part.id }
    group.add(body)
    return { group, markers: [], update() {} }
  },

  resistor(part, definition) {
    const group = new THREE.Group()
    const [a, b] = definition.pins
    const y = 0.32
    const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.095, 0.42, 6, 16), mat('#d9c09a', { roughness: 0.5 }))
    body.rotation.z = Math.PI / 2
    body.position.set(0, y, 0)
    group.add(body)
    resistorBands(part.props?.ohms ?? 330).forEach((color, index) => {
      const band = cylinder(0.102, 0.045, color, -0.2 + index * 0.11 + (index === 3 ? 0.06 : 0), y, 0, 16)
      band.rotation.z = Math.PI / 2
      group.add(band)
    })
    for (const pin of [a, b]) {
      const end = Math.sign(pin.x) * 0.3
      lead(group, [end, y, 0], [pin.x, y, 0])
      lead(group, [pin.x, y, 0], [pin.x, 0.02, 0])
    }
    const markers = definition.pins.map((pin) => leadMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, pin.x, pin.z))
    return { group, markers, update() {} }
  },

  bareLed(part, definition) {
    const group = new THREE.Group()
    const color = LED_HEX[part.props?.color] ?? LED_HEX.red
    const material = glowMaterial(color)
    const body = cylinder(0.25, 0.34, material, 0, 0.72, 0)
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.25, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), material)
    dome.position.set(0, 0.89, 0)
    const rim = cylinder(0.29, 0.06, material, 0, 0.56, 0)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    halo.scale.set(1.6, 1.6, 1)
    halo.position.set(0, 0.85, 0)
    group.add(body, dome, rim, halo)
    for (const pin of definition.pins) {
      // The anode (+) lead is the longer one, so it is bent a little.
      if (pin.id === 'A') {
        lead(group, [pin.x * 0.7, 0.55, 0], [pin.x, 0.3, 0])
        lead(group, [pin.x, 0.3, 0], [pin.x, 0.02, 0])
      } else {
        lead(group, [pin.x * 0.7, 0.55, 0], [pin.x, 0.02, 0])
      }
    }
    const markers = definition.pins.map((pin) => leadMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, pin.x, pin.z))
    return {
      group,
      markers,
      update(state) {
        const b = state?.brightness ?? 0
        material.emissiveIntensity = b * 2.6
        halo.material.opacity = b * 0.75
      },
    }
  },

  tactButton(part, definition) {
    const group = new THREE.Group()
    const base = box(0.62, 0.34, 0.62, '#1f2937', 0, 0.2, 0)
    base.userData = { kind: 'part', partId: part.id }
    group.add(base)
    const cap = cylinder(0.17, 0.2, '#111827', 0, 0.45, 0)
    cap.userData = { kind: 'press', partId: part.id }
    group.add(cap)
    for (const pin of definition.pins) lead(group, [pin.x, 0.08, Math.sign(pin.z) * 0.29], [pin.x, 0.02, pin.z])
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
    const { markers } = breakout(group, part.id, definition.pins, { type: 'led', color: '#111827' })
    const color = LED_HEX[part.props?.color] ?? LED_HEX.red
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), glowMaterial(color))
    const body = cylinder(0.26, 0.4, glowMaterial(color), 0, 0.34, 0.2)
    dome.position.set(0, 0.54, 0.2)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), color, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    halo.scale.set(1.6, 1.6, 1)
    halo.position.set(0, 0.6, 0.2)
    group.add(dome, body, halo)
    return {
      group,
      markers,
      update(state) {
        const b = state?.brightness ?? 0
        dome.material.emissiveIntensity = b * 2.5
        body.material.emissiveIntensity = b * 2.5
        halo.material.opacity = b * 0.75
      },
    }
  },

  rgbLed(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'rgbLed', color: '#111827' })
    const material = new THREE.MeshStandardMaterial({ color: '#f1f5f9', emissive: '#000000', transparent: true, opacity: 0.92, roughness: 0.3 })
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.3, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2), material)
    dome.position.set(0, 0.6, 0.2)
    const body = cylinder(0.3, 0.45, material, 0, 0.37, 0.2)
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowMap(), color: '#ffffff', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false }))
    halo.scale.set(1.8, 1.8, 1)
    halo.position.set(0, 0.65, 0.2)
    group.add(dome, body, halo)
    return {
      group,
      markers,
      update(state) {
        const r = state?.red ?? 0
        const g = state?.green ?? 0
        const b = state?.blue ?? 0
        material.emissive.setRGB(r * 2, g * 2, b * 2)
        halo.material.color.setRGB(r, g, b)
        halo.material.opacity = Math.max(r, g, b) * 0.7
      },
    }
  },

  button(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'button', color: '#334155' })
    group.add(box(0.62, 0.32, 0.62, '#111827', 0, 0.3, 0.2))
    const cap = cylinder(0.2, 0.28, '#e11d48', 0, 0.58, 0.2)
    cap.userData = { kind: 'press', partId: part.id }
    group.add(cap)
    return {
      group,
      markers,
      update(state) {
        cap.position.y = state?.pressed ? 0.5 : 0.58
      },
    }
  },

  potentiometer(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'potentiometer', color: '#0f766e' })
    group.add(box(1.0, 0.55, 1.0, '#1e3a8a', 0, 0.42, 0.25))
    const knob = new THREE.Group()
    knob.add(cylinder(0.32, 0.5, '#f8fafc', 0, 0, 0))
    knob.add(box(0.05, 0.02, 0.28, '#111827', 0, 0.26, -0.13))
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
    const disc = cylinder(0.26, 0.12, mat('#c2410c', { roughness: 0.35 }), 0, 0.5, 0.35)
    disc.rotation.x = 0
    group.add(disc, cylinder(0.03, 0.35, '#9ca3af', -0.12, 0.3, 0.35, 6), cylinder(0.03, 0.35, '#9ca3af', 0.12, 0.3, 0.35, 6))
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
    const { markers } = breakout(group, part.id, definition.pins, { type: 'buzzer', color: '#111827' })
    const body = cylinder(0.6, 0.8, '#0f172a', 0, 0.55, 0.25, 32)
    const hole = cylinder(0.1, 0.02, '#374151', 0, 0.96, 0.25)
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.04, 8, 48), new THREE.MeshBasicMaterial({ color: '#f59e0b', transparent: true, opacity: 0 }))
    ring.rotation.x = Math.PI / 2
    ring.position.set(0, 1.0, 0.25)
    group.add(body, hole, ring)
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
    const body = box(2.3, 2.25, 1.22, '#2563eb', 0, 1.15, 0.6)
    body.userData = { kind: 'part', partId: part.id }
    group.add(body, box(3.2, 0.25, 1.22, '#2563eb', 0, 1.7, 0.6))
    group.add(cylinder(0.55, 0.45, '#1d4ed8', 0.55, 2.45, 0.6))
    const horn = new THREE.Group()
    horn.add(cylinder(0.18, 0.3, '#f8fafc', 0, 0, 0))
    horn.add(box(1.6, 0.15, 0.32, '#f8fafc', 0.7, 0.05, 0))
    horn.position.set(0.55, 2.75, 0.6)
    group.add(horn)
    // Three-wire lead ending in a female connector at the back.
    group.add(box(0.75, 0.3, 0.5, '#111827', 0, 0.15, -1.3))
    ;[['#7c2d12', -0.254], ['#dc2626', 0], ['#f97316', 0.254]].forEach(([color, x]) => {
      const lead = box(0.08, 0.06, 1.25, color, x, 0.25, -0.5)
      group.add(lead)
    })
    const markers = definition.pins.map((pin) => pinMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, new THREE.Vector3(pin.x, 0.92, pin.z), pin.kind))
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
    const board = box(4.5, 2.0, 0.15, '#1d4ed8', 0, 1.05, 0)
    board.userData = { kind: 'part', partId: part.id }
    group.add(board)
    for (const x of [-1.3, 1.3]) {
      const can = cylinder(0.8, 1.2, mat('#cbd5e1', { metalness: 0.7, roughness: 0.35 }), x, 1.1, 0.65, 32)
      can.rotation.x = Math.PI / 2
      group.add(can)
    }
    const markers = definition.pins.map((pin) => pinMarker(group, { owner: 'part', partId: part.id, pin: pin.id }, new THREE.Vector3(pin.x, 0.62, pin.z), pin.kind))
    // A short sound cone in front of the sensor and the distance it is
    // currently "seeing" (set with the slider in the inspector).
    const beam = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3, 24, 1, true), new THREE.MeshBasicMaterial({ color: '#38bdf8', transparent: true, opacity: 0.14, side: THREE.DoubleSide, depthWrite: false }))
    beam.rotation.x = -Math.PI / 2
    beam.position.set(0, 1.1, 2.6)
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
    const shell = box(1.25, 1.55, 0.55, '#38bdf8', 0, 0.92, 0.3)
    group.add(shell)
    for (let row = 0; row < 4; row += 1) {
      for (let col = 0; col < 3; col += 1) group.add(box(0.22, 0.12, 0.02, '#0c4a6e', (col - 1) * 0.32, 0.55 + row * 0.3, 0.59))
    }
    return { group, markers, update() {} }
  },

  sevenSegment(part, definition) {
    const group = new THREE.Group()
    const { markers } = breakout(group, part.id, definition.pins, { type: 'sevenSegment', color: '#111827' })
    group.add(box(1.4, 0.5, 1.9, '#1f2937', 0, 0.39, 0.3))
    const off = '#3f1d1d'
    const segments = {}
    const makeSegment = (name, w, d, x, z) => {
      const material = new THREE.MeshStandardMaterial({ color: off, emissive: '#ef4444', emissiveIntensity: 0 })
      const segment = box(w, 0.03, d, material, x, 0.66, z + 0.3)
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
    makeSegment('dp', 0.12, 0.12, 0.55, 0.72)
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
    group.add(cylinder(0.25, 0.6, mat('#e0f2fe', { transparent: true, opacity: 0.8 }), -0.3, 0.45, 1.2))
    group.add(cylinder(0.25, 0.6, '#111827', 0.3, 0.45, 1.2))
    group.add(box(0.45, 0.35, 0.45, '#2563eb', 0, 0.32, 0.2))
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
    group.add(box(2.4, 1.6, 0.4, '#111827', 0, 0.94, 0.3))
    for (let i = 0; i < 7; i += 1) group.add(box(0.06, 0.4, 0.9, '#111827', -1.1 + i * 0.36, 1.9, 0.3))
    group.add(box(0.75, 0.75, 0.75, '#2563eb', 1.6, 0.52, 1.6), box(0.75, 0.75, 0.75, '#2563eb', -1.6, 0.52, 1.6))
    const wheels = []
    for (const side of [-1, 1]) {
      const motor = box(2.2, 1.9, 2.2, '#facc15', side * 4.2, 0.95, 0.6)
      const wheel = new THREE.Group()
      const tyre = cylinder(1.6, 0.8, '#111827', 0, 0, 0, 32)
      tyre.rotation.z = Math.PI / 2
      const hub = cylinder(0.9, 0.84, '#facc15', 0, 0, 0, 6)
      hub.rotation.z = Math.PI / 2
      wheel.add(tyre, hub)
      wheel.position.set(side * 5.75, 1.65, 0.6)
      group.add(motor, wheel)
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
