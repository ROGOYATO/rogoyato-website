import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_SERIAL_CHARS = 20_000

// Owns the simulation worker. 3D views get every frame through
// subscribe(); React state (HUD, Serial Monitor) updates a few times a second.
export default function useSimulator({ sound }) {
  const workerRef = useRef(null)
  const listeners = useRef(new Set())
  const latest = useRef(null)
  const serialBuffer = useRef('')
  const lastHud = useRef(0)
  const audio = useRef({ context: null, voices: new Map() })
  const soundRef = useRef(sound)
  const [running, setRunning] = useState(false)
  const [hud, setHud] = useState(null)
  const [serial, setSerial] = useState('')
  const [issues, setIssues] = useState([])
  const [runtimeError, setRuntimeError] = useState(null)

  useEffect(() => {
    soundRef.current = sound
  }, [sound])

  const playBuzzers = useCallback((parts) => {
    const state = audio.current
    if (!state.context) return
    const active = new Set()
    if (soundRef.current) {
      for (const [id, part] of Object.entries(parts ?? {})) {
        if (!part.on) continue
        active.add(id)
        let voice = state.voices.get(id)
        if (!voice) {
          const oscillator = state.context.createOscillator()
          const gain = state.context.createGain()
          oscillator.type = 'square'
          gain.gain.value = 0.035
          oscillator.connect(gain).connect(state.context.destination)
          oscillator.start()
          voice = { oscillator, gain }
          state.voices.set(id, voice)
        }
        voice.oscillator.frequency.setTargetAtTime(Math.min(8000, Math.max(40, part.frequency)), state.context.currentTime, 0.005)
      }
    }
    for (const [id, voice] of state.voices) {
      if (!active.has(id)) {
        voice.oscillator.stop()
        voice.oscillator.disconnect()
        state.voices.delete(id)
      }
    }
  }, [])

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: 'stop' })
    workerRef.current?.terminate()
    workerRef.current = null
    setRunning(false)
    playBuzzers({})
    latest.current = null
    for (const listener of listeners.current) listener(null)
  }, [playBuzzers])

  const start = useCallback(
    ({ hex, circuit, carCircuit, track, inputs }) => {
      workerRef.current?.terminate()
      setRuntimeError(null)
      setSerial('')
      serialBuffer.current = ''
      if (!audio.current.context && typeof AudioContext !== 'undefined') {
        // Created inside the click that starts the run, as browsers require.
        audio.current.context = new AudioContext()
      }
      audio.current.context?.resume?.()
      const worker = new Worker(new URL('../../../utils/avrSim/simWorker.js', import.meta.url), { type: 'module' })
      worker.onmessage = ({ data }) => {
        if (data.type === 'issues') setIssues(data.issues)
        else if (data.type === 'error') {
          setRuntimeError(data.message)
          stop()
        } else if (data.type === 'frame') {
          const snapshot = { ...data.snapshot, serialActive: Boolean(data.serial) }
          latest.current = snapshot
          for (const listener of listeners.current) listener(snapshot)
          playBuzzers(snapshot.parts)
          if (data.serial) {
            serialBuffer.current = (serialBuffer.current + data.serial).slice(-MAX_SERIAL_CHARS)
          }
          const now = performance.now()
          if (now - lastHud.current > 120) {
            lastHud.current = now
            setHud({ ...snapshot, speed: data.speed })
            setSerial(serialBuffer.current)
          }
        }
      }
      worker.postMessage({ type: 'start', hex, circuit, carCircuit, track, inputs })
      workerRef.current = worker
      setRunning(true)
    },
    [playBuzzers, stop],
  )

  // A sketch left running in a background tab is paused (and its buzzers
  // silenced) until the tab is shown again.
  useEffect(() => {
    const onVisibility = () => {
      const hidden = document.visibilityState === 'hidden'
      workerRef.current?.postMessage({ type: hidden ? 'pause' : 'resume' })
      if (hidden) playBuzzers({})
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [playBuzzers])

  useEffect(() => () => {
    workerRef.current?.terminate()
    for (const voice of audio.current.voices.values()) voice.oscillator.stop()
    audio.current.context?.close?.()
  }, [])

  const post = useCallback((message) => workerRef.current?.postMessage(message), [])

  return {
    running,
    hud,
    serial,
    issues,
    setIssues,
    runtimeError,
    start,
    stop,
    clearSerial: () => {
      serialBuffer.current = ''
      setSerial('')
    },
    setInput: (part, key, value) => post({ type: 'input', part, key, value }),
    sendSerial: (text) => post({ type: 'serial', text }),
    resetCar: () => post({ type: 'resetCar' }),
    // The Uno's reset button: setup() runs again, nothing is recompiled.
    resetBoard: () => post({ type: 'reset' }),
    setTrack: (track) => post({ type: 'setTrack', track }),
    subscribe: useCallback((listener) => {
      listeners.current.add(listener)
      listener(latest.current)
      return () => listeners.current.delete(listener)
    }, []),
  }
}
