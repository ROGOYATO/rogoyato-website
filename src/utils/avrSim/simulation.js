// Runs a compiled sketch against a wired circuit (and optionally the robot
// car). Free of DOM code so it can run in a Web Worker or in Node tests.
import { SEGMENT_NAMES, resolveCar, resolveCircuit } from './catalog.js'
import { RobotCar } from './car.js'
import { createPart } from './parts.js'
import { ArduinoUno, CLOCK_HZ } from './uno.js'

const STANDARD_BAUDS = [300, 600, 1200, 2400, 4800, 9600, 14400, 19200, 28800, 31250, 38400, 57600, 74880, 115200, 230400, 250000, 500000, 1000000, 2000000]

const MAX_STEP_S = 0.05

export class Simulation {
  constructor({ hex, circuit, carCircuit = null, track = 'oval', onSerial = () => {} }) {
    this.config = { hex, onSerial, track }
    this.issues = []
    this.inputs = {} // every input set so far, replayed after a reset
    this.resetHeld = false
    if (circuit) {
      const { engineParts, issues, aref } = resolveCircuit(circuit)
      this.issues.push(...issues)
      Object.assign(this.config, { engineParts, aref })
    }
    if (carCircuit) {
      const { pins, issues } = resolveCar(carCircuit)
      this.issues.push(...issues)
      this.config.carPins = pins
    }
    this.boot()
    // A board powered up with RESET already LOW never starts.
    this.resetHeld = this.heldInReset(this.uno.sampleWindow())
    this.simSeconds = 0
  }

  heldInReset(sample) {
    const solver = this.parts.get('__nets')
    if (!solver) return false
    solver.update(sample)
    return Boolean(solver.state.resetHeld)
  }

  // A fresh chip (all pins inputs, program from the start) with the same
  // parts around it, as after power-up or a reset.
  boot() {
    const { hex, onSerial, engineParts = [], aref = 5, carPins, track } = this.config
    this.uno = new ArduinoUno(hex)
    this.uno.usart.onByteTransmit = (byte) => onSerial(byte)
    this.uno.adc.aref = aref
    this.parts = new Map()
    for (const spec of engineParts) this.parts.set(spec.id, createPart(this.uno, spec))
    if (carPins) this.car = new RobotCar(this.uno, carPins, track)
    for (const [partId, values] of Object.entries(this.inputs)) {
      for (const [key, value] of Object.entries(values)) this.applyInput(partId, key, value)
    }
  }

  setInput(partId, key, value) {
    this.inputs[partId] = { ...this.inputs[partId], [key]: value }
    this.applyInput(partId, key, value)
  }

  applyInput(partId, key, value) {
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
    this.received = true // lights the RX LED
  }

  // Advance by up to `seconds` of simulated time, then sample every part.
  // While RESET is held LOW the chip does nothing; when it goes HIGH again
  // the program starts over.
  step(seconds) {
    const span = Math.min(MAX_STEP_S, Math.max(0, seconds))
    const slices = Math.max(1, Math.round(span / 0.002))
    this.received = false
    if (!this.resetHeld) {
      for (let i = 0; i < slices; i += 1) {
        this.feedSerial()
        this.uno.run(Math.round((span / slices) * CLOCK_HZ))
      }
    }
    this.simSeconds += span
    const sample = this.uno.sampleWindow()
    const parts = {}
    for (const [id, part] of this.parts) {
      part.update(sample)
      if (id === '__nets') {
        for (const [led, brightness] of Object.entries(part.state.leds ?? {})) parts[led] = { brightness }
        for (const [button, pressed] of Object.entries(part.state.buttons ?? {})) parts[button] = { pressed }
        for (const [buzzer, state] of Object.entries(part.state.buzzers ?? {})) parts[buzzer] = state
        // An RGB LED as { red, green, blue }, a display as { segments }.
        for (const [id, levels] of Object.entries(part.state.channels ?? {})) {
          parts[id] = 'red' in levels ? levels : { segments: SEGMENT_NAMES.map((_, channel) => levels[channel] ?? 0) }
        }
        parts.__nets = { shorted: part.state.shorted }
      } else {
        parts[id] = { ...part.state }
      }
    }
    const held = Boolean(this.parts.get('__nets')?.state?.resetHeld)
    if (held && !this.resetHeld) this.boot()
    this.resetHeld = held
    return {
      parts,
      serialRx: this.received,
      resetHeld: held,
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
