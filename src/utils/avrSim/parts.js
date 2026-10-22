// Electronic parts wired to the simulated Uno. Each part reads the pins the
// chip drives and/or drives the pins the chip reads, with the same timing
// the real part has, so unmodified Arduino libraries work against them.
import { CYCLES_PER_US, PinState } from './uno.js'

class Part {
  constructor(uno, config) {
    this.uno = uno
    this.config = config
    this.input = {}
    this.state = {}
  }

  // Called once per animation frame with the PWM/edge statistics.
  update() {}
}

// A LED wired straight to 5 V (constant) simply stays lit.
class Led extends Part {
  update(sample) {
    const { pin, constant } = this.config
    this.state = { brightness: pin === undefined ? (constant ?? 0) : sample.duty[pin] }
  }
}

class RgbLed extends Part {
  update(sample) {
    const { r, g, b } = this.config
    this.state = { red: sample.duty[r], green: sample.duty[g], blue: sample.duty[b] }
  }
}

// Push button between the pin and either 5 V (with the module's pull-down
// resistor: pressed reads HIGH) or GND (pressed reads LOW, and the sketch
// needs INPUT_PULLUP, otherwise the released pin floats and reads noise).
class Button extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { pressed: false }
  }

  update() {
    const { pin, toward = 'vcc' } = this.config
    let level
    if (toward === 'vcc') {
      level = this.input.pressed
    } else if (this.input.pressed) {
      level = false
    } else {
      level = this.uno.mode(pin) === PinState.InputPullUp ? true : Math.random() < 0.5
    }
    this.uno.setInput(pin, level)
    this.state = { pressed: this.input.pressed }
  }
}

class Potentiometer extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { value: 512 }
  }

  update() {
    // With the outer legs swapped (5 V and GND reversed) the reading flips.
    const fraction = this.input.value / 1023
    this.uno.setAnalogVolts(this.config.pin, (this.config.inverted ? 1 - fraction : fraction) * 5)
  }
}

// LDR in a divider with a 10 kΩ resistor: more light, lower LDR resistance,
// higher voltage on the analog pin.
class Ldr extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { light: 50 }
  }

  update() {
    const lux = 10 ** (this.input.light / 25) // 1 .. 100 000 lux
    const ldrOhms = 50_000 * lux ** -0.7 + 100
    this.uno.setAnalogVolts(this.config.pin, (5 * 10_000) / (10_000 + ldrOhms))
  }
}

class Buzzer extends Part {
  update(sample) {
    const { pin, constant } = this.config
    if (pin === undefined) {
      this.state = { on: constant === 1, frequency: 2300 }
      return
    }
    const toggling = sample.frequency[pin] > 30
    // An active buzzer beeps at its own pitch whenever its pin is HIGH;
    // tone() toggles the pin, and then the pitch follows the toggling.
    const on = toggling || sample.duty[pin] > 0.5
    this.state = { on, frequency: toggling ? sample.frequency[pin] : 2300 }
  }
}

// Standard hobby servo: 544–2400 µs pulse maps to 0–180°, the same range the
// Arduino Servo library uses.
class ServoMotor extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.state = { angle: 90 }
    this.riseAt = 0
    uno.onEdge(config.pin, (high, cycles) => {
      if (high) {
        this.riseAt = cycles
      } else if (this.riseAt) {
        const us = (cycles - this.riseAt) / CYCLES_PER_US
        if (us >= 400 && us <= 2600) {
          this.target = Math.min(180, Math.max(0, ((us - 544) * 180) / (2400 - 544)))
        }
      }
    })
  }

  update(sample) {
    if (this.target === undefined) return
    // The horn turns at about 0.12 s per 60° (SG90), not instantly.
    const maxStep = (60 / 0.12) * sample.seconds
    const delta = this.target - this.state.angle
    this.state = { angle: this.state.angle + Math.max(-maxStep, Math.min(maxStep, delta)) }
  }
}

