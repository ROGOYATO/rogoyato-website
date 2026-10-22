// Compiles a sketch with GCC and binutils built for WebAssembly:
// cc1plus -> avr-as -> avr-ld -> avr-objcopy, the same steps and flags the
// Arduino IDE uses for an Uno (minus link-time optimisation). Libraries the
// sketch includes are found like arduino-cli does (preprocess, add the
// library for a missing header, repeat) and compiled with it; cc1 compiles
// their C files. Each tool run gets a fresh Emscripten instance with an
// in-memory file system; the compiled WebAssembly is reused. Runs in a Web
// Worker or in Node.
import { findIncludes, preprocessSketch } from './preprocess.js'

const DEFINES = ['-D__AVR_ATmega328P__', '-D__AVR_DEVICE_NAME__=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10607', '-DARDUINO_AVR_UNO', '-DARDUINO_ARCH_AVR']
// What `avr-g++ -mmcu=atmega328p` hands cc1plus with the platform's flags.
const CC1PLUS = [
  '-quiet', '-imultilib', 'avr5', '-mn-flash=1', '-mno-skip-bug', '-mmcu=avr5', '-Os', '-w', '-Wno-error=narrowing', '-std=gnu++11', '-fpermissive',
  '-fno-exceptions', '-ffunction-sections', '-fdata-sections', '-fno-threadsafe-statics', '-fno-rtti', '-fno-enforce-eh-specs', '-fdiagnostics-color=never',
]
// What `avr-gcc -mmcu=atmega328p` hands cc1 for a C file with the platform's flags.
const CC1 = ['-quiet', '-imultilib', 'avr5', '-mn-flash=1', '-mno-skip-bug', '-mmcu=avr5', '-Os', '-w', '-std=gnu11', '-ffunction-sections', '-fdata-sections', '-fdiagnostics-color=never']
const SYSTEM = ['/sysroot/gcc/include', '/sysroot/gcc/include-fixed', '/sysroot/avr/include']
const INCLUDE = ['/build', '/arduino/core', '/arduino/variant', '/libraries/Servo', '/libraries/DHT', '/libraries/Adafruit_Sensor', '/libraries/EEPROM']
// A library is linked in only when the sketch includes one of its headers,
// as in the Arduino IDE (Servo brings a timer interrupt with it).
const LIBRARY_OBJECTS = {
  'Servo.h': ['/libs/Servo.o'],
  'DHT.h': ['/libs/DHT.o', '/libs/DHT_U.o', '/libs/Adafruit_Sensor.o'],
  'DHT_U.h': ['/libs/DHT.o', '/libs/DHT_U.o', '/libs/Adafruit_Sensor.o'],
  'Adafruit_Sensor.h': ['/libs/Adafruit_Sensor.o'],
}
// Part of the key compiled library objects are kept under; changes with the
// compiler or its flags.
const OBJECTS_VERSION = 'gcc-7.3.0-avr-builtins-1'
export const FLASH_BYTES = 32256 // 32 KB minus the Optiboot bootloader
export const RAM_BYTES = 2048

// The pack: u32 index length, JSON index { path: [offset, size] }, data.
export function unpack(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const length = view.getUint32(0, true)
  const index = JSON.parse(new TextDecoder().decode(bytes.subarray(4, 4 + length)))
  const files = new Map()
  for (const [path, [offset, size]] of Object.entries(index)) files.set(path, bytes.subarray(4 + length + offset, 4 + length + offset + size))
  return files
}

// Flash and RAM use from the ELF section headers, like avr-size.
function memoryUse(elf) {
  const view = new DataView(elf.buffer, elf.byteOffset, elf.byteLength)
  const shoff = view.getUint32(0x20, true)
  const shentsize = view.getUint16(0x2e, true)
  const shnum = view.getUint16(0x30, true)
  const strtab = view.getUint32(shoff + view.getUint16(0x32, true) * shentsize + 16, true)
  const sizes = {}
  for (let i = 0; i < shnum; i += 1) {
    const base = shoff + i * shentsize
    let nameAt = strtab + view.getUint32(base, true)
    let name = ''
    while (elf[nameAt]) name += String.fromCharCode(elf[nameAt++])
    sizes[name] = view.getUint32(base + 20, true)
  }
  const size = (name) => sizes[name] ?? 0
  return { flash: size('.text') + size('.data'), ram: size('.data') + size('.bss') + size('.noinit') }
}

export class Toolchain {
  // files: Map from unpack(); factories: Emscripten module factories by tool.
  constructor(files, factories) {
    this.files = files
    this.factories = factories
    this.modules = {}
  }

  // A tool that arrives later (cc1, with the library pack).
  async useTool(tool, factory, wasm) {
    this.factories[tool] = factory
    this.modules[tool] ??= await WebAssembly.compile(wasm)
  }

