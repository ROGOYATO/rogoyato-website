// 3D view of the line-following car on its track. Scene units are
// centimetres; the simulation works in metres.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import SmoothZoom from './smoothZoom'
import { ARENA, WHEEL_RADIUS, resolveTrack } from '../../../utils/avrSim/car'
import { PART_CATALOG } from '../../../utils/avrSim/catalog'
import { box, buildPart, cylinder, mat } from './models'
import { buildNineVolt } from './powerModels'
import { buildUnoClone } from './unoClone'

const CM = 100

function trackTexture(track) {
  const scale = 10 // px per cm
  const canvas = document.createElement('canvas')
  canvas.width = ARENA.width * CM * scale
  canvas.height = ARENA.height * CM * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f4f4f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const { points } = resolveTrack(track)
  ctx.strokeStyle = '#111111'
  ctx.lineWidth = 1.9 * scale
  ctx.lineJoin = 'round'
  ctx.beginPath()
  points.forEach(([x, y], index) => (index ? ctx.lineTo(x * CM * scale, y * CM * scale) : ctx.moveTo(x * CM * scale, y * CM * scale)))
  ctx.closePath()
  ctx.stroke()
  // Checkered start line across the track.
  const [x0, y0] = points[0]
  const [x1, y1] = points[3]
  const angle = Math.atan2(y1 - y0, x1 - x0)
  ctx.save()
  ctx.translate(x0 * CM * scale, y0 * CM * scale)
  ctx.rotate(angle)
  for (let i = -4; i < 4; i += 1) {
    for (let j = 0; j < 2; j += 1) {
      ctx.fillStyle = (i + j) % 2 === 0 ? '#111111' : '#f4f4f0'
      ctx.fillRect(j * 1.2 * scale - 1.2 * scale, i * 1.2 * scale, 1.2 * scale, 1.2 * scale)
    }
  }
  ctx.restore()
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 8
  return texture
}

// The kit's acrylic plate seen from above, in the car frame (x forward,
// y to the left as a 2D shape): 21 cm long, 10 cm wide with a rounded
// back, and 15 cm wide "wings" at the front.
function plateShape() {
  const shape = new THREE.Shape()
  shape.moveTo(-9, 5)
  shape.lineTo(3, 5)
  shape.lineTo(3, 7.5)
  shape.quadraticCurveTo(7, 7.5, 7, 3.5)
  shape.lineTo(7, -3.5)
  shape.quadraticCurveTo(7, -7.5, 3, -7.5)
  shape.lineTo(3, -5)
  shape.lineTo(-9, -5)
  shape.absarc(-9, 0, 5, -Math.PI / 2, -Math.PI * 1.5, true)
  // Mounting slots and holes, as on the real plate.
  const slot = (x, y, w, h) => {
    const hole = new THREE.Path()
    hole.moveTo(x - w / 2, y - h / 2)
    hole.lineTo(x + w / 2, y - h / 2)
    hole.lineTo(x + w / 2, y + h / 2)
    hole.lineTo(x - w / 2, y + h / 2)
    hole.closePath()
    shape.holes.push(hole)
  }
  const round = (x, y, r) => {
    const hole = new THREE.Path()
    hole.absarc(x, y, r, 0, Math.PI * 2, false)
    shape.holes.push(hole)
  }
  for (const y of [-3.9, 3.9]) {
    slot(1.2, y, 0.35, 1.4) // motor bracket slots
    slot(-1.6, y, 0.35, 1.4)
    for (const x of [-4, -6, -8]) round(x, y, 0.18)
  }
  for (const y of [-6.2, -4.8, 4.8, 6.2]) slot(5.2, y, 0.25, 0.9) // wing slots
  slot(-1, 0, 4, 0.6) // cable pass
  for (const [x, y] of [[-11.5, 1.2], [-11.5, -1.2], [-12.7, 1.2], [-12.7, -1.2]]) round(x, y, 0.18) // caster
  for (const x of [2, 4.5]) for (const y of [-2.5, 2.5]) round(x, y, 0.17)
  return shape
}

function wire(points, color) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, y, z]) => new THREE.Vector3(x, y, z)))
  return new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.07, 6), mat(color, { roughness: 0.5 }))
}

