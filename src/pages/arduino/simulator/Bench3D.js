// The 3D workbench: an Uno, a breadboard and the student's parts on an
// anti-static mat. Click any two points (Uno pin, part pin, breadboard hole)
// to run a jumper between them. Drag parts to move them; a part let go over
// the breadboard is pressed into its holes.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { GTAOPass } from 'three/examples/jsm/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import {
  BREADBOARD_HEIGHT,
  BREADBOARD_SIZE,
  PART_CATALOG,
  PWM_PINS,
  UNO_ID,
  breadboardHoles,
  buildNets,
  describeEndpoint,
  describeNet,
  endpointKey,
  holeWorldPosition,
  movePart,
  normalizeWire,
  partLabel,
  pluggedParts,
  unoPlacement,
} from '../../../utils/avrSim/catalog'
import { buildPart } from './models'
import { buildUnoClone } from './unoClone'
import { buildUno } from './unoModel'

const WIRE_PALETTE = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4']

// The solid bodies of a model, left after pin markers, labels and see-through
// effects (hit areas, sound cones).
// The cables and battery plugged into the Uno lie on the mat and do not
// count as its body.
function bodyBox(group, skip) {
  const box = new THREE.Box3()
  group.updateMatrixWorld(true)
  group.traverse((child) => {
    if (!child.isMesh || skip.has(child) || child.userData.kind === 'power') return
    const materials = [child.material].flat()
    if (materials.every((material) => material.transparent && material.opacity < 0.5)) return
    child.geometry.computeBoundingBox()
    box.union(child.geometry.boundingBox.clone().applyMatrix4(child.matrixWorld))
  })
  return box
}

const isPower = (end) => ['5V', '3V3', 'VIN'].includes(end.uno) || /^[TB]\+/.test(end.pin ?? '')
const isGround = (end) => end.uno === 'GND' || /^[TB]-/.test(end.pin ?? '')

export function wireColor(wire, index) {
  const { from, to } = normalizeWire(wire)
  if (isPower(from) || isPower(to)) return '#dc2626'
  if (isGround(from) || isGround(to)) return '#1f2937'
  return wire.color ?? WIRE_PALETTE[index % WIRE_PALETTE.length]
}

function describeUnoPin(pin, anchor) {
  if (anchor === 'SDA') return 'SDA · I2C veri hattı (kartta A4 ile aynı pin)'
  if (anchor === 'SCL') return 'SCL · I2C saat hattı (kartta A5 ile aynı pin)'
  if (anchor === 'IOREF') return 'IOREF · kartın çalışma voltajı (5V’a bağlı)'
  if (pin === 'RESET') return 'RESET · GND’ye çekilince kart resetlenir'
  if (pin === 'AREF') return 'AREF · analogRead için dış referans voltajı (analogReference(EXTERNAL))'
  if (pin === 'NC') return 'NC · hiçbir yere bağlı değil'
  if (pin === 'VIN') return 'VIN · 6–20 V giriş (adaptör voltajı)'
  if (pin === '5V' || pin === '3V3') return `${pin} · besleme`
  if (pin === 'GND') return 'GND · toprak'
  if (pin === 'A4') return 'A4 · analog giriş · I2C SDA'
  if (pin === 'A5') return 'A5 · analog giriş · I2C SCL'
  if (pin.startsWith('A')) return `${pin} · analog giriş`
  const extra = { D0: 'Serial RX', D1: 'Serial TX', D2: 'kesme 0 (attachInterrupt)', D3: 'kesme 1 (attachInterrupt)', D10: 'SPI SS', D11: 'SPI MOSI', D12: 'SPI MISO', D13: 'SPI SCK · kart üstündeki L LED’i (LED_BUILTIN)' }[pin]
  return [`${pin} · dijital pin`, PWM_PINS.has(pin) ? 'PWM (~)' : null, extra].filter(Boolean).join(' · ')
}

