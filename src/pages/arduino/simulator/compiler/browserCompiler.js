// Main-thread side of the in-browser compiler: one long-lived worker, so the
// toolchain is downloaded and compiled to machine code only once per visit.
import libraryPackUrl from './libraries.pack.gz?url'
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
    const at = (path) => new URL(path, window.location.href).href
    getWorker().postMessage({
      ...message,
      id,
      packUrl: at(packUrl),
      libraryPackUrl: at(libraryPackUrl),
      // The Library Manager index, cut down at deploy (scripts/build-library-index.mjs).
      indexUrl: at(`${import.meta.env.BASE_URL}arduino-libraries.json`),
    })
  })
}

// progress: { loaded, total } while downloading, { preparing: true } after,
// { library: "Name 1.2.3" } while a library is fetched.
export function onCompilerProgress(listener) {
  progressListeners.add(listener)
  return () => progressListeners.delete(listener)
}

// Starts the download early (when the student begins editing).
export const preloadCompiler = () => (browserCompilerSupported() ? send({ type: 'load' }) : Promise.resolve({ ok: false }))

// prefer: { header: library name } when the user picked another library.
export const compileInBrowser = (code, prefer = {}) => send({ type: 'build', code, prefer })

// Other Library Manager libraries that provide a header: [{ name, version }].
export const libraryAlternatives = (header) => send({ type: 'alternatives', header })
