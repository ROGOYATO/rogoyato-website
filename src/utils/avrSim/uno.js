// An Arduino Uno: ATmega328P at 16 MHz running a compiled .hex with avr8js.
// Pins use Arduino numbering: 0-13 are D0-D13, 14-19 are A0-A5.
import {
  AVRADC,
  AVRClock,
  AVREEPROM,
  AVRIOPort,
  AVRSPI,
  AVRTWI,
  AVRTimer,
  AVRUSART,
  AVRWatchdog,
  CPU,
  EEPROMMemoryBackend,
  PinState,
  adcConfig,
  avrInstruction,
  clockConfig,
  eepromConfig,
  portBConfig,
  portCConfig,
  portDConfig,
  spiConfig,
  timer0Config,
  timer1Config,
  timer2Config,
  twiConfig,
  usart0Config,
  watchdogConfig,
} from 'avr8js'

export const CLOCK_HZ = 16_000_000
export const CYCLES_PER_US = CLOCK_HZ / 1_000_000
export { PinState }

export function loadHex(source, target) {
  for (const line of source.split('\n')) {
    if (line[0] !== ':' || line.substr(7, 2) !== '00') continue
    const bytes = Number.parseInt(line.substr(1, 2), 16)
    const address = Number.parseInt(line.substr(3, 4), 16)
    for (let i = 0; i < bytes; i += 1) {
      target[address + i] = Number.parseInt(line.substr(9 + i * 2, 2), 16)
    }
  }
}

export function pinLabel(pin) {
  return pin >= 14 ? `A${pin - 14}` : `D${pin}`
}

export class ArduinoUno {
  constructor(hex) {
    const program = new Uint16Array(0x8000 / 2)
    loadHex(hex, new Uint8Array(program.buffer))
    this.cpu = new CPU(program)
    this.timers = [new AVRTimer(this.cpu, timer0Config), new AVRTimer(this.cpu, timer1Config), new AVRTimer(this.cpu, timer2Config)]
    this.portB = new AVRIOPort(this.cpu, portBConfig)
    this.portC = new AVRIOPort(this.cpu, portCConfig)
    this.portD = new AVRIOPort(this.cpu, portDConfig)
    this.usart = new AVRUSART(this.cpu, usart0Config, CLOCK_HZ)
    this.adc = new AVRADC(this.cpu, adcConfig)
    // The rest of the chip, so libraries using them run: I2C (nothing
    // answers on the bus), SPI (reads 0), EEPROM and the watchdog.
    this.twi = new AVRTWI(this.cpu, twiConfig, CLOCK_HZ)
    this.spi = new AVRSPI(this.cpu, spiConfig, CLOCK_HZ)
    this.eeprom = new AVREEPROM(this.cpu, new EEPROMMemoryBackend(1024), eepromConfig)
    this.clock = new AVRClock(this.cpu, CLOCK_HZ, clockConfig)
    this.watchdog = new AVRWatchdog(this.cpu, watchdogConfig, this.clock)

    // Edge and duty-cycle bookkeeping per pin, used by LEDs, servos, sensors.
    this.levels = new Array(20).fill(false)
    this.lastEdge = new Array(20).fill(0)
    this.highCycles = new Array(20).fill(0)
    this.risingEdges = new Array(20).fill(0)
    this.lastRise = new Array(20).fill(0)
    this.period = new Array(20).fill(0)
    this.lastFall = new Array(20).fill(0)
    this.periodDuty = new Array(20).fill(0)
    this.windowStart = 0
    this.edgeListeners = new Map()
    this.modes = new Array(20).fill(PinState.Input)
    this.modeListeners = new Map()

    for (const port of [this.portB, this.portC, this.portD]) {
      port.addListener(() => this.scanPort(port))
    }
  }

  locate(pin) {
    if (pin <= 7) return { port: this.portD, bit: pin }
    if (pin <= 13) return { port: this.portB, bit: pin - 8 }
    return { port: this.portC, bit: pin - 14 }
  }

  pinsOf(port) {
    if (port === this.portD) return [0, 1, 2, 3, 4, 5, 6, 7]
    if (port === this.portB) return [8, 9, 10, 11, 12, 13]
    return [14, 15, 16, 17, 18, 19]
  }