// A self-healing cutting mat: a 1 cm grid with every fifth line stronger,
// on slightly mottled rubber. One tile is 10 cm.
function matTextures() {
  const size = 1024
  const color = document.createElement('canvas')
  color.width = color.height = size
  const ctx = color.getContext('2d')
  ctx.fillStyle = '#24353a'
  ctx.fillRect(0, 0, size, size)
  const rough = document.createElement('canvas')
  rough.width = rough.height = size
  const rctx = rough.getContext('2d')
  rctx.fillStyle = '#d8d8d8'
  rctx.fillRect(0, 0, size, size)
  let seed = 7
  const random = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  for (let i = 0; i < 9000; i += 1) {
    const x = random() * size
    const y = random() * size
    const r = 1 + random() * 3
    const light = random() > 0.5
    ctx.fillStyle = light ? 'rgba(255,255,255,0.025)' : 'rgba(0,0,0,0.05)'
    ctx.fillRect(x, y, r, r)
    rctx.fillStyle = light ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.12)'
    rctx.fillRect(x, y, r, r)
  }
  for (let i = 0; i <= 10; i += 1) {
    const at = (i * size) / 10
    const major = i % 5 === 0
    ctx.strokeStyle = major ? 'rgba(170, 214, 205, 0.2)' : 'rgba(170, 214, 205, 0.08)'
    ctx.lineWidth = major ? 2 : 1.5
    ctx.beginPath()
    ctx.moveTo(at, 0)
    ctx.lineTo(at, size)
    ctx.moveTo(0, at)
    ctx.lineTo(size, at)
    ctx.stroke()
  }
  return [color, rough].map((canvas, index) => {
    const texture = new THREE.CanvasTexture(canvas)
    if (index === 0) texture.colorSpace = THREE.SRGBColorSpace
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping
    texture.repeat.set(14, 10)
    texture.anisotropy = 8
    return texture
  })
}

function ring(color) {
  const mesh = new THREE.Mesh(new THREE.RingGeometry(0.075, 0.13, 20), new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9, depthWrite: false, side: THREE.DoubleSide }))
  mesh.rotation.x = -Math.PI / 2
  mesh.visible = false
  mesh.renderOrder = 2
  return mesh
}

export class Bench3D {
  constructor(container, handlers = {}) {
    this.container = container
    this.handlers = handlers
    this.parts = new Map()
    this.wireMeshes = []
    this.pending = null
    this.inputs = {}

    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.NeutralToneMapping
    this.renderer.toneMappingExposure = 1.05
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.touchAction = 'none'

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
    this.camera.position.set(0, 26, 26)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0, 3)
    // A short glide after letting go (about 0.3 s), not three.js's 1.5 s.
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.2
    this.controls.maxPolarAngle = Math.PI * 0.47
    this.controls.minDistance = 6
    this.controls.maxDistance = 80

