// Compiles a sketch with GCC and binutils built for WebAssembly:
// cc1plus -> avr-as -> avr-ld -> avr-objcopy, the same steps and flags the
// Arduino IDE uses for an Uno (minus link-time optimisation). Each tool run
// gets a fresh Emscripten instance with an in-memory file system; the
// compiled WebAssembly is reused. Runs in a Web Worker or in Node.
import { findIncludes, preprocessSketch } from './preprocess.js'

const DEFINES = ['-D__AVR_ATmega328P__', '-D__AVR_DEVICE_NAME__=atmega328p', '-DF_CPU=16000000L', '-DARDUINO=10607', '-DARDUINO_AVR_UNO', '-DARDUINO_ARCH_AVR']
// What `avr-g++ -mmcu=atmega328p` hands cc1plus with the platform's flags.
const CC1PLUS = [
  '-quiet', '-imultilib', 'avr5', '-mn-flash=1', '-mno-skip-bug', '-mmcu=avr5', '-Os', '-w', '-Wno-error=narrowing', '-std=gnu++11', '-fpermissive',
  '-fno-exceptions', '-ffunction-sections', '-fdata-sections', '-fno-threadsafe-statics', '-fno-rtti', '-fno-enforce-eh-specs', '-fdiagnostics-color=never',
]
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

  // Returns { ok: true, hex, flash, ram } or { ok: false, errors }.
  async build(code) {
    await this.init()
    const includes = findIncludes(code)
    const cpp = new TextEncoder().encode(preprocessSketch(code))
    const fail = (messages, fallback) => {
      const text = messages
        .filter((line) => line.trim())
        .map((line) => line.replace(/^\/avr-ld: /, '').replace(/\/build\/sketch\.o/g, 'sketch.ino').replace(/sketch\.ino\.cpp:\([^)]*\): /, ''))
        .join('\n')
      const hint = /No such file or directory/.test(text) ? '\nSimülatörde kullanılabilen kütüphaneler: Servo, DHT (Adafruit), EEPROM ve avr-libc başlıkları.' : ''
      return { ok: false, errors: (text || fallback) + hint }
    }

    const args = [...CC1PLUS, ...DEFINES, ...SYSTEM.flatMap((dir) => ['-isystem', dir]), ...INCLUDE.flatMap((dir) => ['-I', dir])]
    args.push('/build/sketch.ino.cpp', '-dumpbase', 'sketch.ino.cpp', '-auxbase-strip', '/build/sketch.s', '-o', '/build/sketch.s')
    const cc = await this.run('cc1plus', args, [...this.under('/sysroot/', '/arduino/', '/libraries/'), ['/build/sketch.ino.cpp', cpp]], '/build/sketch.s')
    if (!cc.result) return fail(cc.messages, 'Derleme başarısız oldu.')

    const as = await this.run('avr-as', ['-mmcu=avr5', '-mno-skip-bug', '-o', '/build/sketch.o', '/build/sketch.s'], [['/build/sketch.s', cc.result]], '/build/sketch.o')
    if (!as.result) return fail(as.messages, 'Assembly aşaması başarısız oldu.')

    const libraries = [...new Set(includes.flatMap((name) => LIBRARY_OBJECTS[name.split('/').pop()] ?? []))]
    const link = ['-mavr5', '-Tdata', '0x800100', '-o', '/build/sketch.elf', '/libs/crtatmega328p.o', '-L/libs', '--gc-sections', '/build/sketch.o', ...libraries]
    link.push('/libs/core.a', '-lm', '--start-group', '-lgcc', '-lm', '-lc', '-latmega328p', '--end-group')
    const ld = await this.run('avr-ld', link, [...this.under('/libs/', '/ldscripts/'), ['/build/sketch.o', as.result]], '/build/sketch.elf')
    if (!ld.result) return fail(ld.messages, 'Bağlama (link) aşaması başarısız oldu.')

    const objcopy = await this.run('avr-objcopy', ['-O', 'ihex', '-R', '.eeprom', '/build/sketch.elf', '/build/sketch.hex'], [['/build/sketch.elf', ld.result]], '/build/sketch.hex')
    if (!objcopy.result) return fail(objcopy.messages, '.hex dosyası oluşturulamadı.')

    const { flash, ram } = memoryUse(ld.result)
    if (flash > FLASH_BYTES) return { ok: false, errors: `Program Uno’ya sığmıyor: ${flash} bayt, en fazla ${FLASH_BYTES} bayt olabilir.` }
    return { ok: true, hex: new TextDecoder().decode(objcopy.result), flash, ram }
  }
}