  // Compiling the tools' WebAssembly is the slow part of the first build.
  async init() {
    await Promise.all(
      Object.keys(this.factories).map(async (tool) => {
        this.modules[tool] ??= await WebAssembly.compile(this.files.get(`/tools/${tool}.wasm`))
      }),
    )
  }

  async run(tool, args, inputs, output) {
    const messages = []
    const module = this.modules[tool]
    const instance = await this.factories[tool]({
      noInitialRun: true,
      // ld looks for its default scripts in <program dir>/ldscripts/.
      thisProgram: `/${tool}`,
      locateFile: (path) => path,
      print: (line) => messages.push(line),
      printErr: (line) => messages.push(line),
      instantiateWasm(imports, done) {
        WebAssembly.instantiate(module, imports).then((result) => done(result, module))
        return {}
      },
    })
    instance.FS.mkdirTree('/build')
    for (const [path, data] of inputs) {
      instance.FS.mkdirTree(path.slice(0, path.lastIndexOf('/')) || '/')
      instance.FS.writeFile(path, data)
    }
    let status = 0
    try {
      status = instance.callMain(args) ?? 0
    } catch (error) {
      if (typeof error?.status !== 'number') throw error
      status = error.status
    }
    let result = null
    try {
      result = status === 0 ? instance.FS.readFile(output) : null
    } catch {
      result = null
    }
    return { result, messages }
  }

  under(...prefixes) {
    return [...this.files].filter(([path]) => prefixes.some((prefix) => path.startsWith(prefix)))
  }

  flags(dirs) {
    return [...DEFINES, ...SYSTEM.flatMap((dir) => ['-isystem', dir]), ...[...INCLUDE, ...dirs].flatMap((dir) => ['-I', dir])]
  }

  headers(extra) {
    return [...this.under('/sysroot/', '/arduino/', '/libraries/'), ...extra]
  }

  preinstalled(header) {
    return [...SYSTEM, ...INCLUDE].some((dir) => this.files.has(`${dir}/${header}`))
  }

  // The first header a file includes that cannot be found, or null.
  async missingHeader(path, data, dirs, extra) {
    const run = await this.run('cc1plus', ['-E', ...CC1PLUS, ...this.flags(dirs), path, '-o', '/build/pre.ii'], [...this.headers(extra), [path, data]], '/build/pre.ii')
    if (run.result) return null
    const text = run.messages.join('\n')
    const header = text.match(/fatal error: (?!opening )(.+?): No such file or directory/)?.[1]
    return header ? { header, text } : null
  }

  // One library file to an object: C++ with cc1plus, C with cc1, assembly
  // through cc1's preprocessor; then avr-as.
  async compileSource(path, data, dirs, extra) {
    const name = path.split('/').pop()
    const inputs = [...this.headers(extra), [path, data]]
    const tail = ['-dumpbase', name, '-auxbase-strip', '/build/object.o', '-o', '/build/object.s']
    let step
    if (/\.S$/.test(path)) {
      const args = ['-E', '-lang-asm', '-quiet', '-imultilib', 'avr5', ...this.flags(dirs), path, '-mn-flash=1', '-mno-skip-bug', '-mmcu=avr5', '-fno-directives-only', '-o', '/build/object.s']
      step = await this.run('cc1', args, inputs, '/build/object.s')
    } else if (/\.c$/.test(path)) step = await this.run('cc1', [...CC1, ...this.flags(dirs), path, ...tail], inputs, '/build/object.s')
    else step = await this.run('cc1plus', [...CC1PLUS, ...this.flags(dirs), path, ...tail], inputs, '/build/object.s')
    if (!step.result) return { errors: step.messages }
    const as = await this.run('avr-as', ['-mmcu=avr5', '-mno-skip-bug', '-o', '/build/object.o', '/build/object.s'], [['/build/object.s', step.result]], '/build/object.o')
    return as.result ? { object: as.result } : { errors: as.messages }
  }