    // A soft room reflected in metal and glossy parts, plus a warm key light
    // for shadows.
    const pmrem = new THREE.PMREMGenerator(this.renderer)
    this.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    pmrem.dispose()
    this.scene.environment = this.environment
    this.scene.environmentIntensity = 0.5
    this.scene.add(new THREE.HemisphereLight('#f8fafc', '#475569', 0.55))
    const sun = new THREE.DirectionalLight('#fff4e0', 2.3)
    sun.position.set(12, 30, 14)
    sun.castShadow = true
    sun.shadow.mapSize.set(4096, 4096)
    sun.shadow.bias = -0.0002
    sun.shadow.normalBias = 0.015
    Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30, near: 1, far: 90 })
    this.scene.add(sun)

    const [matColor, matRough] = matTextures()
    const mat = new THREE.Mesh(new THREE.PlaneGeometry(140, 100), new THREE.MeshStandardMaterial({ map: matColor, roughnessMap: matRough, roughness: 0.92 }))
    mat.rotation.x = -Math.PI / 2
    mat.position.set(0, -0.01, 4)
    mat.receiveShadow = true
    this.scene.add(mat)
    this.floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    this.setBoard('ch340')

    this.raycaster = new THREE.Raycaster()
    this.pointer = new THREE.Vector2()
    this.rubberBand = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineDashedMaterial({ color: '#22d3ee', dashSize: 0.3, gapSize: 0.2 }))
    this.rubberBand.visible = false
    this.scene.add(this.rubberBand)
    this.holeRing = ring('#22d3ee')
    this.pendingRing = ring('#facc15')
    this.scene.add(this.holeRing, this.pendingRing)

    this.onPointerDown = this.onPointerDown.bind(this)
    this.onPointerMove = this.onPointerMove.bind(this)
    this.onPointerUp = this.onPointerUp.bind(this)
    this.onKeyDown = this.onKeyDown.bind(this)
    const el = this.renderer.domElement
    el.addEventListener('pointerdown', this.onPointerDown)
    el.addEventListener('pointermove', this.onPointerMove)
    window.addEventListener('pointerup', this.onPointerUp)
    window.addEventListener('keydown', this.onKeyDown)

    // Ambient occlusion darkens the creases where parts meet the board and
    // the mat. It is switched off on machines too slow for it.
    this.composer = new EffectComposer(this.renderer, new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType, samples: 4 }))
    this.composer.addPass(new RenderPass(this.scene, this.camera))
    this.ao = new GTAOPass(this.scene, this.camera, 1, 1, undefined, { radius: 0.6, distanceExponent: 1.5, thickness: 1.5, scale: 1.1, samples: 12 })
    this.ao.blendIntensity = 0.85
    // Hit areas, glows and other see-through helpers cast no occlusion.
    const hide = this.ao._overrideVisibility.bind(this.ao)
    this.ao._overrideVisibility = () => {
      hide()
      this.scene.traverse((object) => {
        const material = object.material
        if (object.visible && (object.isSprite || (object.isMesh && !Array.isArray(material) && (material.depthWrite === false || (material.transparent && material.opacity < 0.5))))) {
          object.visible = false
          this.ao._visibilityCache.push(object)
        }
      })
    }
    this.composer.addPass(this.ao)
    this.composer.addPass(new OutputPass())
    this.frameTimes = []
    this.useComposer = true

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.visible = true
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      this.invalidate()
    })
    this.visibilityObserver.observe(container)
    this.resize()
    this.setTheme(false)

    this.clock = new THREE.Clock()
    this.renderer.setAnimationLoop(() => this.render())
  }

  setTheme(dark) {
    const background = new THREE.Color(dark ? '#0d1517' : '#dfe8ec')
    this.scene.background = background
    // The far end of the mat fades into the page instead of ending.
    this.scene.fog = new THREE.Fog(background, 70, 150)
    this.invalidate()
  }

  resize() {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return
    this.renderer.setSize(clientWidth, clientHeight)
    this.composer.setPixelRatio(this.renderer.getPixelRatio())
    this.composer.setSize(clientWidth, clientHeight)
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.invalidate()
  }

  // ---------------------------------------------------------- circuit ---

  setCircuit(circuit) {
    this.circuit = circuit
    const ids = new Set(circuit.parts.map((part) => part.id))
    for (const [id, entry] of this.parts) {
      if (!ids.has(id)) {
        this.scene.remove(entry.model.group)
        this.parts.delete(id)
      }
    }
    for (const part of circuit.parts) {
      const key = JSON.stringify(part.props ?? {})
      let entry = this.parts.get(part.id)
      if (entry && entry.key !== key) {
        this.scene.remove(entry.model.group)
        entry = null
      }
      if (!entry) {
        const model = buildPart(part, PART_CATALOG[part.type])
        this.scene.add(model.group)
        entry = { model, key }
        this.parts.set(part.id, entry)
      }
      entry.part = part
    }
    this.layout()
  }

  // The kit's CH340 clone or the official R3; both have their headers in
  // the same places, so wires stay where they are.
  setBoard(kind) {
    if (this.uno && this.boardKind === kind) return
    if (this.uno) {
      this.scene.remove(this.uno.group)
      this.uno.group.traverse((child) => child.geometry?.dispose())
    }
    this.boardKind = kind
    this.uno = kind === 'r3' ? buildUno() : buildUnoClone()
    this.uno.setPower(this.power ?? { usb: true, battery: false })
    this.scene.add(this.uno.group)
    // The Uno's outline at the origin, unturned; moved and turned per circuit.
    this.unoOutline = bodyBox(this.uno.group, new Set(this.uno.markers))
  }

  // Places every part from the circuit: plugged-in parts (and anything
  // resting on a breadboard) sit on top of the board.
  layout() {
    this.invalidate()
    const { position, rotation, board, usb, battery } = unoPlacement(this.circuit)
    this.setBoard(board)
    this.power = { usb, battery }
    this.uno.setPower(this.power)
    this.uno.group.position.set(position[0], 0, position[1])
    this.uno.group.rotation.y = (rotation * Math.PI) / 180
    this.uno.group.updateMatrixWorld(true)
    this.nets = buildNets(this.circuit)
    const boards = this.circuit.parts.filter((part) => part.type === 'breadboard')
    const onBoard = (part) =>
      boards.some((board) => {
        if (board.id === part.id) return false
        const local = new THREE.Vector3(part.position[0] - board.position[0], 0, part.position[1] - board.position[1]).applyAxisAngle(new THREE.Vector3(0, 1, 0), (-(board.rotation ?? 0) * Math.PI) / 180)
        return Math.abs(local.x) < BREADBOARD_SIZE[0] / 2 && Math.abs(local.z) < BREADBOARD_SIZE[1] / 2
      })
    for (const part of this.circuit.parts) {
      const entry = this.parts.get(part.id)
      if (!entry) continue
      entry.part = part
      const plugged = this.nets.plugged.has(part.id)
      entry.model.group.position.set(part.position[0], plugged || onBoard(part) ? BREADBOARD_HEIGHT : 0, part.position[1])
      entry.model.group.rotation.y = ((part.rotation ?? 0) * Math.PI) / 180
      // Smaller click targets on plugged leads so the holes next to them stay reachable.
      for (const marker of entry.model.markers) marker.scale.setScalar(plugged && PART_CATALOG[part.type].bare ? 0.7 : 1)
    }
    this.refreshHighlight()
    this.rebuildWires()
  }

  unoMarker(end) {
    const anchor = end.anchor ?? end.uno
    return this.uno.markers.find((marker) => marker.userData.anchor === anchor) ?? this.uno.markers.find((marker) => marker.userData.pin === end.uno)
  }

  // Where a wire end sits in the scene.
  endPosition(end) {
    if (end.uno) return this.unoMarker(end)?.getWorldPosition(new THREE.Vector3()) ?? null
    const entry = this.parts.get(end.part)
    if (!entry) return null
    if (entry.part.type === 'breadboard') {
      if (!breadboardHoles().byId.has(end.pin)) return null
      const [x, z] = holeWorldPosition(entry.part, end.pin)
      return new THREE.Vector3(x, BREADBOARD_HEIGHT, z)
    }
    return entry.model.markers.find((marker) => marker.userData.pin === end.pin)?.getWorldPosition(new THREE.Vector3()) ?? null
  }

  // How far below the end position a jumper's housing rests: on top of the
  // Uno's header, or slid down over a module's male pin to its spacer.
  endSeat(end) {
    if (end.uno) return this.unoMarker(end)?.userData.seat ?? 0
    const entry = this.parts.get(end.part)
    return entry?.model.markers.find((marker) => marker.userData.pin === end.pin)?.userData.seat ?? 0
  }

  rebuildWires() {
    for (const mesh of this.wireMeshes) {
      this.scene.remove(mesh)
      mesh.geometry.dispose()
      mesh.material.dispose()
    }
    this.wireMeshes = []
    this.scene.updateMatrixWorld(true)
    this.circuit.wires.forEach((raw, index) => {
      const wire = normalizeWire(raw)
      const a = this.endPosition(wire.from)?.add(new THREE.Vector3(0, this.endSeat(wire.from), 0))
      const b = this.endPosition(wire.to)?.add(new THREE.Vector3(0, this.endSeat(wire.to), 0))
      if (!a || !b) return
      // Dupont jumper ends: a square black housing over the pin; the wire
      // leaves from its top.
      const housing = 0.5
      const top = (at) => at.clone().add(new THREE.Vector3(0, housing, 0))
      const distance = a.distanceTo(b)
      // Short jumpers on the breadboard stay low; long ones arc over the bench.
      const lift = Math.min(0.25 + distance * 0.22, 1 + distance * 0.22)
      const rise = Math.min(0.5, 0.12 + distance * 0.1)
      const mid = top(a).lerp(top(b), 0.5).add(new THREE.Vector3(0, lift, 0))
      const curve = new THREE.CatmullRomCurve3([top(a), top(a).add(new THREE.Vector3(0, rise, 0)), mid, top(b).add(new THREE.Vector3(0, rise, 0)), top(b)])
      const selected = this.selection?.wireId === wire.id
      const material = new THREE.MeshPhysicalMaterial({ color: wireColor(wire, index), roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.4, emissive: selected ? '#22d3ee' : '#000000', emissiveIntensity: selected ? 0.6 : 0 })
      const radius = selected ? 0.075 : 0.055
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, radius, 10), material)
      // A male end's pin goes into the hole; a female end has swallowed the
      // module's pin.
      const ends = [
        [a, this.endSeat(wire.from)],
        [b, this.endSeat(wire.to)],
      ].flatMap(([at, seat]) => {
        const shell = new THREE.Mesh(new THREE.BoxGeometry(0.23, housing, 0.23), new THREE.MeshStandardMaterial({ color: '#18181b', roughness: 0.5 }))
        shell.position.copy(at).add(new THREE.Vector3(0, housing / 2, 0))
        if (seat < -0.1) return [shell]
        const pin = new THREE.Mesh(new THREE.BoxGeometry(0.064, 0.3, 0.064), new THREE.MeshStandardMaterial({ color: '#d6b25e', metalness: 1, roughness: 0.3 }))
        pin.position.copy(at).add(new THREE.Vector3(0, -0.13, 0))
        return [shell, pin]
      })
      for (const part of [mesh, ...ends]) {
        part.castShadow = true
        part.userData = { kind: 'wire', wireId: wire.id }
        this.scene.add(part)
        this.wireMeshes.push(part)
      }
    })
  }

  setSelection(selection) {
    this.selection = selection
    this.invalidate()
    this.refreshHighlight()
    if (this.circuit) this.rebuildWires()
  }

  // The selected part gets a glowing outline on the surface under it. (Its
  // own materials are left alone: models animate them, LEDs light them.)
  refreshHighlight() {
    if (this.highlight) {
      this.scene.remove(this.highlight)
      this.highlight.traverse((child) => {
        child.geometry?.dispose()
        child.material?.dispose()
      })
      this.highlight = null
    }
    const entry = this.selection?.partId === UNO_ID ? { model: this.uno } : this.selection?.partId && this.parts.get(this.selection.partId)
    if (!entry) return
    const bounds = bodyBox(entry.model.group, new Set(entry.model.markers))
    if (bounds.isEmpty()) return
    const size = bounds.getSize(new THREE.Vector3())
    const center = bounds.getCenter(new THREE.Vector3())
    const width = size.x + 0.3
    const depth = size.z + 0.3
    const shape = new THREE.Shape()
    const r = Math.min(0.25, width / 2, depth / 2)
    shape.moveTo(-width / 2 + r, -depth / 2)
    shape.lineTo(width / 2 - r, -depth / 2)
    shape.quadraticCurveTo(width / 2, -depth / 2, width / 2, -depth / 2 + r)
    shape.lineTo(width / 2, depth / 2 - r)
    shape.quadraticCurveTo(width / 2, depth / 2, width / 2 - r, depth / 2)
    shape.lineTo(-width / 2 + r, depth / 2)
    shape.quadraticCurveTo(-width / 2, depth / 2, -width / 2, depth / 2 - r)
    shape.lineTo(-width / 2, -depth / 2 + r)
    shape.quadraticCurveTo(-width / 2, -depth / 2, -width / 2 + r, -depth / 2)
    const fill = new THREE.Mesh(new THREE.ShapeGeometry(shape), new THREE.MeshBasicMaterial({ color: '#22d3ee', transparent: true, opacity: 0.22, depthWrite: false }))
    const edge = new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(shape.getPoints(8)), new THREE.LineBasicMaterial({ color: '#22d3ee' }))
    this.highlight = new THREE.Group()
    this.highlight.add(fill, edge)
    this.highlight.rotation.x = -Math.PI / 2
    this.highlight.position.set(center.x, entry.model.group.position.y + 0.02, center.z)
    this.highlight.renderOrder = 1
    this.scene.add(this.highlight)
  }

  // Parts locked in place ({ id: true }): dragging one turns the camera.
  setLocked(locked) {
    this.locked = locked ?? {}
  }

  // Whether a drag on this part would move something locked (a breadboard
  // carries what is plugged into it).
  isLocked(partId) {
    return [...this.movingWith(this.circuit, partId)].some((id) => this.locked?.[id])
  }

  // The part (or the Uno) a hit belongs to.
  partOf(hit) {
    const data = hit?.object.userData
    if (data?.kind === 'uno' || data?.kind === 'reset' || data?.kind === 'power') return UNO_ID
    if (data?.kind === 'part' || data?.kind === 'board' || data?.kind === 'press') return data.partId
    return null
  }

  setSnapshot(snapshot, inputs) {
    this.snapshot = snapshot
    this.inputs = inputs ?? {}
    this.invalidate()
  }

  // Slider and switch values set in the inspector (pot position, distance…).
  setInputs(inputs) {
    this.inputs = inputs ?? {}
    this.invalidate()
  }

  // ------------------------------------------------------ interaction ---

  setPointer(event) {
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    this.raycaster.setFromCamera(this.pointer, this.camera)
  }

  pick(event) {
    this.setPointer(event)
    const targets = [this.uno.group, ...[...this.parts.values()].map((entry) => entry.model.group), ...this.wireMeshes]
    const hits = this.raycaster.intersectObjects(targets, true).filter((hit) => hit.object.userData.kind)
    // Pins are tiny, so prefer one if it is anywhere near the front.
    const pin = hits.find((hit, index) => hit.object.userData.kind === 'pin' && index < 4)
    return pin ?? hits[0] ?? null
  }

  floorPoint(event) {
    this.setPointer(event)
    return this.raycaster.ray.intersectPlane(this.floor, new THREE.Vector3())
  }

  // The breadboard hole under a hit on the board, if the pointer is on one.
  holeAt(hit) {
    const entry = this.parts.get(hit.object.userData.partId)
    if (!entry) return null
    const local = entry.model.group.worldToLocal(hit.point.clone())
    let best = null
    let bestDistance = 0.17
    for (const hole of breadboardHoles().list) {
      const d = Math.hypot(hole.x - local.x, hole.z - local.z)
      if (d < bestDistance) {
        best = hole
        bestDistance = d
      }
    }
    return best ? { part: entry.part.id, pin: best.id } : null
  }

  // A wiring target under the pointer: a pin marker or a breadboard hole.
  target(hit) {
    const data = hit?.object.userData
    if (data?.kind === 'pin') {
      const end = data.owner === 'uno' ? { uno: data.pin, ...(data.anchor && data.anchor !== data.pin ? { anchor: data.anchor } : {}) } : { part: data.partId, pin: data.pin }
      return { end, marker: hit.object }
    }
    if (data?.kind === 'board') {
      const end = this.holeAt(hit)
      return end ? { end } : null
    }
    return null
  }

  describe(end) {
    if (end.uno) return describeUnoPin(end.uno, end.anchor)
    const hole = this.nets.plugged.get(end.part)?.holes[end.pin]
    const uno = describeNet(this.nets.nets, endpointKey(end))
    return `${describeEndpoint(this.circuit, end)}${hole ? ` · ${hole} deliğinde` : ''}${uno.length ? ` → ${uno.join(', ')}` : ' · Arduino’ya bağlı değil'}`
  }

  setHover(target) {
    if (this.hovered?.marker && this.hovered.marker !== target?.marker && this.hovered.marker !== this.pending?.marker) this.hovered.marker.material.opacity = 0
    this.hovered = target
    if (target?.marker && target.marker !== this.pending?.marker) target.marker.material.opacity = 0.55
    this.holeRing.visible = Boolean(target && !target.marker)
    if (this.holeRing.visible) this.holeRing.position.copy(this.endPosition(target.end)).setY(BREADBOARD_HEIGHT + 0.01)
  }

  onPointerDown(event) {
    this.invalidate()
    // Only the main button picks, drags and wires; the right button pans,
    // and a right click that does not pan cancels a wire being drawn.
    if (event.button === 2) this.rightDown = { x: event.clientX, y: event.clientY }
    if (event.button !== 0) return
    const hit = this.pick(event)
    this.down = { x: event.clientX, y: event.clientY, hit }
    if (!hit) return
    const data = hit.object.userData
    if (data.kind === 'press') {
      this.controls.enabled = false
      this.pressing = data.partId
      this.handlers.onPress?.(data.partId, true)
    } else if (data.kind === 'reset') {
      this.controls.enabled = false
      this.resetting = true
      this.uno.setReset(true)
    } else if (data.kind === 'power') {
      // A click on a plug pulls it out (the Uno card puts it back).
      this.controls.enabled = false
      this.unplugging = data.which
    } else if ((data.kind === 'part' || data.kind === 'board' || data.kind === 'uno') && !this.isLocked(data.kind === 'uno' ? UNO_ID : data.partId)) {
      const partId = data.kind === 'uno' ? UNO_ID : data.partId
      const position = partId === UNO_ID ? unoPlacement(this.circuit).position : this.parts.get(partId)?.part.position
      const point = this.floorPoint(event)
      if (position && point) {
        this.controls.enabled = false
        const moving = this.movingWith(this.circuit, partId)
        this.drag = { partId, offset: [point.x - position[0], point.z - position[1]], base: this.circuit, moved: false, moving, overlapping: this.overlaps(this.circuit, moving) }
      }
    }
  }

  // The part being dragged and, for a breadboard, what is plugged into it.
  movingWith(circuit, partId) {
    const riders = [...pluggedParts(circuit)].filter(([, info]) => info.board === partId).map(([id]) => id)
    return new Set([partId, ...riders])
  }

  // A part's outline on the mat at rotation 0 around its origin (cached).
  outline(entry) {
    if (!entry.outline) {
      const { group } = entry.model
      const [position, rotation] = [group.position.clone(), group.rotation.y]
      group.position.set(0, 0, 0)
      group.rotation.y = 0
      entry.outline = bodyBox(group, new Set(entry.model.markers))
      group.position.copy(position)
      group.rotation.y = rotation
      group.updateMatrixWorld(true)
    }
    return entry.outline
  }

  // Where a part would cover the mat: [minX, maxX, minZ, maxZ].
  footprint(part) {
    const entry = this.parts.get(part.id)
    if (!entry) return null
    return this.turnedBox(this.outline(entry), part)
  }

  // An outline turned and moved to { position, rotation } on the mat.
  turnedBox(box, part) {
    const turn = ((part.rotation ?? 0) * Math.PI) / 180
    const up = new THREE.Vector3(0, 1, 0)
    const corners = [
      [box.min.x, box.min.z],
      [box.max.x, box.min.z],
      [box.min.x, box.max.z],
      [box.max.x, box.max.z],
    ].map(([x, z]) => new THREE.Vector3(x, 0, z).applyAxisAngle(up, turn))
    const xs = corners.map((corner) => corner.x + part.position[0])
    const zs = corners.map((corner) => corner.z + part.position[1])
    return [Math.min(...xs), Math.max(...xs), Math.min(...zs), Math.max(...zs)]
  }

  // Pairs ("a|b") of a moving part and something it runs into. Parts may
  // rest on a breadboard; the Uno and other parts are solid.
  overlaps(circuit, moving) {
    const uno = { id: UNO_ID, box: this.turnedBox(this.unoOutline, unoPlacement(circuit)) }
    const solids = [uno, ...circuit.parts.map((part) => ({ id: part.id, board: part.type === 'breadboard', box: this.footprint(part) })).filter((item) => item.box)]
    const hit = (a, b, gap = 0.03) => a[0] < b[1] - gap && b[0] < a[1] - gap && a[2] < b[3] - gap && b[2] < a[3] - gap
    const pairs = new Set()
    for (const item of solids.filter((solid) => moving.has(solid.id))) {
      for (const other of solids.filter((solid) => !moving.has(solid.id))) {
        // Parts may sit on a breadboard; nothing sits on the Uno or under it.
        if (item.board !== Boolean(other.board) && other.id !== UNO_ID && item.id !== UNO_ID) continue
        if (hit(item.box, other.box)) pairs.add(`${item.id}|${other.id}`)
      }
    }
    return pairs
  }

  // Whether a change to the circuit (a part rotated or nudged) leaves that
  // part clear of the others and the Uno; overlaps it already had are let be.
  fits(before, after, partId) {
    const had = this.overlaps(before, this.movingWith(before, partId))
    const has = this.overlaps(after, this.movingWith(after, partId))
    return [...has].every((pair) => had.has(pair))
  }

  onPointerMove(event) {
    this.invalidate()
    if (this.drag) {
      const moved = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) > 4
      if (moved || this.drag.moved) {
        this.drag.moved = true
        this.setHover(null)
        const point = this.floorPoint(event)
        if (point) {
          const x = Math.max(-30, Math.min(30, point.x - this.drag.offset[0]))
          const z = Math.max(-17, Math.min(25, point.z - this.drag.offset[1]))
          // Preview exactly what the page will do on release (snap, carry);
          // a spot that runs into another part (or the Uno) is refused and
          // the part stays where it last fitted.
          const candidate = movePart(this.drag.base, this.drag.partId, [x, z])
          const blocked = [...this.overlaps(candidate, this.drag.moving)].some((pair) => !this.drag.overlapping.has(pair))
          this.renderer.domElement.style.cursor = blocked ? 'not-allowed' : 'grabbing'
          if (!blocked) {
            this.drag.position = [x, z]
            this.circuit = candidate
            this.layout()
          }
        }
      }
      return
    }

    const hit = this.pick(event)
    const target = this.target(hit)
    this.setHover(target)
    const kind = hit?.object.userData.kind
    const owner = this.partOf(hit)
    const fixed = owner && this.isLocked(owner)
    this.renderer.domElement.style.cursor = target || kind === 'press' || kind === 'reset' || kind === 'power' ? 'pointer' : (kind === 'part' || kind === 'board' || kind === 'uno') && !fixed ? 'grab' : 'default'
    const rect = this.renderer.domElement.getBoundingClientRect()
    // A pin or hole tells where it goes; a part tells what it is (a part of
    // the Uno, what it does) and whether it is locked.
    const entry = owner && owner !== UNO_ID ? this.parts.get(owner) : null
    const named = hit?.object.userData.info ?? (entry ? partLabel(entry.part) : null)
    const text = target ? this.describe(target.end) : named && `${named}${fixed ? ' · konumu kilitli' : ''}`
    this.handlers.onHover?.(text ? { text, x: event.clientX - rect.left, y: event.clientY - rect.top } : null)

    if (this.pending) {
      const start = this.endPosition(this.pending.end)
      const end = target ? this.endPosition(target.end) : this.floorPoint(event)
      if (start && end) {
        this.rubberBand.geometry.setFromPoints([start, end])
        this.rubberBand.computeLineDistances()
        this.rubberBand.visible = true
      }
    }
  }

  onPointerUp(event) {
    this.invalidate()
    if (event.button === 2) {
      const click = this.rightDown && Math.hypot(event.clientX - this.rightDown.x, event.clientY - this.rightDown.y) < 5
      this.rightDown = null
      if (click && this.pending) this.cancelWiring()
      return
    }
    this.controls.enabled = true
    if (this.unplugging) {
      const which = this.unplugging
      this.unplugging = null
      if (this.down && Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) < 6) this.handlers.onPower?.(which)
      return
    }
    if (this.resetting) {
      // Like the real button: the program starts again on release.
      this.resetting = false
      this.uno.setReset(false)
      this.handlers.onReset?.()
      return
    }
    if (this.pressing) {
      this.handlers.onPress?.(this.pressing, false)
      this.pressing = null
      return
    }
    const hit = this.down?.hit
    if (this.drag) {
      const { drag } = this
      this.drag = null
      if (drag.moved) {
        if (drag.position) this.handlers.onMovePart?.(drag.partId, drag.position)
        return
      }
      // A click on the board (not a drag) lands on a hole.
      const target = hit?.object.userData.kind === 'board' ? this.target(hit) : null
      this.down = null
      if (target) this.clickTarget(target)
      else this.handlers.onSelect?.({ partId: drag.partId })
      return
    }
    if (!this.down || event.target !== this.renderer.domElement) return
    const clicked = Math.hypot(event.clientX - this.down.x, event.clientY - this.down.y) < 5
    this.down = null
    if (!clicked) return
    const data = hit?.object.userData
    const target = this.target(hit)
    if (target) this.clickTarget(target)
    else if (data?.kind === 'wire') this.handlers.onSelect?.({ wireId: data.wireId })
    // A click on a locked part (which did not start a drag) selects it.
    else if (this.partOf(hit) && data?.kind !== 'press') this.handlers.onSelect?.({ partId: this.partOf(hit) })
    else {
      this.cancelWiring()
      this.handlers.onSelect?.(null)
    }
  }

  onKeyDown(event) {
    this.invalidate()
    if (event.key === 'Escape') this.cancelWiring()
  }

  clickTarget(target) {
    if (!this.pending) {
      this.pending = target
      if (target.marker) {
        target.marker.material.color.set('#facc15')
        target.marker.material.opacity = 0.8
      } else {
        this.pendingRing.position.copy(this.endPosition(target.end)).setY(BREADBOARD_HEIGHT + 0.012)
        this.pendingRing.visible = true
      }
      this.handlers.onWiring?.(this.describe(target.end))
      return
    }
    const from = this.pending.end
    this.cancelWiring()
    if (endpointKey(from) === endpointKey(target.end) && from.anchor === target.end.anchor) return
    this.handlers.onConnect?.(from, target.end)
  }

  cancelWiring() {
    if (this.pending?.marker) {
      this.pending.marker.material.color.set('#22d3ee')
      this.pending.marker.material.opacity = 0
    }
    this.pending = null
    this.pendingRing.visible = false
    this.rubberBand.visible = false
    this.handlers.onWiring?.(null)
    this.invalidate()
  }

  // ----------------------------------------------------------- render ---

  // Asks for a new frame; the scene is only drawn when something changed.
  invalidate() {
    this.dirty = true
  }

  render() {
    const dt = Math.min(0.1, this.clock.getDelta())
    // Off screen (scrolled away) nothing is drawn at all.
    if (!this.visible) {
      this.drewLast = false
      return
    }
    const moved = this.controls.update()
    if (!moved && !this.dirty && !this.pending) {
      this.drewLast = false
      return
    }
    this.dirty = false
    const snapshot = this.snapshot
    this.uno.update(snapshot)
    for (const [id, entry] of this.parts) {
      entry.model.update(snapshot?.parts?.[id], this.inputs[id], dt)
    }
    if (this.pending) {
      const pulse = 0.5 + 0.3 * Math.sin(performance.now() / 150)
      if (this.pending.marker) this.pending.marker.material.opacity = pulse
      else this.pendingRing.material.opacity = pulse + 0.2
    }
    if (this.useComposer) {
      this.composer.render(dt)
      // After a warm-up of back-to-back frames, drop the effect if they take
      // too long.
      if (this.drewLast && this.frameTimes.length < 120) {
        this.frameTimes.push(dt)
        if (this.frameTimes.length === 120) {
          const sorted = this.frameTimes.slice(30).sort((a, b) => a - b)
          if (sorted[Math.floor(sorted.length / 2)] > 0.034) this.useComposer = false
        }
      }
    } else {
      this.renderer.render(this.scene, this.camera)
    }
    this.drewLast = true
  }


  // Point the camera so the Uno and every part fit in view.
  frame() {
    const bounds = bodyBox(this.uno.group, new Set(this.uno.markers))
    for (const entry of this.parts.values()) bounds.expandByObject(entry.model.group)
    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const fov = (this.camera.fov * Math.PI) / 180
    const fit = Math.max(size.x / this.camera.aspect, size.z, 8) / (2 * Math.tan(fov / 2))
    const distance = fit * 1.1 + 2
    this.controls.target.copy(center).setY(0)
    this.camera.position.copy(center).add(new THREE.Vector3(0, 0.78, 0.63).multiplyScalar(distance))
    this.controls.update()
    this.invalidate()
  }

  focus() {
    this.frame()
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onPointerDown)
    el.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('keydown', this.onKeyDown)
    this.controls.dispose()
    this.environment.dispose()
    this.composer.dispose()
    this.renderer.dispose()
    el.remove()
  }
}
