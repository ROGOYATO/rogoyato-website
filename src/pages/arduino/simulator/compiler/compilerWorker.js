// Compiler worker: downloads the toolchain pack once (the browser caches it),
// then compiles sketches off the main thread. The library pack (cc1 and the
// AVR platform's libraries) and Library Manager libraries come only when a
// sketch needs them.
import { LibraryStore } from './libraries.js'
import { Toolchain, unpack } from './toolchain.js'

const TOOLS = ['cc1plus', 'avr-as', 'avr-ld', 'avr-objcopy']
let ready = null
let store = null

async function factory(files, tool) {
  const script = URL.createObjectURL(new Blob([files.get(`/tools/${tool}.mjs`)], { type: 'text/javascript' }))
  return (await import(/* @vite-ignore */ script)).default
}

async function download(url) {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Derleyici indirilemedi (HTTP ${response.status}).`)
  const total = Number(response.headers.get('Content-Length')) || 0
  let loaded = 0
  const counted = response.body.pipeThrough(
    new TransformStream({
      transform(chunk, controller) {
        loaded += chunk.byteLength
        self.postMessage({ type: 'progress', loaded, total })
        controller.enqueue(chunk)
      },
    }),
  )
  const bytes = new Uint8Array(await new Response(counted).arrayBuffer())
  // Some servers already undo the gzip (Content-Encoding); only gunzip if needed.
  if (bytes[0] !== 0x1f || bytes[1] !== 0x8b) return bytes
  return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).arrayBuffer())
}

async function load(url) {
  const files = unpack(await download(url))
  const factories = {}
  for (const tool of TOOLS) factories[tool] = await factory(files, tool)
  self.postMessage({ type: 'progress', preparing: true })
  const toolchain = new Toolchain(files, factories)
  await toolchain.init()
  return toolchain
}

self.onmessage = async ({ data }) => {
  try {
    ready ??= load(data.packUrl)
    const toolchain = await ready
    store ??= new LibraryStore({
      indexUrl: data.indexUrl,
      onProgress: ({ library, version }) => self.postMessage({ type: 'progress', library: `${library} ${version} indiriliyor` }),
      loadPack: async () => {
        self.postMessage({ type: 'progress', library: 'C derleyicisi ve Arduino kütüphaneleri indiriliyor' })
        const files = unpack(await download(data.libraryPackUrl))
        await toolchain.useTool('cc1', await factory(files, 'cc1'), files.get('/tools/cc1.wasm'))
        return files
      },
    })
    if (data.type === 'alternatives') {
      self.postMessage({ type: 'result', id: data.id, result: await store.alternatives(data.header) })
    } else if (data.type === 'build') {
      const started = performance.now()
      const result = await toolchain.build(data.code, {
        store,
        prefer: data.prefer ?? {},
        onStep: ({ library, done, total }) => self.postMessage({ type: 'progress', library: `${library} derleniyor (${done + 1}/${total})` }),
      })
      self.postMessage({ type: 'result', id: data.id, result: { ...result, seconds: (performance.now() - started) / 1000 } })
    } else {
      self.postMessage({ type: 'result', id: data.id, result: { ok: true } })
    }
  } catch (error) {
    ready = null
    self.postMessage({ type: 'result', id: data.id, result: { ok: false, unavailable: true, errors: String(error?.message ?? error) } })
  }
}
