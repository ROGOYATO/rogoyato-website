// Main-thread side of the in-browser compiler: one long-lived worker, so the
// toolchain is downloaded and compiled to machine code only once per visit.
import packUrl from './toolchain.pack.gz?url'

let worker = null
let nextId = 1
const pending = new Map()
const progressListeners = new Set()

export const browserCompilerSupported = () =>
  typeof Worker !== 'undefined' && typeof WebAssembly !== 'undefined' && typeof DecompressionStream !== 'undefined'

function getWorker() {
  if (worker) return worker
  worker = new Worker(new URL('./compilerWorker.js', import.meta.url), { type: 'module' })
  worker.onmessage = ({ data }) => {
    if (data.type === 'progress') {
      for (const listener of progressListeners) listener(data)
      return
    }
    pending.get(data.id)?.(data.result)
    pending.delete(data.id)
  }
  worker.onerror = (event) => {
    for (const resolve of pending.values()) resolve({ ok: false, unavailable: true, errors: event.message || 'Derleyici başlatılamadı.' })
    pending.clear()
    worker.terminate()
    worker = null
  }
  return worker
}

function send(message) {
  const id = nextId++
  return new Promise((resolve) => {
    pending.set(id, resolve)
    getWorker().postMessage({ ...message, id, packUrl: new URL(packUrl, window.location.href).href })
  })
}

// progress: { loaded, total } while downloading, { preparing: true } after.
export function onCompilerProgress(listener) {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

// Starts the download early (when the student begins editing).
export const preloadCompiler = () => (browserCompilerSupported() ? send({ type: 'load' }) : Promise.resolve({ ok: false }))

export const compileInBrowser = (code) => send({ type: 'build', code })