  // The voltage level a part connected to this pin would see (driven HIGH by
  // the chip). Input pins report false.
  isHigh(pin) {
    const { port, bit } = this.locate(pin)
    return port.pinState(bit) === PinState.High
  }

  mode(pin) {
    const { port, bit } = this.locate(pin)
    return port.pinState(bit)
  }

  // Drive an input pin from outside (button, sensor output).
  setInput(pin, high) {
    const { port, bit } = this.locate(pin)
    port.setPin(bit, high)
  }

  setAnalogVolts(pin, volts) {
    if (pin >= 14) this.adc.channelValues[pin - 14] = Math.min(5, Math.max(0, volts))
  }

  scanPort(port) {
    const now = this.cpu.cycles
    for (const pin of this.pinsOf(port)) {
      const mode = this.mode(pin)
      if (mode !== this.modes[pin]) {
        this.modes[pin] = mode
        const listeners = this.modeListeners.get(pin)
        if (listeners) for (const listener of listeners) listener(mode, now)
      }
      const high = this.isHigh(pin)
      if (high === this.levels[pin]) continue
      if (this.levels[pin]) this.highCycles[pin] += now - Math.max(this.lastEdge[pin], this.windowStart)
      else {
        this.risingEdges[pin] += 1
        if (this.lastRise[pin]) {
          this.period[pin] = now - this.lastRise[pin]
          this.periodDuty[pin] = Math.max(0, this.lastFall[pin] - this.lastRise[pin]) / this.period[pin]
        }
        this.lastRise[pin] = now
      }
      if (!high) this.lastFall[pin] = now
      this.levels[pin] = high
      this.lastEdge[pin] = now
      const listeners = this.edgeListeners.get(pin)
      if (listeners) for (const listener of listeners) listener(high, now)
    }
  }

  onEdge(pin, listener) {
    if (!this.edgeListeners.has(pin)) this.edgeListeners.set(pin, new Set())
    this.edgeListeners.get(pin).add(listener)
  }

  // Called when the sketch changes a pin between OUTPUT/INPUT/INPUT_PULLUP
  // or writes it HIGH/LOW (PinState.High/Low/Input/InputPullUp).
  onMode(pin, listener) {
    if (!this.modeListeners.has(pin)) this.modeListeners.set(pin, new Set())
    this.modeListeners.get(pin).add(listener)
  }

  // Fraction of the last window the pin spent HIGH (PWM brightness, motor
  // speed) and how many rising edges it had (tone frequency).
  sampleWindow() {
    const now = this.cpu.cycles
    const span = Math.max(1, now - this.windowStart)
    const duty = []
    const frequency = []
    for (let pin = 0; pin < 20; pin += 1) {
      let high = this.highCycles[pin]
      if (this.levels[pin]) high += now - Math.max(this.lastEdge[pin], this.windowStart)
      duty[pin] = Math.min(1, high / span)
      // Use the time between rising edges; counting edges in one short
      // window would be too coarse for audio tones.
      frequency[pin] = this.risingEdges[pin] && this.period[pin] ? CLOCK_HZ / this.period[pin] : 0
      this.highCycles[pin] = 0
      this.risingEdges[pin] = 0
    }
    this.windowStart = now
    return { duty, frequency, seconds: span / CLOCK_HZ }
  }

  // Duty of the most recent PWM period, or the steady level once the pin
  // has stopped toggling. Used where a part reacts faster than a frame.
  dutyNow(pin) {
    const quietFor = this.cpu.cycles - this.lastEdge[pin]
    if (!this.period[pin] || quietFor > Math.max(2 * this.period[pin], 4 * CYCLES_PER_US * 1000)) return this.levels[pin] ? 1 : 0
    return this.periodDuty[pin]
  }

  run(cycles) {
    const { cpu } = this
    const end = cpu.cycles + cycles
    while (cpu.cycles < end) {
      avrInstruction(cpu)
      cpu.tick()
    }
  }

  get micros() {
    return this.cpu.cycles / CYCLES_PER_US
  }
}
