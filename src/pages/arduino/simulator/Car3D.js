// 3D view of the line-following car on its track. Scene units are
// centimetres; the simulation works in metres.
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { ARENA, TRACKS, WHEEL_RADIUS } from '../../../utils/avrSim/car'
import { box, cylinder, mat } from './models'

const CM = 100

function trackTexture(trackId) {
  const scale = 10 // px per cm
  const canvas = document.createElement('canvas')
  canvas.width = ARENA.width * CM * scale
  canvas.height = ARENA.height * CM * scale
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#f4f4f0'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  const points = TRACKS[trackId].points
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

function buildCar() {
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
  car.traverse((child) => {
    if (child.isMesh) child.castShadow = true
  })
  return { car, wheels, sensors }
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
    this.controls.enableDamping = true
    this.controls.maxPolarAngle = Math.PI * 0.48
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

    const built = buildCar()
    this.car = built.car
    this.wheels = built.wheels
    this.sensorLeds = built.sensors
    this.scene.add(this.car)

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

  setTheme(dark) {
    this.scene.background = new THREE.Color(dark ? '#0d1517' : '#dfe8ec')
    this.dirty = true
  }

  setTrack(trackId) {
    this.trackId = trackId
    this.floor.material.map?.dispose()
    this.floor.material.map = trackTexture(trackId)
    this.floor.material.needsUpdate = true
    this.trailPoints = []
    const [x0, y0] = TRACKS[trackId].points[0]
    const [x1, y1] = TRACKS[trackId].points[3]
    this.setState({ pose: { x: x0 - 0.09 * Math.cos(Math.atan2(y1 - y0, x1 - x0)), y: y0 - 0.09 * Math.sin(Math.atan2(y1 - y0, x1 - x0)), heading: Math.atan2(y1 - y0, x1 - x0) }, sensors: {}, spin: { left: 0, right: 0 } })
  }

  setView(view) {
    this.view = view
    this.dirty = true
    this.controls.enabled = view === 'free'
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
    this.wheels.left.rotation.z = -(state.spin?.left ?? 0)
    this.wheels.right.rotation.z = -(state.spin?.right ?? 0)
    for (const side of ['left', 'center', 'right']) {
      // The KH-09's own LED lights over the white floor.
      this.sensorLeds[side].material.emissiveIntensity = state.sensors?.[side] ? 0 : 2.4
    }
    const last = this.trailPoints[this.trailPoints.length - 1]
    if (!last || Math.hypot(last.x - x * CM, last.z - y * CM) > 1) {
      this.trailPoints.push(new THREE.Vector3(x * CM, 0.15, y * CM))
      if (this.trailPoints.length > 1500) this.trailPoints.shift()
      this.trail.geometry.setFromPoints(this.trailPoints)
    }
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
    if (this.controls.update()) moving = true
    if (!moving && !this.dirty) return
    this.dirty = false
    this.renderer.render(this.scene, this.camera)
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.visibilityObserver.disconnect()
    this.controls.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }
}
