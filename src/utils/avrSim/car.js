// A 2WD line-following robot driven by the simulated Uno through an L298N,
// with three KH-09 IR sensors looking at a black-tape track. Units are
// metres, seconds and radians. Physics runs every 1 ms of simulated time so
// the sketch's control loop sees the sensors change at its real speed.
import { CYCLES_PER_US, PinState } from './uno.js'

const STEP_S = 0.001
// The 2WD kit's TT gear motor: 6 V, 250 rpm unloaded, 66 mm wheels
// (Elektronikport's kit page). It runs from the kit's 4×AA pack: 6 V on
// the label, but alkaline cells give about 1.3 V each while the motors
// draw their half an ampere or so, 5.2 V in all. The L298N's two
// transistors in series drop about 1.8 V, so at full PWM the motor gets
// about 3.4 V. Against its gearbox it needs about 1.2 V to turn at all
// (below ~35% PWM it stands still), and carrying the robot costs it some
// 15% of its speed: at full PWM the robot does about 0.35 m/s.
const BATTERY_VOLTS = 5.2
const L298N_DROP_VOLTS = 1.8
const MOTOR = { ratedVolts: 6, ratedRpm: 250, startVolts: 1.2 }
const LOADED = 0.85
const MOTOR_LAG_S = 0.12
const RIGHT_MOTOR_GAIN = 0.97 // no two motors are identical
const WHEEL_TRACK = 0.13
const SENSOR_AHEAD = 0.09
const SENSOR_SPACING = 0.02
const LINE_WIDTH = 0.019 // black electrical tape
export const ARENA = { width: 2.4, height: 1.7 }
export const CAR_SIZE = { length: 0.2, width: 0.14 }
export const WHEEL_RADIUS = 0.033

// Lays out a track the way real line-follower tracks are built: straights
// and arcs of a known radius. ['S', metres] or ['A', radius, degrees], where
// positive degrees turn right.
function buildTrack(start, headingDegrees, segments) {
  let [x, y] = start
  let heading = (headingDegrees * Math.PI) / 180
  const points = [[x, y]]
  for (const [kind, a, b] of segments) {
    if (kind === 'S') {
      const steps = Math.max(1, Math.round(a / 0.01))
      for (let i = 0; i < steps; i += 1) {
        x += (Math.cos(heading) * a) / steps
        y += (Math.sin(heading) * a) / steps
        points.push([x, y])
      }
    } else {
      const turn = (b * Math.PI) / 180
      const steps = Math.max(2, Math.round((Math.abs(turn) * a) / 0.01))
      const chord = (Math.abs(turn) * a) / steps
      for (let i = 0; i < steps; i += 1) {
        heading += turn / steps
        x += Math.cos(heading - turn / steps / 2) * chord
        y += Math.sin(heading - turn / steps / 2) * chord
        points.push([x, y])
      }
    }
  }
  points.pop() // the loop ends where it started
  return points
}

function oval() {
  const points = []
  for (let i = 0; i < 360; i += 1) {
    const a = (i / 360) * Math.PI * 2
    points.push([1.0 + 0.72 * Math.cos(a), 0.7 + 0.45 * Math.sin(a)])
  }
  return points
}

// A figure of eight: the line crosses itself at right angles in the middle,
// where the robot has to keep straight on.
function figureEight() {
  const points = []
  for (let i = 0; i < 480; i += 1) {
    const a = (i / 480) * Math.PI * 2
    points.push([1.0 + 0.8 * Math.cos(a), 0.7 + 0.45 * Math.sin(2 * a)])
  }
  return points
}

// Moves a track to the middle of the arena.
function centered(points) {
  const xs = points.map(([x]) => x)
  const ys = points.map(([, y]) => y)
  const dx = ARENA.width / 2 - (Math.min(...xs) + Math.max(...xs)) / 2
  const dy = ARENA.height / 2 - (Math.min(...ys) + Math.max(...ys)) / 2
  return points.map(([x, y]) => [x + dx, y + dy])
}

