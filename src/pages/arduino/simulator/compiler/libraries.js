// Arduino libraries for the browser compiler. When a sketch (or a library)
// includes a header that the core and the preinstalled libraries lack, it
// gets the library that provides it: one of the AVR platform's own (Wire,
// SPI, SoftwareSerial, EEPROM, HID, from libraries.pack.gz) or one from the
// Library Manager, downloaded from downloads.arduino.cc as the IDE does.
// Downloads stay in the browser's cache. Runs in a Web Worker or in Node.
import { DOWNLOADS, FULL_INDEX, compactIndex, findLibrary, librariesFor } from './libraryIndex.js'
import { unzip } from './zip.js'

const SOURCE = /\.(c|cpp|cc|cxx|S)$/
const CACHE = 'arduino-libraries-v1'
const OBJECT_CACHE = 'arduino-library-objects-v1'
const TRIES = 5 // candidates downloaded for one header before giving up
const squash = (text) => text.toLowerCase().replace(/[^a-z0-9]/g, '')

// Where a library's headers and sources are (Arduino library specification):
// a "1.5" library keeps them under src/ (compiled recursively); an older one
// is flat: its own folder and utility/ are compiled, and any subfolder may
// hold headers it includes by relative path. files: Map of paths relative
// to the library's folder; dependencies: library names from the index.
export function layout(name, version, files, source, dependencies = []) {
  const at = `/libs-src/${squash(name)}`
  const modern = [...files.keys()].some((path) => path.startsWith('src/'))
  const kept = [...files].filter(([path]) => (modern ? path.startsWith('src/') : !/^(examples|extras|docs?|tests?)\//i.test(path)))
  const mounted = kept.map(([path, data]) => [`${at}/${path}`, data])
  const compiled = (path) => (modern ? true : !path.includes('/') || path.startsWith('utility/'))
  const includeDirs = modern ? [`${at}/src`] : [at, `${at}/utility`]
  const paths = new Set(mounted.map(([path]) => path))
  return {
    name,
    version,
    source, // 'platform' or 'manager'
    dependencies,
    files: mounted,
    includeDirs,
    sources: kept.filter(([path]) => SOURCE.test(path) && compiled(path)).map(([path]) => `${at}/${path}`),
    has: (header) => includeDirs.some((dir) => paths.has(`${dir}/${header}`)),
  }
}

// The library's own folder inside a zip: where library.properties is (zips
// hold "Name-1.2.3/…"), else the single top folder.
function libraryFolder(entries) {
  const properties = [...entries.keys()].filter((path) => /(^|\/)library\.properties$/.test(path)).sort((a, b) => a.length - b.length)[0]
  const prefix = properties ? properties.slice(0, -'library.properties'.length) : ''
  if (properties || !entries.size) return prefix
  const tops = new Set([...entries.keys()].map((path) => path.split('/')[0]))
  return tops.size === 1 && [...entries.keys()].every((path) => path.includes('/')) ? `${[...tops][0]}/` : ''
}

export class LibraryStore {
  // loadPack(): Map of libraries.pack.gz; indexUrl: the site's compact index;
  // onProgress({ library, version }) while downloading.
  constructor({ loadPack, indexUrl, onProgress = () => {} }) {
    this.loadPack = loadPack
    this.indexUrl = indexUrl
    this.onProgress = onProgress
    this.pack = null
    this.entries = null
    this.loaded = new Map() // "name@version" -> layout
    this.chosen = new Map() // header -> layout
  }

  async platform() {
    this.pack ??= this.loadPack()
    return this.pack
  }

  async index() {
    this.entries ??= (async () => {
      try {
        const response = await fetch(this.indexUrl)
        if (response.ok) return await response.json()
      } catch {
        // Not deployed (development): use the Library Manager's own index.
      }
      const response = await fetch(FULL_INDEX)
      if (!response.ok) throw new Error(`Kütüphane listesi indirilemedi (HTTP ${response.status}).`)
      const text = await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text()
      return compactIndex(JSON.parse(text))
    })().catch((error) => {
      this.entries = null
      throw error
    })
    return this.entries
  }

  async download(entry) {
    const url = DOWNLOADS + entry[2]
    const cache = typeof caches === 'undefined' ? null : await caches.open(CACHE).catch(() => null)
    let response = await cache?.match(url)
    if (!response) {
      this.onProgress({ library: entry[0], version: entry[1] })
      response = await fetch(url)
      if (!response.ok) throw new Error(`${entry[0]} ${entry[1]} indirilemedi (HTTP ${response.status}).`)
      await cache?.put(url, response.clone()).catch(() => {})
    }
    return new Uint8Array(await response.arrayBuffer())
  }

  async fromManager(entry) {
    const key = `${entry[0]}@${entry[1]}`
    if (!this.loaded.has(key)) {
      const zip = await unzip(await this.download(entry))
      const folder = libraryFolder(zip)
      const files = new Map([...zip].filter(([path]) => path.startsWith(folder)).map(([path, data]) => [path.slice(folder.length), data]))
      this.loaded.set(key, layout(entry[0], entry[1], files, 'manager', entry[4]))
    }
    return this.loaded.get(key)
  }

  async fromPlatform(header) {
    const pack = await this.platform()
    const names = new Set([...pack.keys()].filter((path) => path.startsWith('/platform-libraries/')).map((path) => path.split('/')[2]))
    for (const name of names) {
      const key = `${name}@platform`
      if (!this.loaded.has(key)) {
        const prefix = `/platform-libraries/${name}/`
        const files = new Map([...pack].filter(([path]) => path.startsWith(prefix)).map(([path, data]) => [path.slice(prefix.length), data]))
        const version = new TextDecoder().decode(files.get('library.properties') ?? new Uint8Array()).match(/^version=(.*)$/m)?.[1]?.trim() ?? ''
        this.loaded.set(key, layout(name, version, files, 'platform'))
      }
      if (this.loaded.get(key).has(header)) return this.loaded.get(key)
    }
    return null
  }

  // The library for a header, or null. prefer: { header: library name } the
  // user picked when several libraries provide the same header.
  async resolve(header, prefer = {}) {
    if (this.chosen.has(header) && !prefer[header]) return this.chosen.get(header)
    let library = prefer[header] ? null : await this.fromPlatform(header)
    if (!library) {
      const entries = await this.index()
      const preferred = prefer[header] ? findLibrary(entries, prefer[header]) : null
      // The libraries already in use declare what they depend on (Adafruit
      // GFX needs Adafruit BusIO for Adafruit_I2CDevice.h, which the index
      // does not say).
      const dependencies = [...this.chosen.values()]
        .flatMap((used) => used.dependencies)
        .map((name) => findLibrary(entries, name))
        .filter(Boolean)
      // A library the user picked is used or reported, never swapped silently.
      if (preferred) {
        const picked = await this.fromManager(preferred)
        if (!picked.has(header)) throw new Error(`${picked.name} ${picked.version} kütüphanesinde “${header}” dosyası yok; başka bir kütüphane seçin ya da seçimi sıfırlayın.`)
        this.chosen.set(header, picked)
        return picked
      }
      const ranked = librariesFor(entries, header)
      const candidates = [...new Set([preferred, ...dependencies.filter((entry) => ranked.includes(entry)), ...ranked, ...dependencies].filter(Boolean))].slice(0, TRIES + dependencies.length)
      for (const entry of candidates) {
        const candidate = await this.fromManager(entry)
        if (candidate.has(header)) {
          library = candidate
          break
        }
      }
    }
    if (library) this.chosen.set(header, library)
    return library
  }

  // Compiled library files, kept in the browser between visits (FastLED
  // takes a couple of minutes the first time).
  async objectCache() {
    if (typeof caches === 'undefined') return null
    this.objects ??= caches.open(OBJECT_CACHE).catch(() => null)
    return this.objects
  }

  async savedObject(key) {
    const response = await (await this.objectCache())?.match(`https://objects.invalid/${encodeURIComponent(key)}`)
    return response ? new Uint8Array(await response.arrayBuffer()) : null
  }

  async saveObject(key, bytes) {
    await (await this.objectCache())?.put(`https://objects.invalid/${encodeURIComponent(key)}`, new Response(bytes)).catch(() => {})
  }

  // Other libraries that also provide a header, for the "change" choice.
  async alternatives(header) {
    const entries = await this.index()
    return librariesFor(entries, header)
      .slice(0, 8)
      .map(([name, version]) => ({ name, version }))
  }
}
