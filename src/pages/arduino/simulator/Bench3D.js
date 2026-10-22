// The 3D workbench: an Uno, a breadboard and the student's parts on an
// anti-static mat. Click any two points (Uno pin, part pin, breadboard hole)
// to run a jumper between them. Drag parts to move them; a part let go over
// the breadboard is pressed into its holes.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import {
  BREADBOARD_HEIGHT,
  BREADBOARD_SIZE,
  PART_CATALOG,
  PWM_PINS,
  breadboardHoles,
  buildNets,
  describeEndpoint,
  describeNet,
  endpointKey,
  holeWorldPosition,
  movePart,
  normalizeWire,
  pluggedParts,
} from '../../../utils/avrSim/catalog'
import { buildPart, buildUno } from './models'

const WIRE_PALETTE = ['#f97316', '#22c55e', '#3b82f6', '#a855f7', '#eab308', '#ec4899', '#14b8a6', '#f43f5e', '#84cc16', '#06b6d4']

// The solid bodies of a model, left after pin markers, labels and see-through
// effects (hit areas, sound cones).
function bodyBox(group, skip) {
  const box = new THREE.Box3()
  group.updateMatrixWorld(true)
  group.traverse((child) => {
    if (!child.isMesh || skip.has(child)) return
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

function describeUnoPin(pin) {
  if (pin === '5V' || pin === '3V3' || pin === 'VIN') return `${pin} · besleme`
  if (pin === 'GND') return 'GND · toprak'
  if (pin.startsWith('A')) return `${pin} · analog giriş`
  return `${pin}${PWM_PINS.has(pin) ? ' · PWM (~)' : ''}${pin === 'D0' || pin === 'D1' ? ' · Serial' : ''}`
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
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.touchAction = 'none'

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400)
    this.camera.position.set(0, 26, 26)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.target.set(0, 0, 3)
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI * 0.47
    this.controls.minDistance = 6
    this.controls.maxDistance = 80

    this.scene.add(new THREE.HemisphereLight('#ffffff', '#64748b', 1.4))
    const sun = new THREE.DirectionalLight('#ffffff', 2.2)
    sun.position.set(14, 30, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -32, right: 32, top: 32, bottom: -32, near: 1, far: 90 })
    this.scene.add(sun)

    const mat = new THREE.Mesh(new THREE.PlaneGeometry(140, 100), new THREE.MeshStandardMaterial({ color: '#2b3a44', roughness: 0.95 }))
    mat.rotation.x = -Math.PI / 2
    mat.position.set(0, -0.01, 4)
    mat.receiveShadow = true
    this.scene.add(mat)
    const grid = new THREE.GridHelper(140, 140, '#3b4f5c', '#344652')
    grid.position.set(0, 0, 4)
    this.scene.add(grid)
    this.floor = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)

    this.uno = buildUno()
    this.scene.add(this.uno.group)

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

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.setTheme(false)

    this.clock = new THREE.Clock()
    this.renderer.setAnimationLoop(() => this.render())
  }

  setTheme(dark) {
    this.scene.background = new THREE.Color(dark ? '#0d1517' : '#dfe8ec')
  }

  resize() {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return
    this.renderer.setSize(clientWidth, clientHeight)
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
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

  // Places every part from the circuit: plugged-in parts (and anything
  // resting on a breadboard) sit on top of the board.
  layout() {
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
      const a = this.endPosition(wire.from)
      const b = this.endPosition(wire.to)
      if (!a || !b) return
      const distance = a.distanceTo(b)
      // Short jumpers on the breadboard lie low; long ones arc over the bench.
      const lift = Math.min(0.35 + distance * 0.22, 1 + distance * 0.22)
      const rise = Math.min(0.5, 0.15 + distance * 0.1)
      const mid = a.clone().lerp(b, 0.5).add(new THREE.Vector3(0, lift, 0))
      const curve = new THREE.CatmullRomCurve3([a, a.clone().add(new THREE.Vector3(0, rise, 0)), mid, b.clone().add(new THREE.Vector3(0, rise, 0)), b])
      const selected = this.selection?.wireId === wire.id
      const material = new THREE.MeshStandardMaterial({ color: wireColor(wire, index), roughness: 0.4, emissive: selected ? '#22d3ee' : '#000000', emissiveIntensity: selected ? 0.6 : 0 })
      const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, 48, selected ? 0.075 : 0.055, 8), material)
      mesh.castShadow = true
      mesh.userData = { kind: 'wire', wireId: wire.id }
      this.scene.add(mesh)
      this.wireMeshes.push(mesh)
    })
  }

  setSelection(selection) {
    this.selection = selection
    for (const [id, entry] of this.parts) {
      entry.model.group.traverse((child) => {
        if (child.isMesh && child.material?.emissive && child.userData.kind === 'part') {
          child.material = child.material.clone()
          child.material.emissive.set(selection?.partId === id ? '#0e7490' : '#000000')
          child.material.emissiveIntensity = selection?.partId === id ? 0.35 : 0
        }
      })
    }
    if (this.circuit) this.rebuildWires()
  }

  setSnapshot(snapshot, inputs) {
    this.snapshot = snapshot
    this.inputs = inputs ?? {}
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
    if (end.uno) return describeUnoPin(end.uno)
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
    const hit = this.pick(event)
    this.down = { x: event.clientX, y: event.clientY, hit }
    if (!hit) return
    const data = hit.object.userData
    if (data.kind === 'press') {
      this.controls.enabled = false
      this.pressing = data.partId
      this.handlers.onPress?.(data.partId, true)
    } else if (data.kind === 'part' || data.kind === 'board') {
      const entry = this.parts.get(data.partId)
      const point = this.floorPoint(event)
      if (entry && point) {
        this.controls.enabled = false
        const moving = this.movingWith(this.circuit, data.partId)
        this.drag = { partId: data.partId, offset: [point.x - entry.part.position[0], point.z - entry.part.position[1]], base: this.circuit, moved: false, moving, overlapping: this.overlaps(this.circuit, moving) }
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
    const box = this.outline(entry)
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
    this.unoBox ??= bodyBox(this.uno.group, new Set(this.uno.markers))
    const uno = { id: 'uno', box: [this.unoBox.min.x, this.unoBox.max.x, this.unoBox.min.z, this.unoBox.max.z] }
    const solids = circuit.parts.map((part) => ({ id: part.id, board: part.type === 'breadboard', box: this.footprint(part) })).filter((item) => item.box)
    const hit = (a, b, gap = 0.03) => a[0] < b[1] - gap && b[0] < a[1] - gap && a[2] < b[3] - gap && b[2] < a[3] - gap
    const pairs = new Set()
    for (const item of solids.filter((solid) => moving.has(solid.id))) {
      for (const other of [uno, ...solids.filter((solid) => !moving.has(solid.id))]) {
        if (item.board !== Boolean(other.board) && other.id !== 'uno') continue
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
    this.renderer.domElement.style.cursor = target || kind === 'press' ? 'pointer' : kind === 'part' || kind === 'board' ? 'grab' : 'default'
    const rect = this.renderer.domElement.getBoundingClientRect()
    this.handlers.onHover?.(target ? { text: this.describe(target.end), x: event.clientX - rect.left, y: event.clientY - rect.top } : null)

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
    this.controls.enabled = true
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
    else if (data?.kind === 'uno') this.handlers.onSelect?.(null)
    else {
      this.cancelWiring()
      this.handlers.onSelect?.(null)
    }
  }

  onKeyDown(event) {
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
  }

  // ----------------------------------------------------------- render ---

  render() {
    const dt = Math.min(0.1, this.clock.getDelta())
    this.controls.update()
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
    this.renderer.render(this.scene, this.camera)
  }

  // Point the camera so the Uno and every part fit in view.
  frame() {
    const bounds = new THREE.Box3().setFromObject(this.uno.group)
    for (const entry of this.parts.values()) bounds.expandByObject(entry.model.group)
    const center = bounds.getCenter(new THREE.Vector3())
    const size = bounds.getSize(new THREE.Vector3())
    const fov = (this.camera.fov * Math.PI) / 180
    const fit = Math.max(size.x / this.camera.aspect, size.z, 8) / (2 * Math.tan(fov / 2))
    const distance = fit * 1.1 + 2
    this.controls.target.copy(center).setY(0)
    this.camera.position.copy(center).add(new THREE.Vector3(0, 0.78, 0.63).multiplyScalar(distance))
    this.controls.update()
  }

  focus() {
    this.frame()
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    const el = this.renderer.domElement
    el.removeEventListener('pointerdown', this.onPointerDown)
    el.removeEventListener('pointermove', this.onPointerMove)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('keydown', this.onKeyDown)
    this.controls.dispose()
    this.renderer.dispose()
    el.remove()
  }
}