// The competition's three tracks, as printed (lengths of the two straights
// that close each loop worked out to 0.01 mm). Orta and zor are printed
// standing up; here they lie a quarter turn round to fit the arena.
const COMPETITION = {
  kolay: { name: 'Yarışma: Kolay', heading: 0, segments: [['S', 1.24], ['A', 0.2, -90], ['S', 0.55], ['A', 0.2, -90], ['S', 0.3], ['A', 0.16, -90], ['S', 0.3], ['A', 0.16, 180], ['S', 0.3], ['A', 0.16, -90], ['S', 0.3], ['A', 0.2, -90], ['S', 0.55], ['A', 0.2, -90]] },
  orta: { name: 'Yarışma: Orta', heading: -90, segments: [['S', 1.05], ['A', 0.15, 90], ['S', 1.3], ['A', 0.15, 90], ['S', 0.35], ['A', 0.09, 60], ['A', 0.09, -120], ['A', 0.09, 60], ['S', 0.15], ['A', 0.15, 90], ['S', 0.12], ['A', 0.15, 90], ['S', 0.6], ['A', 0.13, -180], ['S', 0.6], ['A', 0.13, 180], ['S', 0.6], ['A', 0.13, -180], ['S', 0.83823], ['A', 0.15, 90], ['S', 0.1], ['A', 0.15, 90]] },
  zor: { name: 'Yarışma: Zor (kesişmeli)', heading: -90, segments: [['S', 0.35], ['A', 0.14, -270], ['S', 0.28], ['A', 0.14, -90], ['S', 0.25], ['A', 0.12, 90], ['S', 0.1], ['A', 0.04, 45], ['S', 0.28], ['A', 0.04, -45], ['S', 0.84544], ['A', 0.12, 90], ['S', 0.2], ['A', 0.08, 60], ['A', 0.08, -120], ['A', 0.08, 60], ['S', 0.06], ['A', 0.08, 60], ['A', 0.08, -120], ['A', 0.08, 60], ['S', 0.1], ['A', 0.12, 90], ['S', 0.08], ['A', 0.12, 90], ['S', 0.55], ['A', 0.11, -180], ['S', 0.55], ['A', 0.11, 180], ['S', 0.55], ['A', 0.11, -180], ['S', 0.55], ['A', 0.11, 180], ['S', 0.55], ['A', 0.11, -180], ['S', 0.01432], ['A', 0.12, 90], ['S', 0.06], ['A', 0.12, 90]] },
}

export const TRACKS = {
  ...Object.fromEntries(Object.entries(COMPETITION).map(([id, { name, heading, segments }]) => [id, { name, points: centered(buildTrack([0, 0], heading, segments)) }])),
  oval: { name: 'Oval', points: centered(oval()) },
  sekiz: { name: 'Sekiz (kesişmeli)', points: centered(figureEight()) },
  race: {
    name: 'Yarış parkuru',
    points: centered(buildTrack([0.65, 0.27], 0, [
      ['S', 0.95], ['A', 0.22, 90], ['S', 0.18], ['A', 0.22, 90], ['S', 0.15], ['A', 0.15, -90], ['A', 0.15, 90],
      ['S', 0.65], ['A', 0.22, 90], ['S', 0.1], ['A', 0.15, 60], ['A', 0.15, -60], ['S', 0.12], ['A', 0.22, 90],
    ])),
  },
}

// A track by id, or one drawn by the student ({ name, points }).
export const resolveTrack = (track) => (typeof track === 'string' ? (TRACKS[track] ?? TRACKS.oval) : track)