  // Returns { ok: true, hex, flash, ram, libraries } or { ok: false, errors }.
  // store: a LibraryStore for headers beyond the preinstalled libraries;
  // prefer: { header: library name } chosen by the user; onStep({ library,
  // done, total }) while library files compile.
  async build(code, { store = null, prefer = {}, onStep = () => {} } = {}) {
    await this.init()
    const includes = findIncludes(code)
    const cpp = new TextEncoder().encode(preprocessSketch(code))
    const fail = (messages, fallback, hint = '') => {
      const text = messages
        .filter((line) => line.trim())
        .map((line) =>
          line
            .replace(/^\/avr-ld: /, '')
            .replace(/\/build\/sketch\.o/g, 'sketch.ino')
            .replace(/sketch\.ino\.cpp:\([^)]*\): /, '')
            .replace(/\/libs-src\//g, ''),
        )
        .join('\n')
      return { ok: false, errors: (text || fallback) + hint }
    }

    // The libraries, found the way arduino-cli does: preprocess each file
    // and, for a header that is missing, add the library that provides it.
    const used = [] // { library, header }
    const dirs = []
    const extra = []
    const queue = [['/build/sketch.ino.cpp', cpp]]
    for (let i = 0; i < queue.length; i += 1) {
      const [path, data] = queue[i]
      if (path.endsWith('.S')) continue
      // A sketch that only includes what is preinstalled needs no search.
      if (i === 0 && includes.every((header) => this.preinstalled(header))) continue
      for (;;) {
        const missing = await this.missingHeader(path, data, dirs, extra)
        if (!missing) break
        let library = null
        try {
          library = store ? await store.resolve(missing.header, prefer) : null
        } catch (error) {
          return fail([error.message], 'Kütüphane eklenemedi.')
        }
        if (!library || used.some((item) => item.library === library)) {
          const hint = store ? `\n“${missing.header}” dosyasını içeren bir kütüphane Arduino Library Manager’da bulunamadı.` : ''
          return fail([missing.text], 'Derleme başarısız oldu.', hint)
        }
        used.push({ library, header: missing.header })
        dirs.push(...library.includeDirs)
        extra.push(...library.files)
        for (const source of library.sources) queue.push([source, library.files.find(([file]) => file === source)[1]])
      }
    }
    for (const [, data] of queue.slice(1)) includes.push(...findIncludes(new TextDecoder().decode(data)))

    const args = [...CC1PLUS, ...this.flags(dirs)]
    args.push('/build/sketch.ino.cpp', '-dumpbase', 'sketch.ino.cpp', '-auxbase-strip', '/build/sketch.s', '-o', '/build/sketch.s')
    const cc = await this.run('cc1plus', args, [...this.headers(extra), ['/build/sketch.ino.cpp', cpp]], '/build/sketch.s')
    if (!cc.result) return fail(cc.messages, 'Derleme başarısız oldu.')

    const as = await this.run('avr-as', ['-mmcu=avr5', '-mno-skip-bug', '-o', '/build/sketch.o', '/build/sketch.s'], [['/build/sketch.s', cc.result]], '/build/sketch.o')
    if (!as.result) return fail(as.messages, 'Assembly aşaması başarısız oldu.')

    // Library objects, kept for the next build while the same libraries are in use.
    this.objects ??= new Map()
    const signature = used.map(({ library }) => `${library.name}@${library.version}`).sort().join(',')
    const objects = []
    if (queue.some(([path]) => /\.(c|S)$/.test(path))) await store.platform()
    const sources = queue.slice(1)
    for (const [index, [path, data]] of sources.entries()) {
      const key = `${OBJECTS_VERSION}|${signature}|${path}`
      if (!this.objects.has(key)) {
        const saved = await store?.savedObject(key)
        if (saved) this.objects.set(key, saved)
        else {
          const library = used.find(({ library: item }) => item.files.some(([file]) => file === path))?.library
          onStep({ library: library?.name ?? '', done: index, total: sources.length })
          const compiled = await this.compileSource(path, data, dirs, extra)
          if (!compiled.object) return fail(compiled.errors, `${path.replace('/libs-src/', '')} derlenemedi.`)
          this.objects.set(key, compiled.object)
          await store?.saveObject(key, compiled.object)
        }
      }
      objects.push([`/build/lib${objects.length}.o`, this.objects.get(key)])
    }

    const libraries = [...new Set(includes.flatMap((name) => LIBRARY_OBJECTS[name.split('/').pop()] ?? []))]
    const link = ['-mavr5', '-Tdata', '0x800100', '-o', '/build/sketch.elf', '/libs/crtatmega328p.o', '-L/libs', '--gc-sections', '/build/sketch.o', ...objects.map(([path]) => path), ...libraries]
    link.push('/libs/core.a', '-lm', '--start-group', '-lgcc', '-lm', '-lc', '-latmega328p', '--end-group')
    const ld = await this.run('avr-ld', link, [...this.under('/libs/', '/ldscripts/'), ['/build/sketch.o', as.result], ...objects], '/build/sketch.elf')
    if (!ld.result) return fail(ld.messages, 'Bağlama (link) aşaması başarısız oldu.')

    const objcopy = await this.run('avr-objcopy', ['-O', 'ihex', '-R', '.eeprom', '/build/sketch.elf', '/build/sketch.hex'], [['/build/sketch.elf', ld.result]], '/build/sketch.hex')
    if (!objcopy.result) return fail(objcopy.messages, '.hex dosyası oluşturulamadı.')

    const { flash, ram } = memoryUse(ld.result)
    if (flash > FLASH_BYTES) return { ok: false, errors: `Program Uno’ya sığmıyor: ${flash} bayt, en fazla ${FLASH_BYTES} bayt olabilir.` }
    const libraryList = used.map(({ library, header }) => ({ name: library.name, version: library.version, source: library.source, header }))
    return { ok: true, hex: new TextDecoder().decode(objcopy.result), flash, ram, libraries: libraryList }
  }
}
