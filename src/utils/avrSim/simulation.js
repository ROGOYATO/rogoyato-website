// Runs a compiled sketch against a wired circuit (and optionally the robot
// car). Free of DOM code so it can run in a Web Worker or in Node tests.
import { resolveCar, resolveCircuit } from './catalog.js'
import { RobotCar } from './car.js'
import { createPart } from './parts.js'
import { ArduinoUno, CLOCK_HZ } from './uno.js'

const STANDARD_BAUDS = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 31250, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000]

const MAX_STEP_S = 0.05

export class Simulation {
  constructor({ hex, circuit, carCircuit = null, track = 'oval', onSerial = () => {} }) {
    this.uno = new ArduinoUno(hex)
    this.uno.usart.onByteTransmit = (byte) => onSerial(byte)
    this.parts = new Map()
    this.issues = []

    if (circuit) {
      const { engineParts, issues } = resolveCircuit(circuit)
      this.issues.push(...issues)
      for (const spec of engineParts) this.parts.set(spec.id, createPart(this.uno, spec))
    }
    if (carCircuit) {
      const { pins, issues } = resolveCar(carCircuit)
      this.issues.push(...issues)
      this.car = new RobotCar(this.uno, pins, track)
    }
    this.simSeconds = 0
  }

  setInput(partId, key, value) {
    const part = this.parts.get(partId)
    if (part) {
      part.input[key] = value
      return
    }
    // Bare tact buttons have no engine part of their own; the net solver
    // closes them.
    const solver = this.parts.get('__nets')
    if (solver) solver.buttons[partId] = { ...solver.buttons[partId], [key]: value }
  }

  // Bytes typed into the Serial Monitor, delivered at the UART's baud rate.
  sendSerial(text) {
    this.serialQueue = (this.serialQueue ?? []).concat([...new TextEncoder().encode(text)])
  }

  feedSerial() {
    if (!this.serialQueue?.length || this.uno.usart.rxBusy) return
    this.uno.usart.writeByte(this.serialQueue.shift())
  }

  // Advance by up to `seconds` of simulated time, then sample every part.
  step(seconds) {
    const span = Math.min(MAX_STEP_S, Math.max(0, seconds))
    const slices = Math.max(1, Math.round(span / 0.002))
    for (let i = 0; i < slices; i += 1) {
      this.feedSerial()
      this.uno.run(Math.round((span / slices) * CLOCK_HZ))
    }
    this.simSeconds += span
    const sample = this.uno.sampleWindow()
    const parts = {}
    for (const [id, part] of this.parts) {
      part.update(sample)
      if (id === '__nets') {
        for (const [led, brightness] of Object.entries(part.state.leds ?? {})) parts[led] = { brightness }
        for (const [button, pressed] of Object.entries(part.state.buttons ?? {})) parts[button] = { pressed }
        parts.__nets = { shorted: part.state.shorted }
      } else {
        parts[id] = { ...part.state }
      }
    }
    return {
      parts,
      car: this.car ? this.car.state : null,
      simSeconds: this.simSeconds,
      pins: sample.duty,
      baud: this.baud(),
    }
  }

  // The rate the sketch set with Serial.begin(), or null before it. The UART
  // only gets close to it (9600 comes out as 9615), so the nearest standard
  // rate within 3% is reported.
  baud() {
    const { usart } = this.uno
    if (!usart.txEnable && !usart.rxEnable) return null
    const actual = usart.baudRate
    const standard = STANDARD_BAUDS.find((rate) => Math.abs(actual - rate) / rate < 0.03)
    return standard ?? actual
  }
}