// Turns a hand-drawn line (points in metres) into a closed track: kept off
// the arena's edges, joined back to where it started, smoothed and evenly
// spaced every centimetre like the built-in tracks. Null when too short.
export const MIN_DRAWN_LENGTH = 1.5
export function trackFromDrawing(raw) {
  const edge = 0.1
  const clamp = ([x, y]) => [Math.min(ARENA.width - edge, Math.max(edge, x)), Math.min(ARENA.height - edge, Math.max(edge, y))]
  const line = raw.map(clamp)
  if (line.length < 3) return null
  line.push(line[0])
  let length = 0
  for (let i = 1; i < line.length; i += 1) length += Math.hypot(line[i][0] - line[i - 1][0], line[i][1] - line[i - 1][1])
  if (length < MIN_DRAWN_LENGTH) return null
  const step = 0.01
  let points = [line[0]]
  let carried = 0
  for (let i = 1; i < line.length; i += 1) {
    const [ax, ay] = line[i - 1]
    const [bx, by] = line[i]
    const piece = Math.hypot(bx - ax, by - ay)
    let at = step - carried
    while (at <= piece) {
      points.push([ax + ((bx - ax) * at) / piece, ay + ((by - ay) * at) / piece])
      at += step
    }
    carried = piece - (at - step)
  }
  points.pop() // closes back onto the first point
  // A hand's wobble smoothed out: each point moves to the average of its
  // neighbours, a few times over, around the closed loop.
  const n = points.length
  for (let pass = 0; pass < 4; pass += 1) {
    points = points.map((_, i) => {
      let x = 0
      let y = 0
      for (let k = -4; k <= 4; k += 1) {
        const [px, py] = points[(i + k + n) % n]
        x += px
        y += py
      }
      return [x / 9, y / 9]
    })
  }
  return { name: 'Çizdiğim pist', points }
}

function distanceToTrack(points, x, y) {
  let best = Infinity
  let bestIndex = 0
  for (let i = 0; i < points.length; i += 1) {
    const [ax, ay] = points[i]
    const [bx, by] = points[(i + 1) % points.length]
    const dx = bx - ax
    const dy = by - ay
    const t = Math.max(0, Math.min(1, ((x - ax) * dx + (y - ay) * dy) / (dx * dx + dy * dy || 1)))
    const d = Math.hypot(x - (ax + t * dx), y - (ay + t * dy))
    if (d < best) {
      best = d
      bestIndex = i
    }
  }
  return { distance: best, index: bestIndex }
}

// Shaft speed for an L298N command (-1…1: direction times PWM duty).
export function motorRpm(command, load = LOADED) {
  const volts = Math.abs(command) * (BATTERY_VOLTS - L298N_DROP_VOLTS)
  if (volts <= MOTOR.startVolts) return 0
  return Math.sign(command) * load * MOTOR.ratedRpm * ((volts - MOTOR.startVolts) / (MOTOR.ratedVolts - MOTOR.startVolts))
}

export class RobotCar {
  // pins: { ena, in1, in2, enb, in3, in4, left, center, right }
  constructor(uno, pins, track = 'oval') {
    this.uno = uno
    this.pins = pins
    this.setTrack(track)
    this.tick = this.tick.bind(this)
    uno.cpu.addClockEvent(this.tick, STEP_S * 1e6 * CYCLES_PER_US)
  }

  setTrack(track) {
    this.track = resolveTrack(track)
    this.reset()
  }

  reset() {
    const [x0, y0] = this.track.points[0]
    const [x1, y1] = this.track.points[3]
    this.pose = { x: x0, y: y0, heading: Math.atan2(y1 - y0, x1 - x0) }
    // Start with the axle behind the start line so the sensors sit on it.
    this.pose.x -= Math.cos(this.pose.heading) * SENSOR_AHEAD
    this.pose.y -= Math.sin(this.pose.heading) * SENSOR_AHEAD
    this.wheel = { left: 0, right: 0 }
    this.spin = { left: 0, right: 0 }
    this.command = { left: 0, right: 0 }
    this.sensors = { left: false, center: true, right: false }
    this.trail = []
    this.crashed = false
    this.laps = 0
    this.lapTimes = []
    this.lastProgress = null
    this.lapStartUs = null
    this.time = 0
    this.applySensors()
  }

  motor(enable, forward, backward) {
    const { uno } = this
    const enableDriven = enable !== undefined && [PinState.Low, PinState.High].includes(uno.mode(enable))
    const speed = enableDriven ? uno.dutyNow(enable) : 1
    const direction = (uno.levels[forward] ? 1 : 0) - (uno.levels[backward] ? 1 : 0)
    return direction * speed
  }