// The light model for slow computers: plain boxes and cylinders.
function buildSimpleCar() {
  const car = new THREE.Group()
  // Car frame: +X forward, axle at the origin, sensors 9 cm ahead.
  const chassis = box(20, 0.3, 14, mat('#bae6fd', { transparent: true, opacity: 0.55, roughness: 0.1 }), 3, 4.2, 0)
  car.add(chassis)
  const wheels = {}
  for (const side of ['left', 'right']) {
    const z = side === 'left' ? -8.2 : 8.2
    car.add(box(6.5, 2.2, 1.9, '#facc15', 0.8, 2.9, side === 'left' ? -5.6 : 5.6))
    const wheel = new THREE.Group()
    const tyre = cylinder(WHEEL_RADIUS * CM, 2.6, '#111827', 0, 0, 0, 32)
    tyre.rotation.x = Math.PI / 2
    const hub = cylinder(WHEEL_RADIUS * CM * 0.55, 2.7, '#facc15', 0, 0, 0, 6)
    hub.rotation.x = Math.PI / 2
    wheel.add(tyre, hub)
    wheel.position.set(0, WHEEL_RADIUS * CM, z)
    car.add(wheel)
    wheels[side] = wheel
  }
  car.add(cylinder(0.9, 2.4, '#9ca3af', -7.5, 1.6, 0)) // caster post
  car.add(new THREE.Mesh(new THREE.SphereGeometry(0.9, 16, 12), mat('#d1d5db', { metalness: 0.7 })).translateX(-7.5).translateY(0.9))
  car.add(box(6.86, 0.16, 5.34, '#0b7a80', 4.5, 4.6, 0)) // Uno
  car.add(box(3.5, 0.35, 0.95, '#111827', 5.5, 4.85, 0.6))
  car.add(box(4.3, 0.15, 4.3, '#b91c1c', -1.5, 4.5, 0)) // L298N
  car.add(box(2.4, 1.6, 0.4, '#111827', -1.5, 5.4, 0.8))
  car.add(box(6.2, 1.6, 5.8, '#1f2937', -5.5, 3.2, 0)) // 4×AA pack under the plate
  car.add(box(4.85, 1.75, 2.6, '#1e3a8a', -5.2, 5.2, 3.6)) // 9 V battery for the Uno
  const sensors = {}
  for (const [side, z] of [['left', -2], ['center', 0], ['right', 2]]) {
    const sensor = new THREE.Group()
    sensor.add(box(3.1, 0.15, 1.4, '#1d4ed8', 0, 0, 0))
    sensor.add(cylinder(0.25, 0.6, '#e0f2fe', 1.2, -0.35, -0.3), cylinder(0.25, 0.6, '#111827', 1.2, -0.35, 0.3))
    const led = box(0.2, 0.1, 0.15, new THREE.MeshStandardMaterial({ color: '#22c55e', emissive: '#22c55e', emissiveIntensity: 0 }), -0.6, 0.12, 0.45)
    sensor.add(led)
    sensor.position.set(9 - 1.2, 1.4, z * 1.0)
    car.add(sensor)
    sensors[side] = led
  }
  // A strut holding the sensor bar under the front of the plate.
  car.add(box(1.2, 2.6, 8, '#475569', 8.2, 2.8, 0))
  return {
    car,
    spin(side, angle) {
      wheels[side].rotation.z = -angle
    },
    sense(side, black) {
      // The KH-09's own LED lights over the white floor.
      sensors[side].material.emissiveIntensity = black ? 0 : 2.4
    },
    caster: null,
  }
}

// The caster under the back: its pivot, how far the wheel trails behind
// the pivot, and the wheel's radius (cm).
const CASTER = { x: -12.1, trail: 0.7, radius: 0.95 }

// A bench model as a fixed part of the car: no hover markers, no loose leads
// (the car draws its own wiring).
function carPart(type, id) {
  const model = buildPart({ id, type }, PART_CATALOG[type])
  const loose = type === 'ttMotor' || type === 'battery'
  const drop = []
  model.group.traverse((child) => {
    if (child.userData?.kind === 'pin' || child.geometry?.type === 'TubeGeometry') drop.push(child)
    // The pin at a loose lead's end (motor, battery pack); boards keep theirs.
    const size = child.geometry?.parameters
    if (loose && size?.width === 0.064 && size?.height === 0.6) drop.push(child)
  })
  for (const child of drop) child.parent.remove(child)
  return model
}