// HC-SR04: a ≥10 µs HIGH pulse on TRIG makes ECHO go HIGH for the sound's
// round trip (58 µs per cm). Out of range gives a ~38 ms pulse.
class Ultrasonic extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { distance: 50 }
    this.riseAt = 0
    this.busy = false
    uno.setInput(config.echo, false)
    uno.onEdge(config.trig, (high, cycles) => {
      if (high) {
        this.riseAt = cycles
        return
      }
      if (this.busy || cycles - this.riseAt < 10 * CYCLES_PER_US) return
      this.busy = true
      const distance = this.input.distance
      const echoUs = distance >= 2 && distance <= 400 ? distance * 58.3 : 38_000
      uno.cpu.addClockEvent(() => {
        uno.setInput(config.echo, true)
        uno.cpu.addClockEvent(() => {
          uno.setInput(config.echo, false)
          this.busy = false
        }, Math.round(echoUs * CYCLES_PER_US))
      }, 460 * CYCLES_PER_US)
    })
  }
}

// DHT11 single-wire protocol: after the chip holds the line LOW for ≥18 ms
// and releases it, the sensor answers 80 µs LOW, 80 µs HIGH, then 40 bits
// (50 µs LOW, then 26 µs HIGH for 0 or 70 µs HIGH for 1).
class Dht11 extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { temperature: 24, humidity: 45 }
    this.lowSince = null
    this.responding = false
    uno.setInput(config.pin, true)
    // React the moment the chip releases the line; the library starts
    // timing the answer about 55 µs later.
    uno.onMode(config.pin, (mode, cycles) => {
      if (mode === PinState.Low) {
        this.lowSince = cycles
      } else if (this.lowSince !== null) {
        const heldUs = (cycles - this.lowSince) / CYCLES_PER_US
        this.lowSince = null
        if (heldUs >= 1000 && !this.responding && (mode === PinState.Input || mode === PinState.InputPullUp)) this.respond()
      }
    })
  }

  respond() {
    this.responding = true
    const { uno } = this
    const { pin } = this.config
    const humidity = Math.round(Math.min(95, Math.max(5, this.input.humidity)))
    const temperature = Math.round(Math.min(50, Math.max(0, this.input.temperature)))
    const data = [humidity, 0, temperature, 0]
    data.push(data.reduce((sum, value) => sum + value, 0) & 0xff)

    const steps = [[false, 80], [true, 80]]
    for (const byte of data) {
      for (let bit = 7; bit >= 0; bit -= 1) {
        steps.push([false, 50], [true, (byte >> bit) & 1 ? 70 : 26])
      }
    }
    steps.push([false, 50])

    let index = 0
    const nextStep = () => {
      if (index === steps.length) {
        uno.setInput(pin, true)
        this.responding = false
        return
      }
      const [level, us] = steps[index]
      index += 1
      uno.setInput(pin, level)
      uno.cpu.addClockEvent(nextStep, us * CYCLES_PER_US)
    }
    uno.cpu.addClockEvent(nextStep, 30 * CYCLES_PER_US)
  }
}

const SEGMENTS = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'dp']

// Common-cathode display: a segment lights while its pin is HIGH.
class SevenSegment extends Part {
  update(sample) {
    this.state = { segments: SEGMENTS.map((name) => (this.config[name] === undefined ? 0 : sample.duty[this.config[name]])) }
  }
}

// KH-09 / FC-51 style IR module: output goes LOW when the IR light comes back
// (white surface or an obstacle) and stays HIGH over a black line.
class IrSensor extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.input = { black: false }
  }

  update() {
    this.uno.setInput(this.config.pin, this.input.black)
    this.state = { black: this.input.black }
  }
}

// L298N dual H-bridge. Without a pin on ENA/ENB the module's jumper keeps the
// motor enabled at full speed, like the real board.
export function motorOutput(sample, uno, enable, forward, backward) {
  const enableDriven = enable !== undefined && [PinState.Low, PinState.High].includes(uno.mode(enable))
  const speed = enableDriven ? sample.duty[enable] : 1
  const direction = (sample.duty[forward] > 0.5 ? 1 : 0) - (sample.duty[backward] > 0.5 ? 1 : 0)
  return direction * speed
}

class MotorDriver extends Part {
  update(sample) {
    const { ena, in1, in2, enb, in3, in4 } = this.config
    this.state = {
      left: motorOutput(sample, this.uno, ena, in1, in2),
      right: motorOutput(sample, this.uno, enb, in3, in4),
    }
  }
}

// Bare components on a breadboard: resistors, tact buttons and LEDs. Each
// frame it finds the voltage of every net: driven nets (5 V, GND, an OUTPUT
// pin and its PWM duty) first, then nets reached through resistors (pull-up,
// pull-down, dividers, by Millman's theorem), and leaves the rest floating.
// It drives the Uno's input pins from that and lights the LEDs that are
// forward-biased.
class NetSolver extends Part {
  constructor(uno, config) {
    super(uno, config)
    this.buttons = {}
  }