  // Ground speed in m/s.
  wheelSpeed(command, gain) {
    return ((gain * motorRpm(command)) / 60) * 2 * Math.PI * WHEEL_RADIUS
  }

  sensorPoint(side) {
    const { x, y, heading } = this.pose
    const lateral = { left: -SENSOR_SPACING, center: 0, right: SENSOR_SPACING }[side]
    // The car's right-hand side points along (-sin, cos) because screen y
    // grows downwards; positive lateral is to the right.
    return [
      x + Math.cos(heading) * SENSOR_AHEAD - Math.sin(heading) * lateral,
      y + Math.sin(heading) * SENSOR_AHEAD + Math.cos(heading) * lateral,
    ]
  }

  applySensors() {
    for (const side of ['left', 'center', 'right']) {
      const [sx, sy] = this.sensorPoint(side)
      const black = distanceToTrack(this.track.points, sx, sy).distance < LINE_WIDTH / 2 + 0.002
      this.sensors[side] = black
      const pin = this.pins[side]
      // KH-09: HIGH over the black line, LOW over the white floor.
      if (pin !== undefined) this.uno.setInput(pin, black)
    }
  }

  tick() {
    const { pins } = this
    this.command = {
      left: this.motor(pins.ena, pins.in1, pins.in2),
      right: this.motor(pins.enb, pins.in3, pins.in4),
    }
    const blend = STEP_S / MOTOR_LAG_S
    this.wheel.left += (this.wheelSpeed(this.command.left, 1) - this.wheel.left) * blend
    this.wheel.right += (this.wheelSpeed(this.command.right, RIGHT_MOTOR_GAIN) - this.wheel.right) * blend

    if (!this.crashed) {
      this.spin.left += (this.wheel.left / WHEEL_RADIUS) * STEP_S
      this.spin.right += (this.wheel.right / WHEEL_RADIUS) * STEP_S
      const v = (this.wheel.left + this.wheel.right) / 2
      // Screen y grows downwards, so a faster left wheel turns clockwise.
      const omega = (this.wheel.left - this.wheel.right) / WHEEL_TRACK
      this.pose.heading += omega * STEP_S
      this.pose.x += Math.cos(this.pose.heading) * v * STEP_S
      this.pose.y += Math.sin(this.pose.heading) * v * STEP_S
      const margin = CAR_SIZE.width / 2
      if (this.pose.x < margin || this.pose.y < margin || this.pose.x > ARENA.width - margin || this.pose.y > ARENA.height - margin) {
        this.crashed = true
      }
    }

    this.time += STEP_S
    if (Math.round(this.time * 1000) % 20 === 0) this.recordProgress()
    this.applySensors()
    this.uno.cpu.addClockEvent(this.tick, STEP_S * 1e6 * CYCLES_PER_US)
  }

  recordProgress() {
    this.trail.push([this.pose.x, this.pose.y])
    if (this.trail.length > 800) this.trail.shift()
    const { distance, index } = distanceToTrack(this.track.points, this.pose.x, this.pose.y)
    if (distance > 0.12) return
    const progress = index / this.track.points.length
    // The car starts just behind the start line: the first forward crossing
    // starts the clock, every later one completes a lap. Reversing over the
    // line restarts the clock.
    if (this.lastProgress !== null && this.lastProgress > 0.85 && progress < 0.15) {
      const now = this.uno.micros
      if (this.lapStartUs !== null) {
        this.laps += 1
        this.lapTimes.push((now - this.lapStartUs) / 1e6)
      }
      this.lapStartUs = now
    } else if (this.lastProgress !== null && this.lastProgress < 0.15 && progress > 0.85) {
      this.lapStartUs = null
    }
    this.lastProgress = progress
  }

  get state() {
    return {
      pose: { ...this.pose },
      sensors: { ...this.sensors },
      command: { ...this.command },
      spin: { ...this.spin },
      speed: (this.wheel.left + this.wheel.right) / 2,
      crashed: this.crashed,
      laps: this.laps,
      lapTimes: [...this.lapTimes],
      currentLap: this.lapStartUs === null ? 0 : (this.uno.micros - this.lapStartUs) / 1e6,
    }
  }
}