// The detailed car: the same Uno clone, L298N, KH-09s, TT motors with their
// wheels and battery packs as on the bench, on the kit's acrylic plate.
function buildDetailedCar() {
  const car = new THREE.Group()
  // Car frame: +X forward, axle at the origin, sensors 9 cm ahead.
  const plateBottom = WHEEL_RADIUS * CM + 1.1
  const plateTop = plateBottom + 0.3
  const plate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(plateShape(), { depth: 0.3, bevelEnabled: false, curveSegments: 24 }),
    new THREE.MeshPhysicalMaterial({ color: '#e0f2fe', transparent: true, opacity: 0.5, roughness: 0.05, transmission: 0.3, thickness: 0.3 }),
  )
  plate.rotation.x = Math.PI / 2
  plate.position.y = plateTop
  car.add(plate)
  const brass = mat('#c9a227', { metalness: 0.8, roughness: 0.35 })
  const steel = mat('#b8bcc2', { metalness: 0.85, roughness: 0.3 })

  // TT motors with their wheels, gearboxes reaching back under the plate.
  // The bench model's shaft runs along its x with the wheel on +x; the
  // right one is mirrored so both gearboxes point backwards.
  const motors = {}
  for (const side of ['left', 'right']) {
    const model = carPart('ttMotor', `motor-${side}`)
    const holder = new THREE.Group()
    holder.add(model.group)
    if (side === 'right') model.group.scale.x = -1
    holder.rotation.y = Math.PI / 2
    holder.position.set(0, 0, (side === 'left' ? -1 : 1) * 4.14)
    car.add(holder)
    motors[side] = model
  }

  // Swivel caster under the back on four brass spacers. The swivelling
  // part turns about the vertical pivot; the wheel trails behind and rolls.
  for (const [x, z] of [[-11.5, 1.2], [-11.5, -1.2], [-12.7, 1.2], [-12.7, -1.2]]) car.add(cylinder(0.22, 1.6, brass, x, plateBottom - 0.8, z, 6))
  car.add(box(2.4, 0.15, 2.4, steel, CASTER.x, plateBottom - 1.65, 0))
  const swivel = new THREE.Group()
  swivel.position.set(CASTER.x, 0, 0)
  const forkTop = plateBottom - 2.1
  swivel.add(cylinder(0.6, 0.35, steel, 0, forkTop + 0.2, 0, 16))
  for (const z of [0.55, -0.55]) swivel.add(box(1.0, forkTop - CASTER.radius, 0.12, steel, -CASTER.trail / 2, (forkTop + CASTER.radius) / 2, z))
  const casterWheel = new THREE.Group()
  casterWheel.position.set(-CASTER.trail, CASTER.radius, 0)
  const tyre = cylinder(CASTER.radius, 0.9, mat('#e5e7eb', { roughness: 0.6 }), 0, 0, 0, 24)
  tyre.rotation.x = Math.PI / 2
  casterWheel.add(tyre, box(CASTER.radius * 1.3, 0.18, 0.92, '#9ca3af'))
  swivel.add(casterWheel)
  car.add(swivel)

  // 4×AA holder on top at the back, the 9 V battery strapped under the
  // plate between the motors, and the rocker switch.
  const pack = carPart('battery', 'pil')
  pack.group.position.set(-8.3, plateTop, 0)
  pack.group.rotation.y = Math.PI / 2
  car.add(pack.group)
  const nineVolt = buildNineVolt()
  nineVolt.rotation.z = Math.PI
  nineVolt.position.set(-4.6, plateBottom, 0)
  car.add(nineVolt)
  car.add(box(0.6, 0.12, 2.9, '#111111', -5.2, plateBottom - 1.76, 0)) // strap
  const black = mat('#151515', { roughness: 0.7 })
  car.add(box(1.5, 0.9, 1.0, black, -4.8, plateTop + 0.45, 4.1), box(0.7, 0.35, 0.8, '#262626', -4.6, plateTop + 1.05, 4.1))

  // L298N with its power terminals towards the battery, its logic header
  // towards the Uno and the motor terminals to each side.
  const driver = carPart('motorDriver', 'driver')
  driver.group.rotation.y = -Math.PI / 2
  driver.group.position.set(-1.5, plateTop + 0.4, 0)
  car.add(driver.group)
  for (const [x, z] of [[-3.4, 1.9], [-3.4, -1.9], [0.4, 1.9], [0.4, -1.9]]) car.add(cylinder(0.18, 0.4, brass, x, plateTop + 0.2, z, 6))

  // The kit's Uno clone, across the plate at the front, USB and jack to the right.
  const uno = buildUnoClone()
  uno.setPower?.({ usb: false, battery: false })
  uno.group.traverse((child) => {
    if (child.userData?.kind === 'pin') child.visible = false
  })
  uno.group.rotation.y = Math.PI / 2
  uno.group.position.set(3.5, plateTop + 0.5, 0)
  car.add(uno.group)
  for (const [x, z] of [[1.2, 2.8], [1.2, -2.8], [5.8, 2.8], [5.8, -2.8]]) car.add(cylinder(0.18, 0.5, brass, x, plateTop + 0.25, z, 6))

  // Wiring.
  const top = plateTop + 0.9
  // Battery pack to the L298N's +12V and GND, motors to OUT1–OUT4.
  car.add(wire([[-8.3, plateTop + 0.4, -3.1], [-6, top + 0.6, -2.2], [-3.4, top + 0.2, 0.5]], '#c81e1e'))
  car.add(wire([[-8.0, plateTop + 0.4, -3.1], [-5.6, top + 0.4, -1.6], [-3.4, top + 0.2, 0]], '#141416'))
  for (const sign of [-1, 1]) {
    car.add(wire([[-6.1, WHEEL_RADIUS * CM - 0.3, sign * 4.0], [-4.5, plateBottom - 0.3, sign * 1.5], [-1.0, plateBottom + 0.2, sign * 0.6], [-1.5, top, sign * 1.85]], '#c81e1e'))
    car.add(wire([[-6.1, WHEEL_RADIUS * CM - 0.6, sign * 4.3], [-4.2, plateBottom - 0.4, sign * 1.8], [-0.6, plateBottom + 0.2, sign * 0.9], [-1.0, top, sign * 1.85]], '#141416'))
  }
  // 9 V snap to the Uno's barrel jack.
  car.add(wire([[-7.8, plateBottom - 0.6, 0.3], [-9, plateBottom + 0.3, 2.5], [-2, top + 0.4, 4.4], [1.5, plateTop + 1.1, 3.9]], '#c81e1e'))
  // Logic header (ENA, IN1–IN4, ENB) to the Uno's digital pins.
  const colours = ['#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899']
  colours.forEach((colour, i) => {
    car.add(wire([[0.5, plateTop + 0.75, -0.65 + i * 0.254], [1.4, top + 1.3, -1.2 + i * 0.5], [3.5 + 2.4, plateTop + 1.4, -2.5 + i * 0.6]], colour))
  })

  // KH-09 sensors standing on a cardboard bracket ahead of the plate, their
  // IR pairs looking down at the floor.
  const card = mat('#b98b55', { roughness: 0.95 })
  car.add(box(3.4, 0.25, 6.6, card, 7.4, plateTop + 0.12, 0))
  car.add(box(0.3, plateTop - 0.9, 6.6, card, 8.55, (plateTop + 0.9) / 2, 0))
  const sensorModels = {}
  for (const [side, z] of [['left', -2], ['center', 0], ['right', 2]]) {
    const model = carPart('irSensor', `ir-${side}`)
    const upright = new THREE.Group()
    model.group.rotation.x = Math.PI / 2 // its front (the IR pair) points down
    upright.add(model.group)
    upright.rotation.y = Math.PI / 2 // components facing forward
    upright.position.set(9 - 0.25, 2.0, z)
    car.add(upright)
    sensorModels[side] = model
    car.add(wire([[3.5 - 2.4, plateTop + 1.3, z * 0.6], [6.5, top + 0.8, z * 0.9], [8.9, 3.75, z]], colours[side === 'left' ? 0 : side === 'center' ? 2 : 4]))
  }
  car.traverse((child) => {
    if (child.isMesh) child.castShadow = true
  })
  return {
    car,
    spin(side, angle) {
      motors[side].wheel.rotation.x = angle
    },
    sense(side, black) {
      sensorModels[side].update(null, { black })
    },
    caster: { swivel, wheel: casterWheel },
  }
}