  update(sample) {
    const { switches, resistors, leds, netInfo, moduleDriven } = this.config
    const uno = this.uno
    const parent = {}
    const find = (key) => {
      if (parent[key] === undefined) parent[key] = key
      while (parent[key] !== key) key = parent[key] = parent[parent[key]]
      return key
    }
    for (const sw of switches) if (this.buttons[sw.part]?.pressed) parent[find(sw.a)] = find(sw.b)

    const groups = {}
    for (const [net, info] of Object.entries(netInfo)) {
      const group = (groups[find(net)] ??= { io: [], vcc: false, gnd: false, v33: false, reset: false })
      group.io.push(...info.io)
      group.vcc ||= info.vcc
      group.v33 ||= info.v33
      group.gnd ||= info.gnd
      group.reset ||= info.reset
    }

    const driven = {}
    const shorts = []
    for (const [key, group] of Object.entries(groups)) {
      const outputs = group.io.filter((pin) => [PinState.High, PinState.Low].includes(uno.mode(pin)))
      if (group.vcc && group.gnd) shorts.push(key)
      if (group.vcc) driven[key] = 1
      else if (group.gnd) driven[key] = 0
      else if (group.v33) driven[key] = 3.3 / 5
      else if (outputs.length) driven[key] = sample.duty[outputs[0]]
      // An OUTPUT pin set HIGH straight into GND (or LOW into 5 V) is a short too.
      if ((group.vcc || group.gnd) && outputs.some((pin) => uno.mode(pin) === (group.gnd ? PinState.High : PinState.Low))) shorts.push(key)
    }

    const level = (key) => {
      if (driven[key] !== undefined) return driven[key]
      let conductance = 0
      let current = 0
      for (const r of resistors) {
        const a = find(r.a)
        const b = find(r.b)
        const other = a === key ? b : b === key ? a : null
        if (other !== null && other !== key && driven[other] !== undefined) {
          conductance += 1 / r.ohms
          current += driven[other] / r.ohms
        }
      }
      for (const pin of groups[key]?.io ?? []) {
        if (uno.mode(pin) === PinState.InputPullUp) {
          conductance += 1 / 35_000
          current += 1 / 35_000
        }
      }
      // The Uno pulls RESET up to 5 V through 10 kΩ.
      if (groups[key]?.reset) {
        conductance += 1 / 10_000
        current += 1 / 10_000
      }
      return conductance ? current / conductance : null
    }

    for (const [key, group] of Object.entries(groups)) {
      const value = level(key)
      for (const pin of group.io) {
        const mode = uno.mode(pin)
        if (moduleDriven.includes(pin) || (mode !== PinState.Input && mode !== PinState.InputPullUp)) continue
        if (value === null) {
          uno.setInput(pin, Math.random() < 0.5) // floating input picks up noise
        } else {
          uno.setInput(pin, value > 0.5)
          if (pin >= 14) uno.setAnalogVolts(pin, value * 5)
        }
      }
    }

    const ledStates = {}
    for (const led of leds) {
      const anode = level(find(led.anode))
      const cathode = level(find(led.cathode))
      ledStates[led.part] = anode === null || cathode === null ? 0 : Math.max(0, Math.min(1, anode - cathode))
    }
    const buttonStates = Object.fromEntries(switches.map((sw) => [sw.part, Boolean(this.buttons[sw.part]?.pressed)]))
    const resetHeld = Object.entries(groups).some(([key, group]) => group.reset && level(key) < 0.5)
    this.state = { leds: ledStates, buttons: buttonStates, shorted: shorts.length > 0, resetHeld }
  }
}

export const PART_TYPES = {
  led: Led,
  rgbLed: RgbLed,
  button: Button,
  potentiometer: Potentiometer,
  ldr: Ldr,
  buzzer: Buzzer,
  servo: ServoMotor,
  ultrasonic: Ultrasonic,
  dht11: Dht11,
  sevenSegment: SevenSegment,
  irSensor: IrSensor,
  motorDriver: MotorDriver,
  netSolver: NetSolver,
}

export function createPart(uno, spec) {
  const Type = PART_TYPES[spec.type]
  const part = new Type(uno, spec.pins)
  part.spec = spec
  return part
}
