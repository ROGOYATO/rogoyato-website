// Runs the simulated Uno off the main thread so the 3D view stays smooth.
// Messages in:  start {hex, circuit, carCircuit, track}, input {part, key, value},
//               serial {text}, resetCar, setTrack {track}, pause, resume, stop
// Messages out: frame {snapshot, serial, speed}, issues {issues}, error {message}
import { Simulation } from './simulation.js'

let simulation = null
let timer = null
let last = 0
let serial = ''
// Sketches print UTF-8 (Turkish letters are two bytes), like the real
// Serial Monitor decode the byte stream rather than byte by byte.
let decoder = new TextDecoder()

function loop() {
  const now = performance.now()
  const realSeconds = (now - last) / 1000
  last = now
  try {
    const before = simulation.simSeconds
    const snapshot = simulation.step(realSeconds)
    const simulated = simulation.simSeconds - before
    self.postMessage({ type: 'frame', snapshot, serial, speed: realSeconds > 0 ? simulated / realSeconds : 1 })
    serial = ''
  } catch (error) {
    self.postMessage({ type: 'error', message: String(error?.message ?? error) })
    stop()
    return
  }
  timer = setTimeout(loop, 16)
}

function stop() {
  clearTimeout(timer)
  timer = null
  simulation = null
}

self.onmessage = ({ data }) => {
  switch (data.type) {
    case 'start':
      stop()
      decoder = new TextDecoder()
      serial = ''
      try {
        simulation = new Simulation({
          hex: data.hex,
          circuit: data.circuit,
          carCircuit: data.carCircuit,
          track: data.track,
          onSerial: (byte) => {
            serial += decoder.decode(new Uint8Array([byte]), { stream: true })
          },
        })
      } catch (error) {
        self.postMessage({ type: 'error', message: String(error?.message ?? error) })
        return
      }
      for (const [part, inputs] of Object.entries(data.inputs ?? {})) {
        for (const [key, value] of Object.entries(inputs)) simulation.setInput(part, key, value)
      }
      self.postMessage({ type: 'issues', issues: simulation.issues })
      last = performance.now()
      timer = setTimeout(loop, 0)
      break
    case 'input':
      simulation?.setInput(data.part, data.key, data.value)
      break
    case 'serial':
      simulation?.sendSerial(data.text)
      break
    case 'resetCar':
      simulation?.car?.reset()
      break
    case 'setTrack':
      simulation?.car?.setTrack(data.track)
      break
    // While the page is hidden the Uno is frozen (simulated time stops too)
    // instead of keeping a CPU core busy.
    case 'pause':
      clearTimeout(timer)
      timer = null
      break
    case 'resume':
      if (simulation && !timer) {
        last = performance.now()
        timer = setTimeout(loop, 0)
      }
      break
    case 'stop':
      stop()
      break
    default:
      break
  }
}