export class Car3D {
  constructor(container) {
    this.container = container
    this.renderer = new THREE.WebGLRenderer({ antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = true
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap
    this.renderer.outputColorSpace = THREE.SRGBColorSpace
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping
    container.appendChild(this.renderer.domElement)
    this.renderer.domElement.style.touchAction = 'none'

    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(45, 1, 1, 2000)
    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    // A short glide after letting go (about 0.3 s), not three.js's 1.5 s.
    this.controls.enableDamping = true
    this.controls.dampingFactor = 0.2
    this.controls.maxPolarAngle = Math.PI * 0.48
    this.controls.minDistance = 20
    this.controls.maxDistance = 600
    this.zoom = new SmoothZoom(this.controls, container, () => (this.dirty = true))
    this.clock = new THREE.Clock()
    this.controls.target.set(ARENA.width * 50, 0, ARENA.height * 50)

    this.scene.add(new THREE.HemisphereLight('#ffffff', '#94a3b8', 1.3))
    const sun = new THREE.DirectionalLight('#ffffff', 2)
    sun.position.set(60, 220, 90)
    sun.castShadow = true
    sun.shadow.mapSize.set(2048, 2048)
    Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 500 })
    sun.target.position.set(ARENA.width * 50, 0, ARENA.height * 50)
    this.scene.add(sun, sun.target)

    const room = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshStandardMaterial({ color: '#9aa7b0', roughness: 1 }))
    room.rotation.x = -Math.PI / 2
    room.position.set(ARENA.width * 50, -0.2, ARENA.height * 50)
    room.receiveShadow = true
    this.scene.add(room)

    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(ARENA.width * CM, ARENA.height * CM), new THREE.MeshStandardMaterial({ roughness: 0.85 }))
    this.floor.rotation.x = -Math.PI / 2
    this.floor.position.set((ARENA.width * CM) / 2, 0, (ARENA.height * CM) / 2)
    this.floor.receiveShadow = true
    this.scene.add(this.floor)
    const wallMaterial = mat('#cbd5e1')
    const walls = [
      [ARENA.width * CM + 4, 6, 2, (ARENA.width * CM) / 2, -1],
      [ARENA.width * CM + 4, 6, 2, (ARENA.width * CM) / 2, ARENA.height * CM + 1],
    ]
    for (const [w, h, d, x, z] of walls) this.scene.add(box(w, h, d, wallMaterial, x, h / 2, z))
    this.scene.add(box(2, 6, ARENA.height * CM, wallMaterial, -1, 3, (ARENA.height * CM) / 2))
    this.scene.add(box(2, 6, ARENA.height * CM, wallMaterial, ARENA.width * CM + 1, 3, (ARENA.height * CM) / 2))

    this.quality = 'high'
    this.buildCar()

    this.trailPoints = []
    this.trail = new THREE.Line(new THREE.BufferGeometry(), new THREE.LineBasicMaterial({ color: '#ef4444' }))
    // The trail's bounds change every frame; never cull it.
    this.trail.frustumCulled = false
    this.scene.add(this.trail)

    this.view = 'follow'
    this.setTrack('oval')
    this.setTheme(false)
    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    // Nothing is drawn while the view is scrolled out of sight.
    this.visible = true
    this.visibilityObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting
      this.dirty = true
    })
    this.visibilityObserver.observe(container)
    this.resize()
    this.renderer.setAnimationLoop(() => this.render())
  }

  buildCar() {
    if (this.car) {
      this.scene.remove(this.car)
      this.car.traverse((child) => child.geometry?.dispose())
    }
    const built = this.quality === 'low' ? buildSimpleCar() : buildDetailedCar()
    this.car = built.car
    this.parts = built
    this.scene.add(this.car)
    if (this.state) this.setState(this.state)
  }

  // 'high': the detailed kit with shadows at the screen's full sharpness.
  // 'low', for slow computers: the plain model, no shadows, fewer pixels.
  setQuality(quality) {
    if (quality === this.quality) return
    this.quality = quality
    const low = quality === 'low'
    this.renderer.setPixelRatio(low ? 1 : Math.min(window.devicePixelRatio, 2))
    this.renderer.shadowMap.enabled = !low
    this.scene.traverse((child) => {
      if (child.material) child.material.needsUpdate = true
    })
    this.buildCar()
    this.resize()
    this.dirty = true
  }

  setTheme(dark) {
    this.scene.background = new THREE.Color(dark ? '#0d1517' : '#dfe8ec')
    this.dirty = true
  }

  setTrack(track) {
    this.floor.material.map?.dispose()
    this.floor.material.map = trackTexture(track)
    this.floor.material.needsUpdate = true
    this.trailPoints = []
    const { points } = resolveTrack(track)
    const [x0, y0] = points[0]
    const [x1, y1] = points[3]
    this.setState({ pose: { x: x0 - 0.09 * Math.cos(Math.atan2(y1 - y0, x1 - x0)), y: y0 - 0.09 * Math.sin(Math.atan2(y1 - y0, x1 - x0)), heading: Math.atan2(y1 - y0, x1 - x0) }, sensors: {}, spin: { left: 0, right: 0 } })
  }

  setView(view) {
    this.view = view
    this.dirty = true
    this.controls.enabled = view === 'free'
    this.zoom.cancel()
    if (view === 'top') {
      this.camera.position.set(ARENA.width * 50, 230, ARENA.height * 50 + 1)
      this.controls.target.set(ARENA.width * 50, 0, ARENA.height * 50)
    } else if (view === 'free') {
      this.camera.position.set(ARENA.width * 50, 140, ARENA.height * 50 + 170)
      this.controls.target.set(ARENA.width * 50, 0, ARENA.height * 50)
    }
  }

  resize() {
    const { clientWidth, clientHeight } = this.container
    if (!clientWidth || !clientHeight) return
    this.renderer.setSize(clientWidth, clientHeight)
    this.camera.aspect = clientWidth / clientHeight
    this.camera.updateProjectionMatrix()
    this.dirty = true
  }

  clearTrail() {
    this.trailPoints = []
    this.dirty = true
  }

  setState(state) {
    this.state = state
    this.dirty = true
    if (!state?.pose) return
    const { x, y, heading } = state.pose
    this.car.position.set(x * CM, 0, y * CM)
    this.car.rotation.y = -heading
    this.parts.spin('left', state.spin?.left ?? 0)
    this.parts.spin('right', state.spin?.right ?? 0)
    for (const side of ['left', 'center', 'right']) this.parts.sense(side, Boolean(state.sensors?.[side]))
    this.moveCaster(x * CM, y * CM, heading)
    const last = this.trailPoints[this.trailPoints.length - 1]
    if (!last || Math.hypot(last.x - x * CM, last.z - y * CM) > 1) {
      this.trailPoints.push(new THREE.Vector3(x * CM, 0.15, y * CM))
      if (this.trailPoints.length > 1500) this.trailPoints.shift()
      this.trail.geometry.setFromPoints(this.trailPoints)
    }
  }

  // The free caster as a real one behaves: its wheel cannot slide sideways,
  // so when the pivot moves partly across the wheel's rolling direction the
  // fork swings round (by the sideways distance over the trail) until the
  // wheel trails behind the pivot; the distance along it turns the wheel.
  // Worked out from how far the pivot moved, in steps of at most 2 mm.
  moveCaster(x, y, heading) {
    const pivot = [x + CASTER.x * Math.cos(heading), y + CASTER.x * Math.sin(heading)]
    const caster = (this.caster ??= { angle: heading, roll: 0, last: null })
    if (caster.last) {
      const dx = pivot[0] - caster.last[0]
      const dy = pivot[1] - caster.last[1]
      const distance = Math.hypot(dx, dy)
      // A jump (reset, new track) puts the caster straight again.
      if (distance > 20) caster.angle = heading
      else {
        const steps = Math.max(1, Math.ceil(distance / 0.2))
        for (let i = 0; i < steps; i += 1) {
          const ux = Math.cos(caster.angle)
          const uy = Math.sin(caster.angle)
          const sx = dx / steps
          const sy = dy / steps
          caster.angle += (-uy * sx + ux * sy) / CASTER.trail
          caster.roll += (ux * sx + uy * sy) / CASTER.radius
        }
      }
    }
    caster.last = pivot
    if (!this.parts.caster) return
    // The fork's angle relative to the car; at rest straight behind.
    this.parts.caster.swivel.rotation.y = -(caster.angle - heading)
    this.parts.caster.wheel.rotation.z = -caster.roll
  }

  // Draws a frame only when the car, the camera or the view changed.
  render() {
    if (!this.visible) return
    let moving = false
    if (this.view === 'follow' && this.state?.pose) {
      const { heading } = this.state.pose
      const target = this.car.position.clone()
      const desired = target.clone().add(new THREE.Vector3(-Math.cos(heading) * 55, 38, -Math.sin(heading) * 55))
      // The chase camera eases in; it counts as moving until it arrives.
      moving = this.camera.position.distanceTo(desired) > 0.05
      this.camera.position.lerp(desired, 0.08)
      this.controls.target.lerp(target.add(new THREE.Vector3(Math.cos(heading) * 20, 0, Math.sin(heading) * 20)), 0.15)
    }
    if (this.zoom.update(Math.min(0.1, this.clock.getDelta()))) moving = true
    if (this.controls.update()) moving = true
    if (!moving && !this.dirty) return
    this.dirty = false
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.zoom.dispose()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
